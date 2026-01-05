import { NotificationType } from "../types/models";
import {
  fetchNotify,
  generatePromoCode,
} from "../config/requests";
import {
  calculateSubscriptionStatus,
  getNotificationType,
  shouldSendNotification,
} from "../shared/subscription";
import { addNotificationToQueue } from "../services/notificationQueue";

const SUPPORT_URL = "https://vpn-p.ru/support";
const CABINET_URL = "https://vpn-p.ru/auth/signup";

const getNotificationMessage = async (
  notificationType: NotificationType,
  promoCode?: string,
  daysExpired?: number
): Promise<string> => {
  switch (notificationType) {
    case NotificationType.THREE_DAYS:
      return `⏳ <b>До окончания подписки — 3 дня</b>

Продлите доступ, чтобы VPN работал без остановок.`;

    case NotificationType.ONE_DAY:
      return `⚠️ <b>Завтра ваш VPN перестанет работать!</b>

До окончания вашей подписки остался 1 день.
Чтобы интернет продолжал работать без ограничений — рекомендуем продлить доступ заранее.`;

    case NotificationType.EXPIRED:
      return `🛑 <b>Уведомление</b>

Срок действия вашей подписки PandaVPN 🐼 истёк.

Восстановите доступ прямо сейчас, чтобы оставаться на связи с быстрым и надежным VPN сервисом.`;

    case NotificationType.TWO_DAYS_EXPIRED:
      return `⛔️ <b>Подписка неактивна</b>

Ваша подписка закончилась 2 дня назад.
Сейчас VPN недоступен, но вы можете прямо сейчас восстановить доступ, просто продлив подписку на сайте в личном кабинете.`;

    case NotificationType.FIVE_DAYS_EXPIRED:
      return `👋 <b>Просто напомним</b>

Подписка закончилась 5 дней назад.
Вы можете продлить подписку прямо сейчас в личном кабинете на сайте.

А если столкнулись с какой либо проблемой обязательно пишите нам в техподдержку, чтобы мы вам помогли.

Мы на связи 🤝🐼`;

    case NotificationType.TEN_DAYS_EXPIRED:
      return `🎁 <b>Подарок от нас</b>

Ваша подписка PandaVPN 🐼 закончилась 10 дней назад 😱
Мы решили сделать вам подарок 😊

Мы дарим 5 дней бесплатного доступа — чтобы вы могли снова воспользоваться VPN без оплаты.

👉 Используйте промокод: <code>${promoCode}</code>

Вы можете абсолютно бесплатно продлить подписку прямо сейчас в личном кабинете на сайте. Перейдите из главного меню по кнопке «Промокоды» и введите полученный вами промокод.

А если столкнулись с какой либо проблемой обязательно пишите нам в техподдержку, чтобы мы вам помогли.

Мы на связи 🤝🐼`;

    case NotificationType.ONE_MONTH_EXPIRED:
      return `👋 <b>Напомним</b>

Прошёл уже месяц с момента окончания вашей подписки,
а вы всё ещё не воспользовались бесплатным промокодом 🎁

👉 <code>${promoCode}</code>

Он по-прежнему даёт 5 дней бесплатного доступа, если VPN снова понадобится.

Мы на связи 🤝🐼`;

    case NotificationType.WEEKLY_REMINDER:
      return `🐼 <b>PandaVPN дарит 5 дней бесплатного пользования</b>

Протестируйте наш супер-быстрый VPN 🔥

Воспользуйтесь промокодом 👉🏻 <code>${promoCode}</code>

Перейдя в личный кабинет на сайте.

А если столкнулись с какой либо проблемой обязательно пишите нам в техподдержку, чтобы мы вам помогли.

Мы на связи 🤝🐼`;

    default:
      return "";
  }
};

export const checkSubscriptionsAndNotify = async (): Promise<void> => {
  try {
    const notifyData = await fetchNotify();
    const users = notifyData.users;

    console.log(`Starting subscription check for ${users.length} users...`);

    let notificationsSent = 0;

    for (const user of users) {
      const status = calculateSubscriptionStatus(user);
      const notificationType = getNotificationType(status);

      if (notificationType && shouldSendNotification(user, notificationType)) {
        let promoCode = user.promo_code;

        if (
          notificationType === NotificationType.TEN_DAYS_EXPIRED &&
          !promoCode
        ) {
          promoCode = await generatePromoCode(user.telegram_id, 5);
        }

        const message = await getNotificationMessage(
          notificationType,
          promoCode,
          status.daysExpired
        );

        if (message) {
          await addNotificationToQueue(
            user.telegram_id,
            notificationType,
            message,
            promoCode,
            status.daysExpired
          );
          notificationsSent++;
          console.log(`Queued notification for user ${user.telegram_id}: ${notificationType}`);
        }
      }
    }

    console.log(`Subscription check completed. Added ${notificationsSent} notifications to queue out of ${users.length} users.`);
  } catch (error) {
    console.error("Error in checkSubscriptionsAndNotify:", error);
  }
};
