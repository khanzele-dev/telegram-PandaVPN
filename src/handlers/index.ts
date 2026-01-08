import { MyContext } from "../types";

export const statistic = async (ctx: MyContext) => {
  await ctx.reply(
    `<b>📊 Статистика</b>\n\n<b>👥 Всего пользователей:</b> ${""}\n<b>🚫 Заблокировавших бота:</b> ${""}`,
    { parse_mode: "HTML" }
  );
  if (ctx.menu) {
    ctx.menu.close();
  }
};