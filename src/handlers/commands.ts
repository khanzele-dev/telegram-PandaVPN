import { username } from "../shared";
import { MyContext } from "../types";
import { adminMenu, mainMenu } from "./menu";
import { fetchUserSubscription } from "../config/requests";
import {
  calculateSubscriptionStatus,
  formatDate,
} from "../shared/subscription";
import { HelpKeyboard } from "../shared/keyboard";
import { isRegistered } from "./middlewares";

export const start = async (ctx: MyContext) => {
  try {
    if (!ctx.from) {
      throw new Error("No 'from' field in context");
    }
    const startPayload = ctx.match;
    if (startPayload === "from_site") {
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
    console.error("Error in start command:", error);
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
    await ctx.reply(
      "Произошла ошибка при получении информации о подписке. Пожалуйста, попробуйте позже."
    );
  }
};
