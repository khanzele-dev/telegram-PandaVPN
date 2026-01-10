import axios from "axios";
import dotenv from "dotenv";
import { IUserSubscription } from "../types/models";

dotenv.config({ path: "src/.env" });

export const api = axios.create({
  baseURL: process.env.API_URL,
  headers: {
    "X-INTERNAL-TOKEN": process.env.INTERNAL_TOKEN,
  },
});

export interface AdminFindParams {
  telegram_id?: string;
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

export const adminFind = async (
  params: AdminFindParams
): Promise<AdminFindResponse> => {
  const { data } = await api.get("/admin/find", { params });
  return data;
};

export const fetchUserData = async (
  telegramId: string
): Promise<AdminFindResponse> => {
  const { data } = await api.get("/admin/find", {
    params: { telegram_id: telegramId },
  });
  return data;
};

export const fetchRegisterUser = async (telegramId: number, phone: string) => {
  const { data } = await api.post("/bot/register", {
    telegram_id: telegramId,
    phone: phone,
  });
  return data;
};

export const fetchNotify = async () => {
  const { data } = await api.get("/bot/notify");
  return data;
};

export const fetchUserSubscription = async (
  telegramId: string
): Promise<IUserSubscription> => {
  const { data } = await api.post("/bot/subscription", {
    telegram_id: telegramId,
  });
  return data;
};

export const bindEmail = async (
  telegramId: number,
  email: string
): Promise<{ success: boolean; message?: string }> => {
  const { data } = await api.post("/admin/bind-email", {
    telegram_id: telegramId,
    email,
  });
  return data;
};

export const getUsers = async (): Promise<{
  users: [{ telegram_id: number; didBlock: boolean }];
  total: number;
}> => {
  const { data } = await api.get("/bot/users/didblock");
  return data;
};

export const setDidBlock = async (
  telegramId: number,
  didBlock: boolean
): Promise<{ success: boolean; telegram_id: number; didBlock: boolean }> => {
  const { data } = await api.put("/bot/didblock", {
    telegram_id: telegramId,
    didBlock,
  });
  return data;
};

export const getStatistic = async (): Promise<{
  total_users_with_telegram: number;
  blocked_users: number;
}> => {
  const { data } = await api.get("/bot/stats/didblock");
  return data;
};

export const checkEmailAvailability = async (
  email: string
): Promise<AdminFindResponse | null> => {
  try {
    const { data } = await api.get("/admin/find", {
      params: { email },
    });
    return data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
