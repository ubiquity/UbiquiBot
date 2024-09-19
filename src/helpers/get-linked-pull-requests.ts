import { HTMLElement, parse } from "node-html-parser";
import { GetLinkedParams } from "../handlers/assign/check-pull-requests";
import { Context } from "../types/context";

interface GetLinkedResults {
  organization: string;
  repository: string;
  number: number;
  href: string;
}

export async function getLinkedPullRequests(
  context: Context,
  { owner, repository, issue }: GetLinkedParams
): Promise<GetLinkedResults[]> {
  const logger = context.logger;
  const collection: GetLinkedResults[] = [];

  try {
    const response = await fetch(`https://github.com/${owner}/${repository}/issues/${issue}`);

    if (!response.ok) {
      throw new Error(`GitHub responded with status ${response.status}`);
    }

    const html = await response.text();
    const dom = parse(html);

    const devForm = dom.querySelector("[data-target='create-branch.developmentForm']") as HTMLElement;
    const linkedList = devForm?.querySelectorAll(".my-1") || [];

    if (linkedList.length === 0) {
      logger.info(`No linked pull requests found`);
      return [];
    }

    for (const linked of linkedList) {
      const relativeHref = linked.querySelector("a")?.attrs?.href;
      if (!relativeHref) continue;
      const parts = relativeHref.split("/");

      if (parts.length < 4) continue;

      const organization = parts[parts.length - 4];
      const repo = parts[parts.length - 3];
      const number = Number(parts[parts.length - 1]);
      const href = `https://github.com${relativeHref}`;

      if (`${organization}/${repo}` !== `${owner}/${repository}`) {
        logger.info("Skipping linked pull request from another repository", href);
        continue;
      }

      collection.push({ organization, repository: repo, number, href });
    }

    return collection;
  } catch (error) {
    logger.error("Error fetching linked pull requests:", error);
    throw error;
  }
}
