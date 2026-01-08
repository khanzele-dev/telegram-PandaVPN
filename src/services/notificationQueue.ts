import Queue from "bull";
import { Api } from "grammy";
import { NotificationType } from "../types/models";
import { NotificationKeyboard } from "../shared/keyboard";

interface NotificationJob {
  telegramId: string;
  notificationType: NotificationType;
  message: string;
  promoCode?: string;
  daysExpired?: number;
}

export const notificationQueue = new Queue<NotificationJob>(
  "notifications",
  {
    redis: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
    },
  }
);

const api = new Api(process.env.BOT_TOKEN as string);

notificationQueue.process(async (job) => {
  const { telegramId, notificationType, message } = job.data;

  try {
    await api.sendMessage(telegramId, message, {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      reply_markup: NotificationKeyboard,
    });
  } catch (error) {
    throw error;
  }
});

notificationQueue.on("completed", () => {});
notificationQueue.on("failed", () => {});
notificationQueue.on("error", () => {});

export const addNotificationToQueue = async (
  telegramId: string,
  notificationType: NotificationType,
  message: string,
  promoCode?: string,
  daysExpired?: number
): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];
  const jobId = `${telegramId}-${notificationType}-${today}`;
  
  await notificationQueue.add(
    {
      telegramId,
      notificationType,
      message,
      promoCode,
      daysExpired,
    },
    { jobId, attempts: 1, backoff: { type: "exponential", delay: 2000 }, removeOnComplete: true, removeOnFail: false }
  );
};
