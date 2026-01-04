import dotenv from "dotenv";
import { hydrate } from "@grammyjs/hydrate";
import { commands } from "./config/commands";
import { adminMenu, mainMenu } from "./handlers/menu";
import { MyContext, MyConversationContext } from "./types";
import { conversations, createConversation } from "@grammyjs/conversations";
import { Bot, GrammyError, HttpError, NextFunction } from "grammy";
import { broadcastConversation, registrationConversation } from "./handlers/conversations";
import { initSubscriptionScheduler } from "./services/scheduler";
import "./services/notificationQueue";

dotenv.config({ path: "src/.env" });

const bot = new Bot<MyContext>(process.env.BOT_TOKEN as string);

bot.api.setMyCommands(commands.filter((command) => !command.auth));

bot.use(
  conversations<MyContext, MyConversationContext>({ plugins: [hydrate()] })
);

commands.map((command) => {
  bot.command(command.command, (ctx: MyContext, next: NextFunction) => {
    ctx.conversation.exitAll();
    return next();
  });
});

bot.use(createConversation(broadcastConversation));
bot.use(createConversation(registrationConversation));

bot.use(adminMenu);
bot.use(mainMenu);

commands
  .filter((command) => command.auth)
  .map((command) => {
    bot.command(
      command.command,
      (ctx: MyContext, next: NextFunction) => {
        if (ctx.match === process.env.ADMIN_PASSWORD) {
          return next();
        }
      },
      command.action
    );
  });

commands
  .filter((command) => !command.auth)
  .map((command) => {
    bot.command(command.command, command.action);
    bot.callbackQuery(command.command, command.action);
  });

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

initSubscriptionScheduler();

bot.start();