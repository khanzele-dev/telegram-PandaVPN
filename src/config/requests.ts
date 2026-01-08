import axios from "axios";
import dotenv from "dotenv";
import { IUserSubscription } from "../types/models";

dotenv.config({ path: "src/.env" });

// Универсальный axios-инстанс с обязательным заголовком X-INTERNAL-TOKEN
export const api = axios.create({
  baseURL: process.env.API_URL,
  headers: {
    "X-INTERNAL-TOKEN": process.env.INTERNAL_TOKEN,
  },
});

// Типы для API-ответов
export interface AdminFindParams {
  telegram_id?: number;
  email?: string;
  phone?: string;
}

export interface AdminFindResponse {
  id?: number;
  telegram_id?: number;
  email?: string | null;
  phone?: string;
  [key: string]: unknown;
}

// Универсальный поиск пользователя (новый API)
export const adminFind = async (
  params: AdminFindParams
): Promise<AdminFindResponse> => {
  const { data } = await api.get("/api/admin/find", { params });
  return data;
};

export const fetchUserData = async (telegramId: string): Promise<AdminFindResponse> => {
  const { data } = await api.get("/api/admin/find", {
    params: { telegram_id: telegramId },
  });
  return data;
};

export const fetchRegisterUser = async (telegramId: number, phone: string) => {
  const { data } = await api.post("/bot/register", {
    telegram_id: telegramId,
    phone: Number(phone),
  });
  return data;
};

export const fetchNotify = async () => {
  const { data } = await api.get("/bot/notify");
  return data;
};

// subscription requests
export const fetchUserSubscription = async (
  telegramId: string
): Promise<IUserSubscription> => {
  const { data } = await api.post("/bot/subscription", {
    telegram_id: telegramId,
  });
  return data;
};

export const generatePromoCode = async (
  telegramId: string,
  days: number = 5
): Promise<string> => {
  const { data } = await api.post("/bot/promo/generate", {
    telegram_id: telegramId,
    days: days,
  });
  return data.promo_code;
};

export const fetchAllActiveUsers = async (): Promise<IUserSubscription[]> => {
  const { data } = await api.get("/bot/users/active");
  return data;
};

export const updateLastNotification = async (
  telegramId: string,
  notificationType: string
) => {
  const { data } = await api.post("/bot/notification/update", {
    telegram_id: telegramId,
    notification_type: notificationType,
  });
  return data;
};

// Email binding requests (новый API)
export const bindEmail = async (
  telegramId: number,
  email: string
): Promise<{ success: boolean; message?: string }> => {
  const { data } = await api.post("/api/admin/bind-email", {
    telegram_id: telegramId,
    email: email,
  });
  return data;
};

// Проверка, занят ли email другим пользователем
export const checkEmailAvailability = async (
  email: string
): Promise<AdminFindResponse | null> => {
  try {
    const { data } = await api.get("/api/admin/find", {
      params: { email },
    });
    return data;
  } catch (error: unknown) {
    // Если пользователь не найден - email свободен
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// Валидация email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
