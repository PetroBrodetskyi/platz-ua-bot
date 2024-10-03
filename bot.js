import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import start from "./handlers/start.js";
import { createPayPalPayment } from "./handlers/payment.js";

dotenv.config();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const currentUserState = {};

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (!currentUserState[chatId]) {
    currentUserState[chatId] = {};
  }

  console.log("Current user state:", currentUserState[chatId]);

  switch (currentUserState[chatId].step) {
    case undefined:
      if (msg.text === "/start") {
        start(bot, chatId, msg, currentUserState);
      } else if (msg.text === "Додати оголошення") {
        currentUserState[chatId].step = "category";
        bot.sendMessage(
          chatId,
          "Оберіть категорію для оголошення:",
          createCategoryMenu()
        );
      }
      break;

    case "category":
      currentUserState[chatId].category = msg.text;
      currentUserState[chatId].step = "adText";
      bot.sendMessage(
        chatId,
        `Ви обрали категорію: ${msg.text}. Введіть текст оголошення, щоб додати його.`,
        createBackResetMenu()
      );
      break;

    case "adText":
      if (msg.text === "Повернутися назад") {
        currentUserState[chatId].step = "category";
        bot.sendMessage(
          chatId,
          "Оберіть категорію для оголошення:",
          createCategoryMenu()
        );
      } else if (msg.text === "Скинути") {
        delete currentUserState[chatId];
        bot.sendMessage(chatId, "Ваше оголошення було скинуте.");
      } else {
        currentUserState[chatId].adText = msg.text;
        currentUserState[chatId].step = "price";
        bot.sendMessage(chatId, "Введіть ціну для оголошення:");
      }
      break;

    case "price":
      if (msg.text === "Повернутися назад") {
        currentUserState[chatId].step = "adText";
        bot.sendMessage(
          chatId,
          `Введіть текст оголошення:`,
          createBackResetMenu()
        );
      } else if (msg.text === "Скинути") {
        delete currentUserState[chatId];
        bot.sendMessage(chatId, "Ваше оголошення було скинуте.");
      } else {
        currentUserState[chatId].price = msg.text;
        currentUserState[chatId].step = "location";
        bot.sendMessage(chatId, "Введіть локацію для оголошення:");
      }
      break;

    case "location":
      if (msg.text === "Повернутися назад") {
        currentUserState[chatId].step = "price";
        bot.sendMessage(chatId, "Введіть ціну для оголошення:");
      } else if (msg.text === "Скинути") {
        delete currentUserState[chatId];
        bot.sendMessage(chatId, "Ваше оголошення було скинуто.");
      } else {
        currentUserState[chatId].location = msg.text;
        currentUserState[chatId].step = "photo";
        bot.sendMessage(
          chatId,
          "Будь ласка, надішліть фото вашого оголошення:"
        );
      }
      break;

    case "photo":
      if (msg.text === "Повернутися назад") {
        currentUserState[chatId].step = "location";
        bot.sendMessage(chatId, "Введіть локацію для оголошення:");
      } else if (msg.text === "Скинути") {
        delete currentUserState[chatId];
        bot.sendMessage(chatId, "Ваше оголошення було скинуто.");
      } else if (msg.photo && msg.photo.length > 0) {
        const photo = msg.photo[msg.photo.length - 1].file_id;
        const { adText, category, price, location } = currentUserState[chatId];

        bot.sendPhoto(chatId, photo, {
          caption: `Ваше оголошення:\nКатегорія: ${category}\nТекст: "${adText}"\nЦіна: €${price}\nЛокація: ${location}\nФото додано!`,
        });

        currentUserState[chatId].step = "payment";
        bot.sendMessage(
          chatId,
          "Щоб завершити, будь ласка, виберіть метод оплати:",
          {
            reply_markup: {
              keyboard: [["PayPal"], ["Повернутися назад"]],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          }
        );
      } else {
        bot.sendMessage(
          chatId,
          "Помилка: не було надіслано фото. Спробуйте ще раз."
        );
      }
      break;

    case "payment":
      if (msg.text === "PayPal") {
        const { price, adText } = currentUserState[chatId];
        bot.sendMessage(chatId, "Ви обрали PayPal. Обробка платежу...");

        // Використовуйте створену кнопку PayPal
        const paymentLink = `https://www.paypal.com/ncp/payment/Y3N7M4GK5L9H4`;
        bot.sendMessage(
          chatId,
          `Оплатіть ваше оголошення за посиланням: [Jetzt bezahlen](${paymentLink})`,
          { parse_mode: "Markdown" } // Увімкніть режим розмітки для посилання
        );
      } else if (msg.text === "Повернутися назад") {
        delete currentUserState[chatId];
        bot.sendMessage(chatId, "Повернення до основного меню.");
      } else {
        bot.sendMessage(chatId, "Невірний вибір. Спробуйте ще раз.");
      }
      break;

    default:
      bot.sendMessage(chatId, "Невідома команда. Спробуйте ще раз.");
  }
});

export default bot;

export const createCategoryMenu = () => {
  return {
    reply_markup: {
      keyboard: [
        ["Транспорт"],
        ["Електроніка"],
        ["Нерухомість"],
        ["Дім та сад"],
        ["Робота"],
        ["Послуги"],
        ["Одяг та взуття"],
        ["Спорт та відпочинок"],
        ["Хобі та різне"],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };
};

export const createBackResetMenu = () => {
  return {
    reply_markup: {
      keyboard: [["Повернутися назад"], ["Скинути"]],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  };
};
