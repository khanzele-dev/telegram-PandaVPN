// import User from "../database/models/User";
import { MyContext } from "../types";

export const statistic = async (ctx: MyContext) => {
  //   const users = await User.countDocuments();
  //   const blockedUsers = await User.countDocuments({ didBlock: true });
  await ctx.reply(
    `<b>📊 Статистика</b>\n\n<b>👥 Всего пользователей:</b> ${/**users*/ ""}\n<b>🚫 Заблокировавших бота:</b> ${/**blockedUsers*/ ""}`,
    { parse_mode: "HTML" }
  );
  if (ctx.menu) {
    ctx.menu.close();
  }
};