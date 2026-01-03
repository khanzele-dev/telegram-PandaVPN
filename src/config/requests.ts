import axios from "axios";
import dotenv from "dotenv";
import { IUserSubscription } from "../types/models";

dotenv.config({ path: "src/.env" });

// auth requests
export const fetchUserData = async (telegramId: string) => {
  const { data } = await axios.post(
    `${process.env.API_URL}/bot/user`,
    {
      telegram_id: telegramId,
    },
    {
      headers: {
        "X-INTERNAL-TOKEN": process.env.INTERNAL_TOKEN,
      },
    }
  );
  return data;
};

export const fetchRegisterUser = async (telegramId: number, phone: string) => {
  const { data } = await axios.post(
    `${process.env.API_URL}/bot/register`,
    {
      telegram_id: telegramId,
      phone: Number(phone),
    },
    {
      headers: {
        "X-INTERNAL-TOKEN": process.env.INTERNAL_TOKEN,
      },
    }
  );
  return data;
};

export const fetchNotify = async () => {
  const { data } = await axios.get(`${process.env.API_URL}/bot/notify`, {});
  return data;
};

// subscription requests
export const fetchUserSubscription = async (
  telegramId: string
): Promise<IUserSubscription> => {
  const { data } = await axios.post(`${process.env.API_URL}/bot/subscription`, {
    telegram_id: telegramId,
  });
  return data;
};

export const generatePromoCode = async (
  telegramId: string,
  days: number = 5
): Promise<string> => {
  const { data } = await axios.post("/bot/promo/generate", {
    telegram_id: telegramId,
    days: days,
  });
  return data.promo_code;
};

export const fetchAllActiveUsers = async (): Promise<IUserSubscription[]> => {
  const { data } = await axios.get("/bot/users/active");
  return data;
};

export const updateLastNotification = async (
  telegramId: string,
  notificationType: string
) => {
  const { data } = await axios.post("/bot/notification/update", {
    telegram_id: telegramId,
    notification_type: notificationType,
  });
  return data;
};
