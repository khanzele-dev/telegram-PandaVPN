import { MyContext, MyConversationContext } from "../types";

export const username = (ctx: MyContext | MyConversationContext) => ctx.from?.first_name ? ctx.from.first_name : ctx.from?.username ? `@${ctx.from.username}` : "Пользователь";