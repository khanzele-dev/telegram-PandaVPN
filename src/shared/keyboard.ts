import { InlineKeyboard, Keyboard } from "grammy";

export const MailingKeyboard = new InlineKeyboard()
  .text("✅ Начать рассылку", "mailing:yes")
  .text("❌ Отменить", "mailing:cancel");

export const ImageKeyboard = new InlineKeyboard().text("❌ Нет", "image:no");

export const HelpKeyboard = new InlineKeyboard().url(
  "💬 Связаться с нами",
  "https://t.me/the_mukhamad"
);

export const NotificationKeyboard = new InlineKeyboard()
  .url("🌐 Личный кабинет", "https://vpn-p.ru/auth/signup")
  .row()
  .url("🤳 Техподдержка", "https://vpn-p.ru/support");

export const getPhone = new Keyboard()
  .requestContact("📞 Поделиться номером")
  .resized();