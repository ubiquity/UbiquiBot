import { UserCommands } from "../../../types";
import { IssueCommentCommands } from "../commands";
import { assign } from "./assign";
import { listAvailableCommands } from "./help";
import { payout } from "./payout";
import { unassign } from "./unassign";
import { registerWallet } from "./wallet";

export * from "./assign";
export * from "./wallet";
export * from "./unassign";
export * from "./payout";
export * from "./help";

/**
 * Parses the comment body and figure out the command name a user wants
 *
 *
 * @param body - The comment body
 * @returns The list of command names the comment includes
 */
export const commentParser = (body: string): IssueCommentCommands[] => {
  // TODO: As a starting point, it may be simple but there could be cases for the comment to includes one or more commands
  // We need to continuously improve to parse even complex comments. Right now, we implement it simply.
  const commandList = Object.values(IssueCommentCommands) as string[];
  const result = commandList.filter((command: string) => body.includes(command));
  return result as IssueCommentCommands[];
};

export const userCommands: UserCommands[] = [
  {
    id: IssueCommentCommands.ASSIGN,
    description: "Assign the origin sender to the issue automatically.",
    handler: assign,
  },
  {
    id: IssueCommentCommands.UNASSIGN,
    description: "Unassign the origin sender from the issue automatically.",
    handler: unassign,
  },
  {
    handler: listAvailableCommands,
    id: IssueCommentCommands.HELP,
    description: "List all available commands.",
  },
  {
    id: IssueCommentCommands.PAYOUT,
    description: "Disable automatic payment for the issue.",
    handler: payout,
  },
  {
    id: IssueCommentCommands.WALLET,
    description: `<WALLET_ADDRESS | ENS_NAME>: Register the hunter's wallet address. \n  ex1: /wallet 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 \n  ex2: /wallet vitalik.eth\n`,
    handler: registerWallet,
  },
];
