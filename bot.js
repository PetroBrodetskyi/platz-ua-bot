import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import start from "./handlers/start.js";
import LiqPay from "liqpay"; // Підключення LiqPay SDK

dotenv.config();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Ініціалізуємо LiqPay з ключами
const liqpay = new LiqPay(
  process.env.LIQPAY_PUBLIC_KEY,
  process.env.LIQPAY_PRIVATE_KEY
);

const currentUserState = {};

bot.on("message", (msg) => {
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
        bot.sendMessage(chatId, "Ваше оголошення було скинуте.");
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
        bot.sendMessage(chatId, "Ваше оголошення було скинуте.");
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
              keyboard: [["LiqPay"], ["PayPal"], ["Повернутися назад"]],
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
      if (msg.text === "LiqPay") {
        bot.sendMessage(chatId, "Ви обрали LiqPay. Створюємо платіж...");

        const { price, adText } = currentUserState[chatId];

        const params = {
          action: "pay",
          amount: price,
          currency: "EUR",
          description: `Оплата за оголошення: ${adText}`,
          order_id: Math.floor(1 + Math.random() * 1000000),
          version: 3,
          result_url: "https://your-redirect-url.com",
        };

        const paymentLink = liqpay.cnb_link(params);

        bot.sendMessage(
          chatId,
          `Оплатіть ваше оголошення за посиланням: ${paymentLink}`
        );
      } else if (msg.text === "PayPal") {
        bot.sendMessage(chatId, "Ви обрали PayPal. Обробка платежу...");
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
