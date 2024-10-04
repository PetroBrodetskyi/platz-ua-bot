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
      if (msg.text === "Повернутися назад") {
        delete currentUserState[chatId];
        bot.sendMessage(chatId, "Ви повернулися до основного меню.");
        break;
      }
      currentUserState[chatId].category = msg.text;
      currentUserState[chatId].step = "location";
      bot.sendMessage(
        chatId,
        `Ви обрали категорію: ${msg.text}. Введіть локацію для оголошення або натисніть 'Пропустити'.`,
        createSkipOrBackMenu()
      );
      break;

    case "location":
      if (msg.text === "Повернутися назад") {
        currentUserState[chatId].step = "category";
        bot.sendMessage(
          chatId,
          "Оберіть категорію для оголошення:",
          createCategoryMenu()
        );
        break;
      }
      if (msg.text === "Пропустити") {
        currentUserState[chatId].location = "Не вказана";
      } else {
        currentUserState[chatId].location = msg.text;
      }
      currentUserState[chatId].step = "price";
      bot.sendMessage(
        chatId,
        "Введіть ціну для оголошення або натисніть 'Пропустити'.",
        createSkipOrBackMenu()
      );
      break;

    case "price":
      if (msg.text === "Повернутися назад") {
        currentUserState[chatId].step = "location";
        bot.sendMessage(
          chatId,
          "Введіть локацію для оголошення або натисніть 'Пропустити'.",
          createSkipOrBackMenu()
        );
        break;
      }
      if (msg.text === "Пропустити") {
        currentUserState[chatId].price = "Договірна";
      } else {
        currentUserState[chatId].price = msg.text;
      }
      currentUserState[chatId].step = "photo";
      bot.sendMessage(
        chatId,
        "Надішліть фото для оголошення або натисніть 'Пропустити'.",
        createSkipOrBackMenu()
      );
      break;

    case "photo":
      if (msg.text === "Повернутися назад") {
        currentUserState[chatId].step = "price";
        bot.sendMessage(
          chatId,
          "Введіть ціну для оголошення або натисніть 'Пропустити'.",
          createSkipOrBackMenu()
        );
        break;
      }
      if (msg.text === "Пропустити") {
        currentUserState[chatId].photo = "Без фото";
      } else if (msg.photo && msg.photo.length > 0) {
        const photo = msg.photo[msg.photo.length - 1].file_id;
        currentUserState[chatId].photo = photo;
      } else {
        bot.sendMessage(
          chatId,
          "Помилка: не було надіслано фото. Спробуйте ще раз."
        );
        break;
      }
      currentUserState[chatId].step = "adText";
      bot.sendMessage(
        chatId,
        "Введіть текст оголошення:",
        createBackOnlyMenu()
      );
      break;

    case "adText":
      if (msg.text === "Повернутися назад") {
        currentUserState[chatId].step = "photo";
        bot.sendMessage(
          chatId,
          "Надішліть фото для оголошення або натисніть 'Пропустити'.",
          createSkipOrBackMenu()
        );
        break;
      }

      if (!msg.text || msg.text.trim() === "") {
        bot.sendMessage(
          chatId,
          "Текст оголошення не може бути порожнім. Введіть текст ще раз."
        );
        break;
      }

      currentUserState[chatId].adText = msg.text;
      const { category, location, price, photo } = currentUserState[chatId];
      let messageText = `Ваше оголошення:\nКатегорія: ${category}\nЛокація: ${location}\nЦіна: ${price}\nТекст: "${msg.text}"`;

      if (photo !== "Без фото") {
        bot.sendPhoto(chatId, photo, { caption: messageText });
      } else {
        bot.sendMessage(chatId, messageText);
      }

      currentUserState[chatId].step = "payment";
      bot.sendMessage(chatId, "Щоб завершити, виберіть метод оплати:", {
        reply_markup: {
          keyboard: [["PayPal"], ["Повернутися назад"]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
      break;

    case "payment":
      if (msg.text === "Повернутися назад") {
        currentUserState[chatId].step = "adText";
        bot.sendMessage(
          chatId,
          "Введіть текст оголошення:",
          createBackOnlyMenu()
        );
      } else if (msg.text === "PayPal") {
        const { price, adText } = currentUserState[chatId];
        bot.sendMessage(chatId, "Ви обрали PayPal. Обробка платежу...");

        const paymentLink = `https://www.paypal.com/ncp/payment/Y3N7M4GK5L9H4`;
        bot.sendMessage(
          chatId,
          "Оплатіть ваше оголошення за допомогою кнопки нижче:",
          {
            reply_markup: {
              inline_keyboard: [[{ text: "Jetzt bezahlen", url: paymentLink }]],
            },
          }
        );
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
        ["Повернутися назад"],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };
};

export const createSkipOrBackMenu = () => {
  return {
    reply_markup: {
      keyboard: [["Пропустити"], ["Повернутися назад"]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };
};

export const createBackOnlyMenu = () => {
  return {
    reply_markup: {
      keyboard: [["Повернутися назад"]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };
};
