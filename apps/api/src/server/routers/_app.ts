import { router, publicProcedure } from "@infra/trpc";
import { proRouter } from "@modules/pro/pro.router";
import { authRouter } from "@modules/auth/auth.router";
import { reviewRouter } from "@modules/review/review.router";
import { paymentRouter } from "@modules/payment/payment.router";
import { notificationRouter } from "@modules/notification/notification.router";
import { pushRouter } from "@modules/push/push.router";
import { clientProfileRouter } from "@modules/user/clientProfile.router";
import { earningRouter } from "@modules/payout/earning.router";
import { payoutRouter } from "@modules/payout/payout.router";
import { proPayoutRouter } from "@modules/payout/proPayout.router";
import { auditRouter } from "@modules/audit/audit.router";
import { searchRouter } from "@modules/search/search.router";
import { contactRouter } from "@modules/contact/contact.router";
import { categoryRouter } from "@modules/category/category.router";
import { subcategoryRouter } from "@modules/subcategory/subcategory.router";
import { orderRouter } from "@modules/order/order.router";
import { chatRouter } from "@modules/chat/chat.router";

export const appRouter = router({
  health: router({
    ping: publicProcedure.query(() => {
      return {
        ok: true,
        time: new Date(),
      };
    }),
  }),
  auth: authRouter,
  pro: proRouter,
  review: reviewRouter,
  payment: paymentRouter,
  notification: notificationRouter,
  push: pushRouter,
  clientProfile: clientProfileRouter,
  earning: earningRouter,
  payout: payoutRouter,
  proPayout: proPayoutRouter,
  audit: auditRouter,
  contact: contactRouter,
  category: categoryRouter,
  subcategory: subcategoryRouter,
  order: orderRouter,
  chat: chatRouter,
  clientSearch: router({
    searchPros: searchRouter.searchPros,
  }),
});

export type AppRouter = typeof appRouter;
