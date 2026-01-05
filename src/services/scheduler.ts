import cron from "node-cron";
import { checkSubscriptionsAndNotify } from "../handlers/notifications";

let isRunning = false;

export const initSubscriptionScheduler = (): void => {
  cron.schedule("50 12 * * *", async () => {
    if (isRunning) {
      console.log("Subscription check already running, skipping...");
      return;
    }
    
    isRunning = true;
    console.log("Running subscription check...");
    
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

  console.log("Subscription scheduler initialized. Will run daily at 11:30 Moscow time.");
};
