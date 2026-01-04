import Queue from "bull";
import { Api } from "grammy";
import { NotificationType } from "../types/models";
import { updateLastNotification } from "../config/requests";

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
    });

    await updateLastNotification(telegramId, notificationType);

    console.log(`Notification sent to ${telegramId}: ${notificationType}`);
  } catch (error) {
    console.error(`Error sending notification to ${telegramId}:`, error);
    throw error;
  }
});

notificationQueue.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

notificationQueue.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

notificationQueue.on("error", (error) => {
  console.error("Queue error:", error);
});

export const addNotificationToQueue = async (
  telegramId: string,
  notificationType: NotificationType,
  message: string,
  promoCode?: string,
  daysExpired?: number
): Promise<void> => {
  await notificationQueue.add(
    {
      telegramId,
      notificationType,
      message,
      promoCode,
      daysExpired,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
};
