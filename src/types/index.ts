import { Conversation, ConversationFlavor } from "@grammyjs/conversations";
import { HydrateFlavor } from "@grammyjs/hydrate";
import { MenuFlavor } from "@grammyjs/menu";
import { Context } from "grammy";

export type MyContext = ConversationFlavor<
  Context & HydrateFlavor<Context> & MenuFlavor
>;
export type MyConversationContext = HydrateFlavor<Context & MenuFlavor>;
export type MyConversation = Conversation<MyContext, MyConversationContext>;
