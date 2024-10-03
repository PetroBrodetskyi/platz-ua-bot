import { createMainMenu } from "../utils/menus.js";

const start = (bot, chatId, msg) => {
  if (msg.text === "/start") {
    bot.sendMessage(
      chatId,
      "Привіт! Це бот для створення оголошень у групі PlatzUA. Оберіть дію:",
      createMainMenu()
    );
  }
};

export default start;
