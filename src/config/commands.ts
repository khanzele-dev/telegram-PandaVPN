import { admin, help, info, start, subscription } from "../handlers/commands";
import { ICommand } from "../types/models";

export const commands: ICommand[] = [
  {
    command: "start",
    description: "Запустить бота",
    auth: false,
    action: start,
  },
  {
    command: "info",
    description: "Что я умею?",
    auth: false,
    action: info,
  },
  {
    command: "help",
    description: "Обратиться в поддержку",
    auth: false,
    action: help,
  },
  {
    command: "subscription",
    description: "Проверить подписку",
    auth: false,
    action: subscription,
  },
  {
    command: "admin",
    description: process.env.ADMIN_HINT as string,
    auth: true,
    action: admin,
  },
];
