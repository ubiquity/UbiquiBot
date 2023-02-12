import { Input } from "telegraf";
import { getNextAdapters, getNextBotConfig } from "../../../bindings";
import { TLMessageFormattedPayload, TLMessagePayload, TLPhotoPayload } from "../types/payload";

export const messageFormatter = (messagePayload: TLMessagePayload) => {
  const { action, title, description, id, ref, user } = messagePayload;
  const msgObj =
    `<b>${action}: ${title}</b> ` +
    `<a href="${ref}">#${id}</a> ` +
    `<code>@</code>` +
    `<a href="https://github.com/${user}">${user}</a>\n` +
    `<code>${description}</code>`;

  return msgObj;
};

export const telegramFormattedNotifier = async (messagePayload: TLMessageFormattedPayload) => {
  const {
    telegram: { delay },
  } = await getNextBotConfig();
  const { telegram } = await getNextAdapters();
  const { chatIds, text, parseMode } = messagePayload;

  let currentElem = 0;

  const sendHandler = () => {
    if (currentElem === chatIds.length) {
      return;
    }

    const sendInterval = setInterval(async () => {
      clearInterval(sendInterval);
      await telegram.sendMessage(chatIds[currentElem], text, { parse_mode: parseMode });
      currentElem++;
      sendHandler();
    }, delay);
  };
  sendHandler();
};

export const telegramNotifier = (messagePayload: TLMessagePayload) => {
  const messageString = messageFormatter(messagePayload);
  const messageObj: TLMessageFormattedPayload = {
    chatIds: messagePayload.chatIds,
    text: messageString,
    parseMode: "HTML",
  };
  telegramFormattedNotifier(messageObj);
};

export const telegramPhotoNotifier = async (messagePayload: TLPhotoPayload) => {
  const { chatId, file, caption } = messagePayload;
  const { telegram } = await getNextAdapters();
  await telegram.sendPhoto(chatId, Input.fromLocalFile(file), { caption: caption, parse_mode: "HTML" });
};
