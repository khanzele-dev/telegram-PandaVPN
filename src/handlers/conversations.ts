import { getPhone, ImageKeyboard, MailingKeyboard } from "../shared/keyboard";
import { MyConversation, MyConversationContext } from "../types";
import {
  fetchRegisterUser,
  isValidEmail,
  bindEmail,
  checkEmailAvailability,
  fetchUserData,
} from "../config/requests";
import { mainMenu } from "./menu";

// Вспомогательная функция для привязки email (используется в conversations)
async function handleEmailBindingInConversation(
  ctx: MyConversationContext,
  telegramId: number,
  email: string
): Promise<void> {
  try {
    // Проверяем валидность email
    if (!isValidEmail(email)) {
      await ctx.reply(
        "❌ <b>Некорректный email</b>\n\nПожалуйста, проверьте правильность введённого адреса электронной почты.",
        { parse_mode: "HTML", reply_markup: mainMenu }
      );
      return;
    }

    // Получаем данные текущего пользователя
    let userData;
    try {
      userData = await fetchUserData(telegramId.toString());
    } catch {
      await ctx.reply(
        "❌ <b>Ошибка</b>\n\nНе удалось получить данные пользователя. Попробуйте позже.",
        { parse_mode: "HTML", reply_markup: mainMenu }
      );
      return;
    }

    // Проверяем, не привязан ли уже email к этому аккаунту
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

    // Проверяем, не занят ли email другим пользователем
    const existingUser = await checkEmailAvailability(email);
    if (existingUser && existingUser.telegram_id !== telegramId) {
      await ctx.reply(
        "❌ <b>Email уже используется</b>\n\nЭтот email уже привязан к другому аккаунту. Если это ваш email, обратитесь в поддержку.",
        { parse_mode: "HTML", reply_markup: mainMenu }
      );
      return;
    }

    // Привязываем email
    await bindEmail(telegramId, email);
    await ctx.reply(
      `✅ <b>Email успешно привязан!</b>\n\nВаш аккаунт теперь связан с email: <code>${email}</code>\n\nТеперь вы можете входить на сайт через свой Telegram-аккаунт.`,
      { parse_mode: "HTML", reply_markup: mainMenu }
    );
  } catch (error) {
    console.error("Ошибка при привязке email:", error);
    await ctx.reply(
      "❌ <b>Произошла ошибка</b>\n\nНе удалось привязать email. Пожалуйста, попробуйте позже или обратитесь в поддержку.",
      { parse_mode: "HTML", reply_markup: mainMenu }
    );
  }
}

// Conversation для регистрации с последующей привязкой email
export async function registrationWithEmailConversation(
  conversation: MyConversation,
  ctx: MyConversationContext,
  email?: string
) {
  await ctx.reply(
    "📱 <b>Регистрация PandaVPN</b>\n\nДля завершения регистрации, пожалуйста, поделитесь своим номером телефона.",
    {
      parse_mode: "HTML",
      reply_markup: getPhone,
    }
  );

  const { message } = await conversation.wait();

  if (!message?.contact?.phone_number) {
    await ctx.reply(
      "❌ Необходимо поделиться номером телефона для регистрации.",
      {
        reply_markup: { remove_keyboard: true },
      }
    );
    await registrationWithEmailConversation(conversation, ctx, email);
    return;
  }

  const phoneNumber = message.contact.phone_number;
  const telegramId = ctx.from?.id as number;

  try {
    await fetchRegisterUser(telegramId, phoneNumber);
    await ctx.reply(
      "✅ <b>Регистрация успешно завершена!</b>",
      {
        parse_mode: "HTML",
        reply_markup: { remove_keyboard: true },
      }
    );

    // Если есть email для привязки - привязываем
    if (email && isValidEmail(email)) {
      await handleEmailBindingInConversation(ctx, telegramId, email);
    } else {
      await ctx.reply(
        "Теперь вы можете пользоваться всеми функциями бота.",
        { reply_markup: mainMenu }
      );
    }
  } catch (error) {
    console.error("Registration error:", error);
    await ctx.reply(
      "❌ Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.",
      {
        reply_markup: { remove_keyboard: true },
      }
    );
  }
}

export async function registrationConversation(
  conversation: MyConversation,
  ctx: MyConversationContext
) {
  await registrationWithEmailConversation(conversation, ctx);
}

export async function broadcastConversation(
  conversation: MyConversation,
  ctx: MyConversationContext
) {
  await ctx.reply("<b>✏️ Шаг 1/3:</b> Введите текст для рассылки:", {
    parse_mode: "HTML",
  });
  const { message } = await conversation.waitFor(":text");
  if (!message?.text) {
    await ctx.reply("❌ Нужно ввести текст");
    return;
  }
  const photoMessage = await ctx.reply(
    "🖼 <b>Шаг 2/3:</b> Пришлите изображение",
    {
      parse_mode: "HTML",
      reply_markup: ImageKeyboard,
    }
  );
  const response = await conversation.wait();
  let photo: string | null = null;

  if (response.callbackQuery?.data === "image:no") {
    await ctx.api.answerCallbackQuery(response.callbackQuery.id, {
      text: "Продолжаем без изображения",
    });
    await ctx.api.editMessageReplyMarkup(
      ctx.chat!.id,
      photoMessage.message_id,
      {
        reply_markup: undefined,
      }
    );
  } else if (response.message?.photo) {
    photo = response.message.photo[response.message.photo.length - 1].file_id;
    await ctx.api.editMessageReplyMarkup(
      ctx.chat!.id,
      photoMessage.message_id,
      {
        reply_markup: undefined,
      }
    );
  }
  await ctx.reply("<b>📋 Шаг 3/3:</b> Подтвердите рассылку", {
    parse_mode: "HTML",
  });
  let confirmMessage;
  try {
    if (photo) {
      confirmMessage = await ctx.replyWithPhoto(photo, {
        caption: `${message.text}\n\n<b>Начать рассылку?</b>`,
        caption_entities: message.entities,
        parse_mode: "HTML",
        reply_markup: MailingKeyboard,
      });
    } else {
      confirmMessage = await ctx.reply(
        `${message.text}\n\n<b>Начать рассылку?</b>`,
        {
          reply_markup: MailingKeyboard,
          entities: message.entities,
          parse_mode: "HTML",
        }
      );
    }
  } catch (err) {
    await ctx.reply("❌ Ошибка при обработке сообщения для рассылки");
    console.error("Ошибка при обработке сообщения для рассылки:", err);
    return;
  }
  const { callbackQuery } = await conversation.waitFor("callback_query");
  if (callbackQuery?.data === "mailing:cancel") {
    await ctx.api.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Рассылка отменена",
    });
    try {
      if (photo) {
        await ctx.api.editMessageCaption(
          ctx.chat!.id,
          confirmMessage.message_id,
          {
            caption: "❌ Рассылка отменена",
            reply_markup: undefined,
          }
        );
      } else {
        await ctx.api.editMessageText(
          ctx.chat!.id,
          confirmMessage.message_id,
          "❌ Рассылка отменена",
          { reply_markup: undefined }
        );
      }
    } catch (err) {
      console.error("Ошибка при редактировании сообщения:", err);
    }
    return;
  }

  if (callbackQuery?.data === "mailing:yes") {
    await ctx.api.answerCallbackQuery(callbackQuery.id, {
      text: "📤 Начинаем рассылку...",
    });

    try {
      if (photo) {
        await ctx.api.editMessageCaption(
          ctx.chat!.id,
          confirmMessage.message_id,
          {
            caption: "📤 Начинаем рассылку...",
            reply_markup: undefined,
          }
        );
      } else {
        await ctx.api.editMessageText(
          ctx.chat!.id,
          confirmMessage.message_id,
          "📤 Начинаем рассылку...",
          { reply_markup: undefined }
        );
      }
    } catch (err) {
      console.error("Ошибка при редактировании сообщения:", err);
    }

    const users = [{ telegramId: 123456789 }];
    let success = 0;
    let failed = 0;

    for (const user of users) {
      try {
        if (photo) {
          await ctx.api.sendPhoto(user.telegramId as number, photo, {
            caption: message.text,
            caption_entities: message.entities,
          });
        } else {
          await ctx.api.sendMessage(user.telegramId as number, message.text, {
            entities: message.entities,
          });
        }
        success++;
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (err) {
        failed++;
        console.error(`Ошибка рассылки пользователю ${user.telegramId}:`, err);
      }
    }

    await ctx.reply(
      `✅ <b>Рассылка завершена</b>\n\n` +
        `📊 Статистика:\n` +
        `✅ Успешно: ${success}\n` +
        `❌ Ошибок: ${failed}\n` +
        `👥 Всего: ${users.length}`,
      { parse_mode: "HTML" }
    );
  }
}