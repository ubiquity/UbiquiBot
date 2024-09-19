import { HTMLElement, parse } from "node-html-parser";
import { getAllPullRequests, addAssignees } from "../../helpers/issue";
import { Context } from "../../types/context";

export async function checkPullRequests(context: Context) {
  const { logger, payload } = context;
  const pulls = await getAllPullRequests(context);

  if (pulls.length === 0) {
    return logger.debug(`No pull requests found at this time`);
  }

  for (const pull of pulls) {
    const linkedIssue = await getLinkedIssues({
      owner: payload.repository.owner.login,
      repository: payload.repository.name,
      pull: pull.number,
    });

    if (linkedIssue == null || !pull.user || !linkedIssue) {
      continue;
    }

    const connectedPull = await getPullByNumber(context, pull.number);

    if (connectedPull?.created_at !== connectedPull?.updated_at) {
      logger.debug("It's an updated Pull Request, reverting");
      continue;
    }

    const linkedIssueNumber = linkedIssue.substring(linkedIssue.lastIndexOf("/") + 1);
    const opener = pull.user.login;

    const issue = await getIssueByNumber(context, +linkedIssueNumber);
    if (!issue?.assignees) continue;

    if (issue.assignees.length > 0) {
      logger.debug(`Issue already assigned, ignoring...`);
      continue;
    }

    const assignedUsernames = issue.assignees.map((assignee) => assignee.login);
    if (!assignedUsernames.includes(opener)) {
      await addAssignees(context, +linkedIssueNumber, [opener]);
      logger.debug("Assigned pull request opener to issue", {
        pullRequest: pull.number,
        issue: linkedIssueNumber,
        opener,
      });
    }
  }
  return logger.debug(`Checking pull requests done!`);
}

export async function getLinkedIssues({ owner, repository, pull }: GetLinkedParams) {
  try {
    const response = await fetch(`https://github.com/${owner}/${repository}/pull/${pull}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.text();
    const dom = parse(data);
    const devForm = dom.querySelector("[data-target='create-branch.developmentForm']") as HTMLElement;
    const linkedIssues = devForm.querySelectorAll(".my-1");

    if (linkedIssues.length === 0) {
      return null;
    }

    const issueUrl = linkedIssues[0].querySelector("a")?.attrs?.href || null;
    return issueUrl;
  } catch (error) {
    console.error("Error fetching linked issues:", error);
    return null;
  }
}

export async function getPullByNumber(context: Context, pull: number) {
  const payload = context.payload;

  try {
    const response = await context.octokit.rest.pulls.get({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      pull_number: pull,
    });
    return response.data;
  } catch (err: unknown) {
    context.logger.fatal("Fetching pull request failed!", err);
    return;
  }
}

export async function getIssueByNumber(context: Context, issueNumber: number) {
  const payload = context.payload;
  try {
    const { data: issue } = await context.octokit.rest.issues.get({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: issueNumber,
    });
    return issue;
  } catch (e: unknown) {
    context.logger.fatal("Fetching issue failed!", e);
    return;
  }
}

export interface GetLinkedParams {
  owner: string;
  repository: string;
  issue?: number;
  pull?: number;
}
