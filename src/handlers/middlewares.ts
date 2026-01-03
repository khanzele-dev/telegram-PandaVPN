import { fetchUserData } from "../config/requests";
import { MyContext } from "../types";

export async function isRegistered(ctx: MyContext): Promise<boolean> {
  try {
    if (!ctx.from?.id) {
      throw "Не удалось определить id пользователя";
    }
    await fetchUserData(ctx.from.id.toString());
    return true;
  } catch (err) {
    console.error("Ошибка проверки регистрации пользователя:", err);
    return false;
  }
}