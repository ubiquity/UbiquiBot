import { getWalletAddress } from "../../adapters/supabase";
import { getBotContext, getLogger } from "../../bindings";
import { getAllIssueComments, getAllPullRequestReviews, getIssueDescription, parseComments } from "../../helpers";
import { getLatestPullRequest, gitLinkedPrParser } from "../../helpers/parser";
import { Incentives, Payload, UserType } from "../../types";
import { RewardsResponse, commentParser } from "../comment";
import Decimal from "decimal.js";
import { bountyInfo } from "../wildcard";
import { IncentivesCalculationResult } from "./action";
import { BigNumber } from "ethers";

export interface CreatorCommentResult {
  title: string;
  account?: string | undefined;
  amountInETH?: Decimal | undefined;
  userId?: string | undefined;
  tokenSymbol?: string | undefined;
  node_id?: string | undefined;
  user?: string | undefined;
}

/**
 * Incentivize the contributors based on their contribution.
 * The default formula has been defined in https://github.com/ubiquity/ubiquibot/issues/272
 */
export const calculateIssueConversationReward = async (calculateIncentives: IncentivesCalculationResult): Promise<RewardsResponse> => {
  const title = `Issue-Comments`;
  const logger = getLogger();

  const context = getBotContext();
  const payload = context.payload as Payload;
  const issue = payload.issue;

  const assignees = issue?.assignees ?? [];
  const assignee = assignees.length > 0 ? assignees[0] : undefined;
  if (!assignee) {
    logger.info("incentivizeComments: skipping payment permit generation because `assignee` is `undefined`.");
    return { error: "incentivizeComments: skipping payment permit generation because `assignee` is `undefined`." };
  }

  const issueComments = await getAllIssueComments(calculateIncentives.issue.number, "full");
  logger.info(`Getting the issue comments done. comments: ${JSON.stringify(issueComments)}`);
  const issueCommentsByUser: Record<string, { id: number; comments: string[] }> = {};
  for (const issueComment of issueComments) {
    const user = issueComment.user;
    if (user.type == UserType.Bot || user.login == assignee.login) continue;
    const commands = commentParser(issueComment.body);
    if (commands.length > 0) {
      logger.info(`Skipping to parse the comment because it contains commands. comment: ${JSON.stringify(issueComment)}`);
      continue;
    }
    if (!issueComment.body_html) {
      logger.info(`Skipping to parse the comment because body_html is undefined. comment: ${JSON.stringify(issueComment)}`);
      continue;
    }

    // Store the comment along with user's login and node_id
    if (!issueCommentsByUser[user.login]) {
      issueCommentsByUser[user.login] = { id: user.id, comments: [] };
    }
    issueCommentsByUser[user.login].comments.push(issueComment.body_html);
  }
  logger.info(`Filtering by the user type done. commentsByUser: ${JSON.stringify(issueCommentsByUser)}`);

  // The mapping between gh handle and amount in ETH
  const fallbackReward: Record<string, Decimal> = {};

  // array of awaiting permits to generate
  const reward: {
    account: string;
    priceInEth: Decimal;
    userId: number;
    user: string;
    penaltyAmount: BigNumber;
    debug: Record<string, { count: number; reward: Decimal }>;
  }[] = [];

  for (const user of Object.keys(issueCommentsByUser)) {
    const commentsByUser = issueCommentsByUser[user];
    const commentsByNode = await parseComments(commentsByUser.comments);
    const rewardValue = calculateRewardValue(commentsByNode, calculateIncentives.incentives);
    if (rewardValue.sum.equals(0)) {
      logger.info(`Skipping to generate a permit url because the reward value is 0. user: ${user}`);
      continue;
    }
    logger.debug(`Comment parsed for the user: ${user}. comments: ${JSON.stringify(commentsByNode)}, sum: ${rewardValue.sum}`);
    const account = await getWalletAddress(user);
    const priceInEth = rewardValue.sum.mul(calculateIncentives.baseMultiplier);
    if (priceInEth.gt(calculateIncentives.paymentPermitMaxPrice)) {
      logger.info(`Skipping comment reward for user ${user} because reward is higher than payment permit max price`);
      continue;
    }
    if (account) {
      reward.push({ account, priceInEth, userId: commentsByUser.id, user, penaltyAmount: BigNumber.from(0), debug: rewardValue.sumByType });
    } else {
      fallbackReward[user] = priceInEth;
    }
  }

  return { error: "", title, reward, fallbackReward };
};

export const calculateIssueCreatorReward = async (incentivesCalculation: IncentivesCalculationResult): Promise<RewardsResponse> => {
  const title = `Issue-Creation`;
  const logger = getLogger();

  const issueDetailed = bountyInfo(incentivesCalculation.issue);
  if (!issueDetailed.isBounty) {
    logger.info(`incentivizeCreatorComment: its not a bounty`);
    return { error: `incentivizeCreatorComment: its not a bounty` };
  }

  const assignees = incentivesCalculation.issue.assignees ?? [];
  const assignee = assignees.length > 0 ? assignees[0] : undefined;
  if (!assignee) {
    logger.info("incentivizeCreatorComment: skipping payment permit generation because `assignee` is `undefined`.");
    return { error: "incentivizeCreatorComment: skipping payment permit generation because `assignee` is `undefined`." };
  }

  const description = await getIssueDescription(incentivesCalculation.issue.number, "html");
  if (!description) {
    logger.info(`Skipping to generate a permit url because issue description is empty. description: ${description}`);
    return { error: `Skipping to generate a permit url because issue description is empty. description: ${description}` };
  }
  logger.info(`Getting the issue description done. description: ${description}`);
  const creator = incentivesCalculation.issue.user;
  if (creator.type === UserType.Bot || creator.login === incentivesCalculation.issue.assignee) {
    logger.info("Issue creator assigneed himself or Bot created this issue.");
    return { error: "Issue creator assigneed himself or Bot created this issue." };
  }

  const result = await generatePermitForComments(
    creator.login,
    [description],
    incentivesCalculation.issueCreatorMultiplier,
    incentivesCalculation.incentives,
    incentivesCalculation.paymentPermitMaxPrice
  );

  if (!result || !result.account || !result.amountInETH) {
    throw new Error("Failed to generate permit for issue creator because of missing account or amountInETH");
  }

  return {
    error: "",
    title,
    userId: creator.id,
    username: creator.login,
    reward: [
      {
        priceInEth: result?.amountInETH ?? new Decimal(0),
        account: result?.account,
        userId: creator.id,
        user: "",
        penaltyAmount: BigNumber.from(0),
        debug: {},
      },
    ],
  };
};

export const calculatePullRequestReviewsReward = async (incentivesCalculation: IncentivesCalculationResult): Promise<RewardsResponse> => {
  const logger = getLogger();
  const context = getBotContext();
  const title = "Review-Reviewer";

  const linkedPullRequest = await gitLinkedPrParser({
    owner: incentivesCalculation.payload.repository.owner.login,
    repo: incentivesCalculation.payload.repository.name,
    issue_number: incentivesCalculation.issue.number,
  });

  const latestLinkedPullRequest = await getLatestPullRequest(linkedPullRequest);

  if (!latestLinkedPullRequest) {
    logger.debug(`calculatePullRequestReviewsReward: No linked pull requests found`);
    return { error: `calculatePullRequestReviewsReward: No linked pull requests found` };
  }

  const assignees = incentivesCalculation.issue?.assignees ?? [];
  const assignee = assignees.length > 0 ? assignees[0] : undefined;
  if (!assignee) {
    logger.info("calculatePullRequestReviewsReward: skipping payment permit generation because `assignee` is `undefined`.");
    return { error: "calculatePullRequestReviewsReward: skipping payment permit generation because `assignee` is `undefined`." };
  }

  const prReviews = await getAllPullRequestReviews(context, latestLinkedPullRequest.number, "full");
  const prComments = await getAllIssueComments(latestLinkedPullRequest.number, "full");
  logger.info(`Getting the PR reviews done. comments: ${JSON.stringify(prReviews)}`);
  const prReviewsByUser: Record<string, { id: number; comments: string[] }> = {};
  for (const review of prReviews) {
    const user = review.user;
    if (!user) continue;
    if (user.type == UserType.Bot || user.login == assignee) continue;
    if (!review.body_html) {
      logger.info(`calculatePullRequestReviewsReward: Skipping to parse the comment because body_html is undefined. comment: ${JSON.stringify(review)}`);
      continue;
    }
    if (!prReviewsByUser[user.login]) {
      prReviewsByUser[user.login] = { id: user.id, comments: [] };
    }
    prReviewsByUser[user.login].comments.push(review.body_html);
  }

  for (const comment of prComments) {
    const user = comment.user;
    if (!user) continue;
    if (user.type == UserType.Bot || user.login == assignee) continue;
    if (!comment.body_html) {
      logger.info(`calculatePullRequestReviewsReward: Skipping to parse the comment because body_html is undefined. comment: ${JSON.stringify(comment)}`);
      continue;
    }
    if (!prReviewsByUser[user.login]) {
      prReviewsByUser[user.login] = { id: user.id, comments: [] };
    }
    prReviewsByUser[user.login].comments.push(comment.body_html);
  }

  logger.info(`calculatePullRequestReviewsReward: Filtering by the user type done. commentsByUser: ${JSON.stringify(prReviewsByUser)}`);

  // array of awaiting permits to generate
  const reward: {
    account: string;
    priceInEth: Decimal;
    userId: number;
    user: string;
    penaltyAmount: BigNumber;
    debug: Record<string, { count: number; reward: Decimal }>;
  }[] = [];

  // The mapping between gh handle and amount in ETH
  const fallbackReward: Record<string, Decimal> = {};

  for (const user of Object.keys(prReviewsByUser)) {
    const commentByUser = prReviewsByUser[user];
    const commentsByNode = await parseComments(commentByUser.comments);
    const rewardValue = calculateRewardValue(commentsByNode, incentivesCalculation.incentives);

    if (rewardValue.sum.equals(0)) {
      logger.info(`calculatePullRequestReviewsReward: Skipping to generate a permit url because the reward value is 0. user: ${user}`);
      continue;
    }
    logger.info(
      `calculatePullRequestReviewsReward: Comment parsed for the user: ${user}. comments: ${JSON.stringify(commentsByNode)}, sum: ${rewardValue.sum}`
    );
    const account = await getWalletAddress(user);
    const priceInEth = rewardValue.sum.mul(incentivesCalculation.baseMultiplier);
    if (priceInEth.gt(incentivesCalculation.paymentPermitMaxPrice)) {
      logger.info(`calculatePullRequestReviewsReward: Skipping comment reward for user ${user} because reward is higher than payment permit max price`);
      continue;
    }

    if (account) {
      reward.push({ account, priceInEth, userId: commentByUser.id, user, penaltyAmount: BigNumber.from(0), debug: rewardValue.sumByType });
    } else {
      fallbackReward[user] = priceInEth;
    }
  }

  logger.info(`calculatePullRequestReviewsReward: Permit url generated for pull request reviewers. reward: ${JSON.stringify(reward)}`);
  logger.info(`calculatePullRequestReviewsReward: Skipping to generate a permit url for missing accounts. fallback: ${JSON.stringify(fallbackReward)}`);

  return { error: "", title, reward, fallbackReward };
};

const generatePermitForComments = async (
  user: string,
  comments: string[],
  multiplier: number,
  incentives: Incentives,
  paymentPermitMaxPrice: number
): Promise<undefined | { account: string; amountInETH: Decimal }> => {
  const logger = getLogger();
  const commentsByNode = await parseComments(comments);
  const rewardValue = calculateRewardValue(commentsByNode, incentives);
  if (rewardValue.sum.equals(0)) {
    logger.info(`No reward for the user: ${user}. comments: ${JSON.stringify(commentsByNode)}, sum: ${rewardValue}`);
    return;
  }
  logger.debug(`Comment parsed for the user: ${user}. comments: ${JSON.stringify(commentsByNode)}, sum: ${rewardValue.sum}`);
  const account = await getWalletAddress(user);
  const amountInETH = rewardValue.sum.mul(multiplier);
  if (amountInETH.gt(paymentPermitMaxPrice)) {
    logger.info(`Skipping issue creator reward for user ${user} because reward is higher than payment permit max price`);
    return;
  }
  if (account) {
    return { account, amountInETH };
  } else {
    return { account: "0x", amountInETH: new Decimal(0) };
  }
};
/**
 * @dev Calculates the reward values for a given comments. We'll improve the formula whenever we get the better one.
 *
 * @param comments - The comments to calculate the reward for
 * @param incentives - The basic price table for reward calculation
 * @returns - The reward value
 */
const calculateRewardValue = (
  comments: Record<string, string[]>,
  incentives: Incentives
): { sum: Decimal; sumByType: Record<string, { count: number; reward: Decimal }> } => {
  let sum = new Decimal(0);
  const sumByType: Record<string, { count: number; reward: Decimal }> = {};

  for (const key of Object.keys(comments)) {
    const value = comments[key];

    // Initialize the sum for this key if it doesn't exist
    if (!sumByType[key]) {
      sumByType[key] = {
        count: 0,
        reward: new Decimal(0),
      };
    }

    // if it's a text node calculate word count and multiply with the reward value
    if (key == "#text") {
      if (!incentives.comment.totals.word) {
        continue;
      }
      const wordReward = new Decimal(incentives.comment.totals.word);
      const wordCount = value.map((str) => str.trim().split(" ").length).reduce((totalWords, wordCount) => totalWords + wordCount, 0);
      const reward = wordReward.mul(wordCount);
      sumByType[key].count += wordCount;
      sumByType[key].reward = wordReward;
      sum = sum.add(reward);
    } else {
      if (!incentives.comment.elements[key]) {
        continue;
      }
      const rewardValue = new Decimal(incentives.comment.elements[key]);
      const reward = rewardValue.mul(value.length);
      sumByType[key].count += value.length;
      sumByType[key].reward = rewardValue;
      sum = sum.add(reward);
    }
  }

  return { sum, sumByType };
};
