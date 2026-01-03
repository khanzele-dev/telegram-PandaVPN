import cron from "node-cron";
import { checkSubscriptionsAndNotify } from "../handlers/notifications";

export const initSubscriptionScheduler = (): void => {
  cron.schedule("0 23 * * *", async () => {
    console.log("Running subscription check...");
    await checkSubscriptionsAndNotify();
  }, {
    timezone: "Europe/Moscow"
  });

  console.log("Subscription scheduler initialized. Will run daily at 23:00 Moscow time.");
};
