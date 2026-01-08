import { fetchUserData, AdminFindResponse } from "../config/requests";
import { MyContext } from "../types";

// Универсальная проверка регистрации по telegram_id
export async function isRegisteredById(telegramId: number): Promise<boolean> {
  try {
    await fetchUserData(telegramId.toString());
    return true;
  } catch {
    return false;
  }
}

// Проверка регистрации через контекст (для обратной совместимости)
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

// Получение данных пользователя
export async function getUserData(telegramId: number): Promise<AdminFindResponse | null> {
  try {
    return await fetchUserData(telegramId.toString());
  } catch {
    return null;
  }
}