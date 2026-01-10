import { getStatistic } from "../config/requests";
import { MyContext } from "../types";

export const statistic = async (ctx: MyContext) => {
  const result = await getStatistic();
  await ctx.reply(
    `<b>📊 Статистика</b>\n\n<b>👥 Всего пользователей: ${result.total_users_with_telegram}</b>\n<b>🚫 Заблокировавших бота: ${result.blocked_users}</b>`,
    { parse_mode: "HTML" }
  );
  if (ctx.menu) {
    ctx.menu.close();
  }
};
