import Runtime from "../../bindings/bot-runtime";

export async function nullHandler() {
  // This is just a null handler to do nothing. just needed for mockup
  // This would be replaced with the meaningful handler once its feature determined
  const runtime = Runtime.getState();
  const logger = runtime.logger;
  logger.debug("Running null handler", { name: nullHandler.name });
}
