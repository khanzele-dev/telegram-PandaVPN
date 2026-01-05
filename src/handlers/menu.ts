import { statistic } from "./index";
import { MyContext } from "../types";
import { Menu } from "@grammyjs/menu";
import { help, info } from "./commands";

export const mainMenu = new Menu<MyContext>("main-menu")
  .url("🌐 Продлить VPN", "https://vpn-p.ru/auth/signup")
  .row()
  .text("❓ Что я умею?", info)
  .text("🤳🏻 Поддержка", help);

export const adminMenu = new Menu<MyContext>("admin-menu")
  .text("👤 Статистика", statistic)
  .row()
  .text("🔄 Рассылка", async (ctx) => {
    await ctx.conversation.enter("broadcastConversation");
    ctx.menu.close();
  });
