import { InlineKeyboard, Keyboard } from "grammy";

export const MailingKeyboard = new InlineKeyboard()
  .text("✅ Начать рассылку", "mailing:yes")
  .text("❌ Отменить", "mailing:cancel");

export const ImageKeyboard = new InlineKeyboard().text("❌ Нет", "image:no");

export const HelpKeyboard = new InlineKeyboard().url(
  "💬 Связаться с нами",
  "https://t.me/mukhammad_ak"
);

export const getNotificationKeyboard = (notificationType: string): InlineKeyboard => {
  const keyboard = new InlineKeyboard();
  const CABINET_URL = "https://vpn-p.ru/auth/signup";
  const SUPPORT_URL = "https://vpn-p.ru/support";

  // Для всех типов уведомлений добавляем основную кнопку
  if (notificationType === "TEN_DAYS_EXPIRED" || notificationType === "ONE_MONTH_EXPIRED" || notificationType === "WEEKLY_REMINDER") {
    keyboard.url("🌐 Личный кабинет", CABINET_URL).row();
    keyboard.url("🤳 Техподдержка", SUPPORT_URL);
  } else if (notificationType === "FIVE_DAYS_EXPIRED") {
    keyboard.url("👉 Продлить подписку", CABINET_URL).row();
    keyboard.url("🤳 Техподдержка", SUPPORT_URL);
  } else {
    keyboard.url("👉 Продлить подписку", CABINET_URL);
  }

  return keyboard;
};

export const getPhone = new Keyboard().requestContact("📞 Поделиться номером").resized()