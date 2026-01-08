import { ISubscriptionStatus, IUserSubscription, NotificationType } from "../types/models";

export const calculateSubscriptionStatus = (subscription: IUserSubscription): ISubscriptionStatus => {
  const now = new Date();
  const endDate = subscription.subscription_end_date ? new Date(subscription.subscription_end_date) : null;

  if (!endDate) {
    return {
      isActive: false,
      daysRemaining: 0,
      daysExpired: 0,
      endDate: null,
      promoCode: subscription.promo_code,
      promoCodeUsed: subscription.promo_code_used,
    };
  }

  const timeDiff = endDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  if (daysDiff >= 0) {
    return {
      isActive: true,
      daysRemaining: daysDiff,
      daysExpired: 0,
      endDate,
      promoCode: subscription.promo_code,
      promoCodeUsed: subscription.promo_code_used,
    };
  } else {
    return {
      isActive: false,
      daysRemaining: 0,
      daysExpired: Math.abs(daysDiff),
      endDate,
      promoCode: subscription.promo_code,
      promoCodeUsed: subscription.promo_code_used,
    };
  }
};

export const getNotificationType = (status: ISubscriptionStatus): NotificationType | null => {
  if (status.isActive) {
    if (status.daysRemaining === 3) {
      return NotificationType.THREE_DAYS;
    } else if (status.daysRemaining === 1) {
      return NotificationType.ONE_DAY;
    }
  } else {
    if (status.daysExpired === 0) {
      return NotificationType.EXPIRED;
    } else if (status.daysExpired === 2) {
      return NotificationType.TWO_DAYS_EXPIRED;
    } else if (status.daysExpired === 5) {
      return NotificationType.FIVE_DAYS_EXPIRED;
    } else if (status.daysExpired === 10) {
      return NotificationType.TEN_DAYS_EXPIRED;
    } else if (status.daysExpired === 30) {
      return NotificationType.ONE_MONTH_EXPIRED;
    } else if (status.daysExpired > 30 && status.daysExpired % 7 === 0) {
      return NotificationType.WEEKLY_REMINDER;
    }
  }
  return null;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const shouldSendNotification = (
  subscription: IUserSubscription,
  notificationType: NotificationType
): boolean => {
  if (!subscription.last_notification_sent) {
    return true;
  }

  const lastSent = new Date(subscription.last_notification_sent);
  const now = new Date();
  const daysSinceLastNotification = Math.floor(
    (now.getTime() - lastSent.getTime()) / (1000 * 3600 * 24)
  );

  if (notificationType === NotificationType.WEEKLY_REMINDER) {
    return daysSinceLastNotification >= 7;
  }

  return daysSinceLastNotification >= 1;
};
  if (!subscription.last_notification_sent) {
