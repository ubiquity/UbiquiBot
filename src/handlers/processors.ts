import { GithubEvent, Handler, ActionHandler } from "../types";
import { closePullRequestForAnIssue, commentWithAssignMessage } from "./assign";
import { pricingLabelLogic, validatePriceLabels } from "./pricing";
import { checkBountiesToUnassign, collectAnalytics, checkWeeklyUpdate } from "./wildcard";
import { nullHandler } from "./shared";
import { handleComment, issueClosedCallback, issueReopenedCallback } from "./comment";
import { checkPullRequests } from "./assign/auto";
import { createDevPoolPR } from "./pull-request";
import { runOnPush } from "./push";
import { incentivizeComments, incentivizeCreatorComment } from "./payout";

export const processors: Record<string, Handler> = {
  [GithubEvent.ISSUES_OPENED]: {
    pre: [nullHandler],
    action: [nullHandler], // SHOULD not set `issueCreatedCallback` until the exploit issue resolved.  https://github.com/ubiquity/ubiquibot/issues/535
    post: [nullHandler],
  },
  [GithubEvent.ISSUES_REOPENED]: {
    pre: [nullHandler],
    action: [issueReopenedCallback],
    post: [nullHandler],
  },
  [GithubEvent.ISSUES_LABELED]: {
    pre: [validatePriceLabels],
    action: [pricingLabelLogic],
    post: [nullHandler],
  },
  [GithubEvent.ISSUES_UNLABELED]: {
    pre: [validatePriceLabels],
    action: [pricingLabelLogic],
    post: [nullHandler],
  },
  [GithubEvent.ISSUES_ASSIGNED]: {
    pre: [nullHandler],
    action: [commentWithAssignMessage],
    post: [nullHandler],
  },
  [GithubEvent.ISSUES_UNASSIGNED]: {
    pre: [nullHandler],
    action: [closePullRequestForAnIssue],
    post: [nullHandler],
  },
  [GithubEvent.ISSUE_COMMENT_CREATED]: {
    pre: [nullHandler],
    action: [handleComment],
    post: [nullHandler],
  },
  [GithubEvent.ISSUE_COMMENT_EDITED]: {
    pre: [nullHandler],
    action: [handleComment],
    post: [nullHandler],
  },
  [GithubEvent.ISSUES_CLOSED]: {
    pre: [nullHandler],
    action: [issueClosedCallback],
    post: [incentivizeCreatorComment, incentivizeComments],
  },
  [GithubEvent.PULL_REQUEST_OPENED]: {
    pre: [nullHandler],
    action: [checkPullRequests],
    post: [nullHandler],
  },
  [GithubEvent.INSTALLATION_ADDED_EVENT]: {
    pre: [nullHandler],
    action: [createDevPoolPR],
    post: [nullHandler],
  },
  [GithubEvent.PUSH_EVENT]: {
    pre: [nullHandler],
    action: [runOnPush],
    post: [nullHandler],
  },
};

/**
 * @dev The handlers which will run on every event hooked
 */
export const wildcardProcessors: ActionHandler[] = [checkBountiesToUnassign, collectAnalytics, checkWeeklyUpdate];
