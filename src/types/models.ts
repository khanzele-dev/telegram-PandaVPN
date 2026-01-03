import { MyContext } from "./index";
import { BotCommand } from "grammy/types";

export interface ICommand extends BotCommand {
    description: string;
    auth: boolean;
    action: (ctx: MyContext) => Promise<void>;
}

export interface IUserSubscription {
    telegram_id: string;
    subscription_end_date: Date | null;
    is_active: boolean;
    promo_code?: string;
    promo_code_used?: boolean;
    last_notification_sent?: Date;
}

export interface INotifyResponse {
    users: IUserSubscription[];
    total_count: number;
    by_type: {
        "3_days": number;
        "1_day": number;
        expired: number;
        "2_days_expired": number;
        "5_days_expired": number;
        "10_days_expired": number;
        "1_month_expired": number;
        weekly_reminder: number;
    };
}

export interface ISubscriptionStatus {
    isActive: boolean;
    daysRemaining: number;
    daysExpired: number;
    endDate: Date | null;
    promoCode?: string;
    promoCodeUsed?: boolean;
}

export enum NotificationType {
    THREE_DAYS = "three_days",
    ONE_DAY = "one_day",
    EXPIRED = "expired",
    TWO_DAYS_EXPIRED = "two_days_expired",
    FIVE_DAYS_EXPIRED = "five_days_expired",
    TEN_DAYS_EXPIRED = "ten_days_expired",
    ONE_MONTH_EXPIRED = "one_month_expired",
    WEEKLY_REMINDER = "weekly_reminder",
}