import { username } from "../shared";
import { MyContext } from "../types";
import { adminMenu, mainMenu } from "./menu";
import {
  fetchUserSubscription,
  isValidEmail,
  bindEmail,
  checkEmailAvailability,
  fetchUserData,
} from "../config/requests";
import {
  calculateSubscriptionStatus,
  formatDate,
} from "../shared/subscription";
import { HelpKeyboard } from "../shared/keyboard";
import { isRegistered, getUserData } from "./middlewares";

async function handleEmailBinding(
  ctx: MyContext,
  telegramId: number,
  email: string
): Promise<void> {
  try {
    if (!isValidEmail(email)) {
      await ctx.reply(
        "❌ <b>Некорректный email</b>\n\nПожалуйста, проверьте правильность введённого адреса электронной почты.",
        { parse_mode: "HTML", reply_markup: mainMenu }
      );
      return;
    }

    const existingUser = await checkEmailAvailability(email);
    if (existingUser && existingUser.telegram_id && existingUser.telegram_id !== telegramId) {
      await ctx.reply(
        "❌ <b>Email уже используется</b>\n\nЭтот email уже привязан к другому аккаунту. Если это ваш email, обратитесь в поддержку.",
        { parse_mode: "HTML", reply_markup: mainMenu }
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
          { parse_mode: "HTML", reply_markup: mainMenu }
        );
        return;
      } else {
        await ctx.reply(
          `⚠️ <b>К вашему аккаунту уже привязан другой email</b>\n\nТекущий email: <code>${userData.email}</code>\n\nЕсли вы хотите изменить email, обратитесь в поддержку.`,
          { parse_mode: "HTML", reply_markup: mainMenu }
        );
        return;
      }
    }

    await bindEmail(telegramId, email);
    await ctx.reply(
      `✅ <b>Email успешно привязан!</b>\n\nВаш аккаунт теперь связан с email: <code>${email}</code>\n\nТеперь вы можете входить на сайт через свой Telegram-аккаунт.`,
      { parse_mode: "HTML", reply_markup: mainMenu }
    );
  } catch (error) {
    await ctx.reply(
      "❌ <b>Произошла ошибка</b>\n\nНе удалось привязать email. Попробуйте позже.",
      { parse_mode: "HTML", reply_markup: mainMenu }
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

    const isEmailPayload = startPayload && isValidEmail(startPayload);

    if (isEmailPayload) {
      const email = startPayload;
      const userRegistered = await isRegistered(ctx);

      if (!userRegistered) {
        await ctx.reply(
          "👋 <b>Добро пожаловать в PandaVPN!</b>\n\nДля привязки email вам необходимо сначала зарегистрироваться.",
          { parse_mode: "HTML" }
        );
        await ctx.conversation.enter("registrationWithEmailConversation", { overwrite: true }, email);
        return;
      } else {
        await handleEmailBinding(ctx, telegramId, email);
        return;
      }
    } else if (startPayload === "from_site") {
      const userRegistered = await isRegistered(ctx);
      if (!userRegistered) {
        await ctx.conversation.enter("registrationConversation");
        return;
      } else {
        await ctx.reply(
          "✅ Вы уже зарегистрированы! Добро пожаловать обратно.",
          {
            reply_markup: mainMenu,
          }
        );
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
    "<b>❓ Что я умею?</b>\n\n⏰ Чтобы вы не пропустили важное, я присылаю уведомления об окончании подписки PandaVPN.\n\n⚠️ Бот <i>не продлевает и не продаёт подписку</i> —\nвы можете это сделать на сайте\n\n<blockquote>🐼 Свободный интернет c <b>PandaVPN</b></blockquote>",
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

export const subscription = async (ctx: MyContext) => {
  try {
    if (!ctx.from) {
      throw new Error("No 'from' field in context");
    }

    const telegramId = ctx.from.id.toString();
    const subscriptionData = await fetchUserSubscription(telegramId);
    const status = calculateSubscriptionStatus(subscriptionData);

    let message = "📊 <b>Информация о подписке</b>\n\n";

    if (status.isActive) {
      message += `✅ <b>Статус:</b> Активна\n`;
      message += `📅 <b>Действует до:</b> ${formatDate(status.endDate!)}\n`;
      message += `⏳ <b>Осталось дней:</b> ${status.daysRemaining}\n\n`;

      if (status.daysRemaining <= 3) {
        message += `⚠️ <i>Подписка скоро закончится! Рекомендуем продлить заранее.</i>\n`;
      }
    } else {
      message += `❌ <b>Статус:</b> Неактивна\n`;

      if (status.endDate) {
        message += `📅 <b>Закончилась:</b> ${formatDate(status.endDate)}\n`;
        message += `⏱ <b>Прошло дней:</b> ${status.daysExpired}\n\n`;
      }

      if (status.promoCode && !status.promoCodeUsed) {
        message += `🎁 <b>У вас есть промокод:</b> <code>${status.promoCode}</code>\n`;
        message += `Активируйте его в личном кабинете для получения 5 дней бесплатного доступа!\n\n`;
      }

      message += `💡 <i>Продлите подписку, чтобы продолжить пользоваться VPN.</i>\n`;
    }

    message += `\n👉 <a href="https://vpn-p.ru/auth/signup">Продлить подписку</a>`;
    message += `\n🤳 <a href="https://vpn-p.ru/support">Техподдержка</a>`;

    await ctx.reply(message, {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });
  } catch (error) {
    console.error("Error in subscription command:", error);
    await ctx.reply("Произошла ошибка при получении информации о подписке. Попробуйте позже.");
  }
};