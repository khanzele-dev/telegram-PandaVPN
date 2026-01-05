import cron from "node-cron";
import { checkSubscriptionsAndNotify } from "../handlers/notifications";

export const initSubscriptionScheduler = (): void => {
  cron.schedule("30 12 * * *", async () => {
    console.log("Running subscription check...");
    await checkSubscriptionsAndNotify();
  }, {
    timezone: "Europe/Moscow"
  });

  console.log("Subscription scheduler initialized. Will run daily at 12:30 Moscow time.");
};
