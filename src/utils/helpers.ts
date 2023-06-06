import { DEFAULT_CHAIN_ID, DefaultPriceConfig } from "../configs";
import { CommentElementPricing } from "../types";
import { WideLabel, WideOrgConfig, WideRepoConfig } from "./private";

export const getChainId = (parsedRepo: WideRepoConfig | undefined, parsedOrg: WideOrgConfig | undefined): number => {
  if (parsedRepo && parsedRepo["chain-id"] && !Number.isNaN(Number(parsedRepo["chain-id"]))) {
    return Number(parsedRepo["chain-id"]);
  } else if (parsedOrg && parsedOrg["chain-id"] && !Number.isNaN(Number(parsedOrg["chain-id"]))) {
    return Number(parsedOrg["chain-id"]);
  } else {
    return DEFAULT_CHAIN_ID;
  }
};

export const getBaseMultiplier = (parsedRepo: WideRepoConfig | undefined, parsedOrg: WideOrgConfig | undefined): number => {
  if (parsedRepo && parsedRepo["base-multiplier"] && !Number.isNaN(Number(parsedRepo["base-multiplier"]))) {
    return Number(parsedRepo["base-multiplier"]);
  } else if (parsedOrg && parsedOrg["base-multiplier"] && !Number.isNaN(Number(parsedOrg["base-multiplier"]))) {
    return Number(parsedOrg["base-multiplier"]);
  } else {
    return Number(DefaultPriceConfig["baseMultiplier"]);
  }
};

export const getCreatorMultiplier = (parsedRepo: WideRepoConfig | undefined, parsedOrg: WideOrgConfig | undefined): number => {
  if (parsedRepo && parsedRepo["issue-creator-multiplier"] && !Number.isNaN(Number(parsedRepo["issue-creator-multiplier"]))) {
    return Number(parsedRepo["issue-creator-multiplier"]);
  } else if (parsedOrg && parsedOrg["issue-creator-multiplier"] && !Number.isNaN(Number(parsedOrg["issue-creator-multiplier"]))) {
    return Number(parsedOrg["issue-creator-multiplier"]);
  } else {
    return Number(DefaultPriceConfig["issueCreatorMultiplier"]);
  }
};

export const getTimeLabels = (parsedRepo: WideRepoConfig | undefined, parsedOrg: WideOrgConfig | undefined): WideLabel[] => {
  if (parsedRepo && parsedRepo["time-labels"] && Array.isArray(parsedRepo["time-labels"]) && parsedRepo["time-labels"].length > 0) {
    return parsedRepo["time-labels"];
  } else if (parsedOrg && parsedOrg["time-labels"] && Array.isArray(parsedOrg["time-labels"]) && parsedOrg["time-labels"].length > 0) {
    return parsedOrg["time-labels"];
  } else {
    return DefaultPriceConfig["timeLabels"];
  }
};

export const getPriorityLabels = (parsedRepo: WideRepoConfig | undefined, parsedOrg: WideOrgConfig | undefined): WideLabel[] => {
  if (parsedRepo && parsedRepo["priority-labels"] && Array.isArray(parsedRepo["priority-labels"]) && parsedRepo["priority-labels"].length > 0) {
    return parsedRepo["priority-labels"];
  } else if (parsedOrg && parsedOrg["priority-labels"] && Array.isArray(parsedOrg["priority-labels"]) && parsedOrg["priority-labels"].length > 0) {
    return parsedOrg["priority-labels"];
  } else {
    return DefaultPriceConfig["priorityLabels"];
  }
};

export const getCommentItemPrice = (parsedRepo: WideRepoConfig | undefined, parsedOrg: WideOrgConfig | undefined): CommentElementPricing => {
  if (parsedRepo && parsedRepo["comment-element-pricing"]) {
    return parsedRepo["comment-element-pricing"];
  } else if (parsedOrg && parsedOrg["comment-element-pricing"]) {
    return parsedOrg["comment-element-pricing"];
  } else {
    return DefaultPriceConfig["commentElementPricing"];
  }
};

export const getAutoPayMode = (parsedRepo?: WideRepoConfig, parsedOrg?: WideOrgConfig): boolean => {
  if (parsedRepo && parsedRepo["auto-pay-mode"] && typeof parsedRepo["auto-pay-mode"] === "boolean") {
    return parsedRepo["auto-pay-mode"];
  } else if (parsedOrg && parsedOrg["auto-pay-mode"] && typeof parsedOrg["auto-pay-mode"] === "boolean") {
    return parsedOrg["auto-pay-mode"];
  } else {
    return true;
  }
};

export const getAnalyticsMode = (parsedRepo: WideRepoConfig | undefined, parsedOrg: WideOrgConfig | undefined): boolean => {
  if (parsedRepo && parsedRepo["analytics-mode"] && typeof parsedRepo["analytics-mode"] === "boolean") {
    return parsedRepo["analytics-mode"];
  } else if (parsedOrg && parsedOrg["analytics-mode"] && typeof parsedOrg["analytics-mode"] === "boolean") {
    return parsedOrg["analytics-mode"];
  } else {
    return false;
  }
};

export const getIncentiveMode = (parsedRepo?: WideRepoConfig, parsedOrg?: WideOrgConfig): boolean => {
  if (parsedRepo && parsedRepo["incentive-mode"] && typeof parsedRepo["incentive-mode"] === "boolean") {
    return parsedRepo["incentive-mode"];
  } else if (parsedOrg && parsedOrg["incentive-mode"] && typeof parsedOrg["incentive-mode"] === "boolean") {
    return parsedOrg["incentive-mode"];
  } else {
    return false;
  }
};

export const getBountyHunterMax = (parsedRepo: WideRepoConfig | undefined, parsedOrg: WideOrgConfig | undefined): number => {
  if (parsedRepo && parsedRepo["max-concurrent-bounties"] && !Number.isNaN(Number(parsedRepo["max-concurrent-bounties"]))) {
    return Number(parsedRepo["max-concurrent-bounties"]);
  } else if (parsedOrg && parsedOrg["max-concurrent-bounties"] && !Number.isNaN(Number(parsedOrg!["max-concurrent-bounties"]))) {
    return Number(parsedOrg["max-concurrent-bounties"]);
  } else {
    return 2;
  }
};
