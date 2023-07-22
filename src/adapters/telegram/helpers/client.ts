import { Input } from "telegraf";
import { getAdapters, getBotConfig } from "../../../bindings";
import { TLMessageFormattedPayload, TLMessagePayload, TLPhotoPayload } from "../types/payload";

export function messageFormatter(messagePayload: TLMessagePayload) {
  const { action, title, description, id, ref, user } = messagePayload;
  const msgObj =
    `<b>${action}: ${title}</b> ` +
    `<a href="${ref}">#${id}</a> ` +
    `<code>@</code>` +
    `<a href="https://github.com/${user}">${user}</a>\n` +
    `<code>${description}</code>`;

  return msgObj;
}

export async function telegramFormattedNotifier(messagePayload: TLMessageFormattedPayload) {
  const {
    telegram: { delay },
  } = getBotConfig();
  const { telegram } = getAdapters();
  const { chatIds, text, parseMode } = messagePayload;

  let currentElem = 0;

  const sendHandler = () => {
    if (currentElem === chatIds.length) {
      return;
    }

    const sendInterval = setInterval(async () => {
      clearInterval(sendInterval);
      await telegram.sendMessage(chatIds[currentElem], text, {
        parse_mode: parseMode,
      });
      currentElem++;
      sendHandler();
    }, delay);
  };
  sendHandler();
}

export async function telegramNotifier(messagePayload: TLMessagePayload) {
  const messageString = messageFormatter(messagePayload);
  const messageObj: TLMessageFormattedPayload = {
    chatIds: messagePayload.chatIds,
    text: messageString,
    parseMode: "HTML",
  };
  await telegramFormattedNotifier(messageObj);
}

export async function telegramPhotoNotifier(messagePayload: TLPhotoPayload) {
  const { chatId, file, caption } = messagePayload;
  const { telegram } = getAdapters();
  await telegram.sendPhoto(chatId, Input.fromLocalFile(file), { caption: caption, parse_mode: "HTML" });
}
