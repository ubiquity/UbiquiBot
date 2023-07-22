export enum IssueCommentCommands {
  HELP = "/help", // list available commands
  ASSIGN = "/assign", // assign the hunter to the issue automatically
  UNASSIGN = "/unassign", // unassign to default
  WALLET = "/wallet", // register wallet address
  PAYOUT = "/payout", // request permit payout
  MULTIPLIER = "/multiplier", // set bounty multiplier (for treasury)
  QUERY = "/query",
  // Access Controls

  ALLOW = "/allow",
}
