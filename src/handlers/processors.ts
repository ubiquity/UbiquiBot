import { GithubEvent, Handler, WildCardHandler } from "../types";
import { closePullRequestForAnIssue, startCommandHandler } from "./assign";
import { pricingLabel, syncPriceLabelsToConfig } from "./pricing";
import { checkTasksToUnassign } from "./wildcard";

import { checkPullRequests } from "./assign/auto";
import { commentCreatedOrEdited } from "./comment/action";
import { issueClosedCallback } from "./comment/handlers/issue/issue-closed-callback";
import { issueReopenedCallback } from "./comment/handlers/issue/issue-reopened-callback";
import { findDuplicateIssue } from "./issue";
import { watchLabelChange } from "./label";
import { createDevPoolPR } from "./pull-request";
import { validateConfigChange } from "./push";
import { checkModifiedBaseRate } from "./push/check-modified-base-rate";

/**
 * @dev
 * pre and post handlers do not return a message to comment on the issue. their return type MUST BE `void`
 * action MUST return a message to comment on the issue. its return type MUST BE either `string` or `LogReturn`
 */

export const processors: Record<string, Handler> = {
  [GithubEvent.ISSUES_OPENED]: {
    pre: [],
    action: [],
    post: [findDuplicateIssue],
  },
  [GithubEvent.ISSUES_REOPENED]: {
    pre: [],
    action: [issueReopenedCallback],
    post: [],
  },
  [GithubEvent.ISSUES_LABELED]: {
    pre: [syncPriceLabelsToConfig],
    action: [pricingLabel],
    post: [],
  },
  [GithubEvent.ISSUES_UNLABELED]: {
    pre: [syncPriceLabelsToConfig],
    action: [pricingLabel],
    post: [],
  },
  [GithubEvent.ISSUES_ASSIGNED]: {
    pre: [],
    action: [startCommandHandler],
    post: [],
  },
  [GithubEvent.ISSUES_UNASSIGNED]: {
    pre: [],
    action: [closePullRequestForAnIssue],
    post: [],
  },
  [GithubEvent.ISSUE_COMMENT_CREATED]: {
    pre: [],
    action: [],
    post: [commentCreatedOrEdited],
  },
  [GithubEvent.ISSUE_COMMENT_EDITED]: {
    pre: [],
    action: [],
    post: [commentCreatedOrEdited],
  },
  [GithubEvent.ISSUES_CLOSED]: {
    pre: [],
    action: [issueClosedCallback],
    post: [],
  },
  [GithubEvent.PULL_REQUEST_OPENED]: {
    pre: [],
    action: [checkPullRequests],
    post: [],
  },
  [GithubEvent.INSTALLATION_ADDED_EVENT]: {
    pre: [],
    action: [createDevPoolPR],
    post: [],
  },
  [GithubEvent.PUSH_EVENT]: {
    pre: [validateConfigChange],
    action: [],
    post: [checkModifiedBaseRate],
  },
  [GithubEvent.LABEL_EDITED]: {
    pre: [],
    action: [watchLabelChange],
    post: [],
  },
};

export const wildcardProcessors: WildCardHandler[] = [checkTasksToUnassign]; // The handlers which will run after every event
