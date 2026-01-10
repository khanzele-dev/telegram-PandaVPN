import { MyContext } from "../types";
import { adminMenu, mainMenu, helpMenu } from "./menu";
import {
  isValidEmail,
  bindEmail,
  checkEmailAvailability,
} from "../config/requests";
import { HelpKeyboard } from "../shared/keyboard";
import { isRegistered, getUserData } from "./middlewares";
import { isAxiosError } from "axios";

function isEmailConflict(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 409;
}

async function handleEmailBinding(
  ctx: MyContext,
  telegramId: number,
  email: string
): Promise<void> {
  try {
    if (!isValidEmail(email)) {
      await ctx.reply(
        "❌ <b>Некорректный email</b>\n\nПожалуйста, проверьте правильность введённого адреса электронной почты.",
        { parse_mode: "HTML", reply_markup: helpMenu }
      );
      return;
    }

    const existingUser = await checkEmailAvailability(email);
    if (
      existingUser &&
      existingUser.telegram_id &&
      existingUser.telegram_id !== telegramId
    ) {
      console.log(existingUser)
      await ctx.reply(
        "❌ <b>Email уже используется</b>\n\nЭтот email уже привязан к другому аккаунту. Если это ваш email, обратитесь в поддержку.",
        { parse_mode: "HTML", reply_markup: helpMenu }
      );
      return;
    }

    const userData = await getUserData(telegramId);
    if (!userData) {
      await ctx.reply(
        "❌ <b>Ошибка</b>\n\nНе удалось получить данные пользователя. Попробуйте позже.",
        { parse_mode: "HTML", reply_markup: mainMenu }
      );
      return;
    }

    if (userData.email) {
      if (userData.email.toLowerCase() === email.toLowerCase()) {
        await ctx.reply(
          `✅ <b>Email уже привязан</b>\n\nВаш аккаунт уже связан с этим email: <code>${email}</code>`,
          { parse_mode: "HTML", reply_markup: helpMenu }
        );
        return;
      }
      await ctx.reply(
        `⚠️ <b>К вашему аккаунту уже привязан другой email</b>\n\nТекущий email: <code>${userData.email}</code>\n\nЕсли вы хотите изменить email, обратитесь в поддержку.`,
        { parse_mode: "HTML", reply_markup: helpMenu }
      );
      return;
    }
    await bindEmail(telegramId, email);
    await ctx.reply(
      `✅ <b>Email успешно привязан!</b>\n\nВаш аккаунт теперь связан с email: <code>${email}</code>\n\nТеперь вы можете входить на сайт через свой Telegram-аккаунт.`,
      { parse_mode: "HTML", reply_markup: mainMenu }
    );
  } catch (error) {
    console.log(error)
    if (isEmailConflict(error)) {
      await ctx.reply(
        "❌ <b>Email уже используется</b>\n\nЭтот email уже привязан к другому аккаунту. Если это ваш email — обратитесь в поддержку.",
        { parse_mode: "HTML", reply_markup: helpMenu }
      );
      return;
    }
    await ctx.reply(
      "❌ <b>Произошла ошибка</b>\n\nНе удалось привязать email. Попробуйте позже.",
      { parse_mode: "HTML", reply_markup: helpMenu }
    );
  }
}


export const start = async (ctx: MyContext) => {
  try {
    if (!ctx.from) {
      throw new Error("No 'from' field in context");
    }

    const telegramId = ctx.from.id;
    const startPayload = ctx.match as string | undefined;

    const isEmailPayload = startPayload && isValidEmail(Buffer.from(startPayload, 'base64').toString('utf-8'));
    if (isEmailPayload) {
      const email = Buffer.from(startPayload, 'base64').toString('utf-8');
      const userRegistered = await isRegistered(ctx);

      if (!userRegistered) {
        await ctx.reply(
          "👋 <b>Добро пожаловать в PandaVPN!</b>\n\nДля привязки email вам необходимо сначала зарегистрироваться.",
          { parse_mode: "HTML" }
        );
        await ctx.conversation.enter(
          "registrationWithEmailConversation",
          { overwrite: true },
          email
        );
        return;
      } else {
        await handleEmailBinding(ctx, telegramId, email);
        return;
      }
    } else {
      const userRegistered = await isRegistered(ctx);
      if (!userRegistered) {
        await ctx.conversation.enter("registrationConversation");
        return;
      } else {
        await ctx.reply(
          `🐼 Добро пожаловать обратно, ${
            ctx.from?.username
              ? `@${ctx.from.username}`
              : ctx.from?.first_name
              ? ctx.from.first_name
              : "гость"
          }!`,
          {
            reply_markup: mainMenu,
          }
        );
      }
    }
  } catch (error) {
    await ctx.reply("❌ Произошла ошибка. Попробуйте позже.");
  }
};

export async function info(ctx: MyContext) {
  if (ctx.callbackQuery) {
    ctx.menu.close();
    await ctx.api.answerCallbackQuery(ctx.callbackQuery.id, {
      text: "❓ Что я умею?",
    });
  }
  await ctx.reply(
    "<b>❓ Что я умею?</b>\n\n⏰ Чтобы вы не пропустили важное, я присылаю уведомления об окончании подписки PandaVPN.\n\n⚠️ Бот <i>не продлевает и не продаёт подписку</i> — вы можете это сделать на сайте\n\n<blockquote>🐼 Свободный интернет c <b>PandaVPN</b></blockquote>",
    { parse_mode: "HTML" }
  );
}

export async function help(ctx: MyContext) {
  if (ctx.callbackQuery) {
    ctx.menu.close();
    await ctx.api.answerCallbackQuery(ctx.callbackQuery.id, {
      text: "🤳🏻 Поддержка",
    });
  }
  await ctx.reply(
    "🤳🏻 <b>Поддержка</b>\n\n🎋 Застряли в цифровом бамбуковом лесу?\nНаша команда уже спешит на помощь!\n\nОставьте свой вопрос — мы ответим при первой же возможности.\nОбычно это занимает <i>не более пары часов</i> в рабочее время.\n\n<blockquote>🐼 Свободный интернет c <b>PandaVPN</b></blockquote>",
    { parse_mode: "HTML", reply_markup: HelpKeyboard }
  );
}

export const admin = async (ctx: MyContext) => {
  await ctx.reply("🔐 Админ-панель", {
    reply_markup: adminMenu,
  });
};