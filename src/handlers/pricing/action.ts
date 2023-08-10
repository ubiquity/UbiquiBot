import { getBotConfig, getBotContext, getLogger } from "../../bindings";
import { addLabelToIssue, clearAllPriceLabelsOnIssue, createLabel, getLabel } from "../../helpers";
import { Payload } from "../../types";
import { handleLabelsAccess } from "../access";
import { getTargetPriceLabel } from "../shared";

export const pricingLabelLogic = async (): Promise<void> => {
  const context = getBotContext();
  const config = getBotConfig();
  const logger = getLogger();
  const payload = context.payload as Payload;
  if (!payload.issue) return;
  const labels = payload.issue.labels;

  const valid = await handleLabelsAccess();

  if (!valid) {
    return;
  }

  const { assistivePricing } = config.mode;
  const timeLabels = config.price.timeLabels.filter((item) => labels.map((i) => i.name).includes(item.name));
  const priorityLabels = config.price.priorityLabels.filter((item) => labels.map((i) => i.name).includes(item.name));

  const minTimeLabel = timeLabels.length > 0 ? timeLabels.reduce((a, b) => (a.weight < b.weight ? a : b)).name : undefined;
  const minPriorityLabel = priorityLabels.length > 0 ? priorityLabels.reduce((a, b) => (a.weight < b.weight ? a : b)).name : undefined;

  const targetPriceLabel = getTargetPriceLabel(minTimeLabel, minPriorityLabel);
  if (targetPriceLabel) {
    if (labels.map((i) => i.name).includes(targetPriceLabel)) {
      logger.info(`Skipping... already exists`);
    } else {
      logger.info(`Adding price label to issue`);
      await clearAllPriceLabelsOnIssue();

      const exist = await getLabel(targetPriceLabel);

      if (assistivePricing && !exist) {
        logger.info(`${targetPriceLabel} doesn't exist on the repo, creating...`);
        await createLabel(targetPriceLabel, "price");
      }
      await addLabelToIssue(targetPriceLabel);
    }
  } else {
    await clearAllPriceLabelsOnIssue();
    logger.info(`Skipping action...`);
  }
};
