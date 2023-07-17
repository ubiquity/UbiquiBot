import { getWalletAddress, getWalletMultiplier } from "../../adapters/supabase";
import { getBotConfig, getBotContext, getLogger } from "../../bindings";
import { addLabelToIssue, deleteLabel, generatePermit2Signature, getAllIssueComments, getTokenSymbol } from "../../helpers";
import {UserType, Payload, StateReason } from "../../types";
import { shortenEthAddress } from "../../utils";
import { bountyInfo } from "../wildcard";

export const handleIssueClosed = async () => {
  const context = getBotContext();
  const {
    payout: { paymentToken, rpc },
    mode: { autoPayMode },
  } = getBotConfig();
  const logger = getLogger();
  const payload = context.payload as Payload;
  const issue = payload.issue;
  if (!issue) return;

  if (issue.state_reason !== StateReason.COMPLETED) {
    logger.info("Permit generation skipped because the issue was not closed as completed");
    return "Permit generation skipped because the issue was not closed as completed";
  }

  logger.info(`Handling issues.closed event, issue: ${issue.number}`);
  if (!autoPayMode) {
    logger.info(`Skipping to generate permit2 url, reason: { autoPayMode: ${autoPayMode}}`);
    return `Permit generation skipped since autoPayMode is disabled`;
  }
  const issueDetailed = bountyInfo(issue);
  if (!issueDetailed.isBounty) {
    logger.info(`Skipping... its not a bounty`);
    return `Permit generation skipped since this issue didn't qualify as bounty`;
  }

  const assignees = issue?.assignees ?? [];
  const assignee = assignees.length > 0 ? assignees[0] : undefined;
  if (!assignee) {
    logger.info("Skipping to proceed the payment because `assignee` is undefined");
    return `Permit generation skipped since assignee is undefined`;
  }

  if (!issueDetailed.priceLabel) {
    logger.info("Skipping to proceed the payment because price not set");
    return `Permit generation skipped since price label is not set`;
  }

  const recipient = await getWalletAddress(assignee.login);
  const multiplier = await getWalletMultiplier(assignee.login);

  if (multiplier === 0) {
    const errMsg = "Refusing to generate the payment permit because " + `@${assignee.login}` + "'s payment `multiplier` is `0`";
    logger.info(errMsg);
    return errMsg;
  }

  // TODO: add multiplier to the priceInEth
  const priceInEth = (+issueDetailed.priceLabel.substring(7, issueDetailed.priceLabel.length - 4) * multiplier).toString();
  if (!recipient || recipient?.trim() === "") {
    logger.info(`Recipient address is missing`);
    return (
      "Please set your wallet address by using the `/wallet` command.\n" +
      "```\n" +
      "/wallet example.eth\n" +
      "/wallet 0xBf...CdA\n" +
      "```\n" +
      "@" +
      assignee.login
    );
  }

  const payoutUrl = await generatePermit2Signature(recipient, priceInEth, issue.node_id);
  const tokenSymbol = await getTokenSymbol(paymentToken, rpc);
  const shortenRecipient = shortenEthAddress(recipient, `[ CLAIM ${priceInEth} ${tokenSymbol.toUpperCase()} ]`.length);
  logger.info(`Posting a payout url to the issue, url: ${payoutUrl}`);
  const comment = `### [ **[ CLAIM ${priceInEth} ${tokenSymbol.toUpperCase()} ]** ](${payoutUrl})\n` + "```" + shortenRecipient + "```";
  const comments = await getAllIssueComments(issue.number);
  const permitComments = comments.filter((content) => content.body.includes("https://pay.ubq.fi?claim=") && content.user.type == UserType.Bot);
    if (permitComments.length > 0) {
    logger.info(`Skip to generate a permit url because it has been already posted`);
    return `Permit generation skipped because it was already posted to this issue.`;
  }
  await deleteLabel(issueDetailed.priceLabel);
  await addLabelToIssue("Permitted");
  return comment;
};
