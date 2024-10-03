export const createMainMenu = () => {
  return {
    reply_markup: {
      keyboard: [
        ["Додати оголошення"],
        ["Переглянути оголошення"],
        ["Допомога"],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };
};

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

export const createPaymentMenu = () => {
  return {
    reply_markup: {
      keyboard: [["LiqPay"], ["PayPal"], ["Скасувати"]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };
};
