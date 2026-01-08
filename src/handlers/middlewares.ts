import { fetchUserData, AdminFindResponse } from "../config/requests";
import { MyContext } from "../types";

export async function isRegisteredById(telegramId: number): Promise<boolean> {
  try {
    await fetchUserData(telegramId.toString());
    console.log("User data found for telegramId:", telegramId);
    return true;
  } catch {
    console.log("User data not found for telegramId:", telegramId);
    return false;
  }
}

export async function isRegistered(ctx: MyContext): Promise<boolean> {
  try {
    if (!ctx.from?.id) {
      throw new Error("Не удалось определить id пользователя");
    }
    return await isRegisteredById(ctx.from.id);
  } catch (err) {
    console.error("Ошибка проверки регистрации пользователя:", err);
    return false;
  }
}

export async function getUserData(telegramId: number): Promise<AdminFindResponse | null> {
  try {
    return await fetchUserData(telegramId.toString());
  } catch {
    return null;
  }
}