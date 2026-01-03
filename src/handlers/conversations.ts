import { getPhone, ImageKeyboard, MailingKeyboard } from "../shared/keyboard";
import { MyConversation, MyConversationContext } from "../types";
import { fetchRegisterUser } from "../config/requests";

export async function registrationConversation(
  conversation: MyConversation,
  ctx: MyConversationContext
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
    await ctx.reply("❌ Необходимо поделиться номером телефона для регистрации.", {
      reply_markup: { remove_keyboard: true },
    });
    return;
  }

  const phoneNumber = message.contact.phone_number;
  const telegramId = ctx.from?.id as number;

  try {
    await fetchRegisterUser(telegramId, phoneNumber);
    await ctx.reply(
      "✅ <b>Регистрация успешно завершена!</b>\n\nТеперь вы можете пользоваться всеми функциями бота.",
      {
        parse_mode: "HTML",
        reply_markup: { remove_keyboard: true },
      }
    );
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