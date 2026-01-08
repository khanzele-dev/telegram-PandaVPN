import cron from "node-cron";
import { checkSubscriptionsAndNotify } from "../handlers/notifications";

let isRunning = false;

export const initSubscriptionScheduler = (): void => {
  cron.schedule("50 12 * * *", async () => {
    if (isRunning) {
      return;
    }
    
    isRunning = true;
    try {
      await checkSubscriptionsAndNotify();
    } catch (error) {
      console.error("Error in subscription check:", error);
    } finally {
      isRunning = false;
    }
  }, {
    timezone: "Europe/Moscow",
  });
};
