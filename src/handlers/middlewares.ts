import { MyContext } from "../types";
import { fetchUserData } from "../config/requests";

export const isRegisteredById = async (telegramId: number): Promise<boolean> => {
  try {
    const data = await fetchUserData(telegramId.toString());
    return !!data && !!data.telegram_id;
  } catch (error: unknown) {
    return false;
  }
};

export const isRegistered = async (ctx: MyContext): Promise<boolean> => {
  if (!ctx.from) return false;
  return isRegisteredById(ctx.from.id);
};

export const getUserData = async (
  telegramId: number
): Promise<import("../config/requests").AdminFindResponse | null> => {
  try {
    const data = await fetchUserData(telegramId.toString());
    return data;
  } catch (error: unknown) {
    return null;
  }
};