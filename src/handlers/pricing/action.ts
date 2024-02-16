import { getLogger } from "../../bindings";
import { GLOBAL_STRINGS } from "../../configs";
import { addCommentToIssue, addLabelToIssue, clearAllPriceLabelsOnIssue, createLabel, getLabel, calculateWeight, getAllLabeledEvents } from "../../helpers";
import { BotContext, Payload, UserType } from "../../types";
import { handleLabelsAccess } from "../access";
import { getTargetPriceLabel } from "../shared";

export const pricingLabelLogic = async (context: BotContext): Promise<void> => {
  const config = context.botConfig;
  const logger = getLogger();
  const payload = context.payload as Payload;
  if (!payload.issue) return;
  const labels = payload.issue.labels;
  const labelNames = labels.map((i) => i.name);
  logger.info(`Checking if the issue is a parent issue.`);
  if (payload.issue.body && isParentIssue(payload.issue.body)) {
    logger.error(context, "Identified as parent issue. Disabling price label.");
    const issuePrices = labels.filter((label) => label.name.toString().startsWith("Price:"));
    if (issuePrices.length) {
      await addCommentToIssue(context, GLOBAL_STRINGS.skipPriceLabelGenerationComment, payload.issue.number);
      await clearAllPriceLabelsOnIssue(context);
    }
    return;
  }
  const valid = await handleLabelsAccess(context);

  if (!valid && config.accessControl.label) {
    return;
  }

  const { assistivePricing } = config.mode;
  const timeLabels = config.price.timeLabels.filter((item) => labels.map((i) => i.name).includes(item.name));
  const priorityLabels = config.price.priorityLabels.filter((item) => labels.map((i) => i.name).includes(item.name));

  const minTimeLabel = timeLabels.length > 0 ? timeLabels.reduce((a, b) => (calculateWeight(a) < calculateWeight(b) ? a : b)).name : undefined;
  const minPriorityLabel = priorityLabels.length > 0 ? priorityLabels.reduce((a, b) => (calculateWeight(a) < calculateWeight(b) ? a : b)).name : undefined;

  const targetPriceLabel = getTargetPriceLabel(context, minTimeLabel, minPriorityLabel);

  if (targetPriceLabel) {
    const _targetPriceLabel = labelNames.find((name) => name.includes("Price") && name.includes(targetPriceLabel));

    if (_targetPriceLabel) {
      // get all issue events of type "labeled" and the event label includes Price
      let labeledEvents = await getAllLabeledEvents(context);
      if (!labeledEvents) return;

      labeledEvents = labeledEvents.filter((event) => event.label?.name.includes("Price"));
      if (!labeledEvents.length) return;

      // check if the latest price label has been added by a user
      if (labeledEvents[labeledEvents.length - 1].actor?.type == UserType.User) {
        logger.info(`Skipping... already exists`);
      } else {
        // add price label to issue becuase wrong price has been added by bot
        logger.info(`Adding price label to issue`);
        await clearAllPriceLabelsOnIssue(context);

        const exist = await getLabel(context, targetPriceLabel);

        if (assistivePricing && !exist) {
          logger.info(`${targetPriceLabel} doesn't exist on the repo, creating...`);
          await createLabel(context, targetPriceLabel, "price");
        }
        await addLabelToIssue(context, targetPriceLabel);
      }
    } else {
      // add price if there is none
      logger.info(`Adding price label to issue`);
      await clearAllPriceLabelsOnIssue(context);

      const exist = await getLabel(context, targetPriceLabel);

      if (assistivePricing && !exist) {
        logger.info(`${targetPriceLabel} doesn't exist on the repo, creating...`);
        await createLabel(context, targetPriceLabel, "price");
      }
      await addLabelToIssue(context, targetPriceLabel);
    }
  } else {
    await clearAllPriceLabelsOnIssue(context);
    logger.info(`Skipping action...`);
  }
};

export const isParentIssue = (body: string) => {
  const parentPattern = /-\s+\[( |x)\]\s+#\d+/;
  return body.match(parentPattern);
};
