import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import * as adminProcedures from "../admin/procedures";
import * as authProcedures from "../auth/procedures";
import * as billingProcedures from "../billing/procedures";
import * as uploadsProcedures from "../uploads/procedures";
import { router } from "./trpc";

export const apiRouter = router({
  auth: router(authProcedures),
  billing: router(billingProcedures),
  uploads: router(uploadsProcedures),
  admin: router(adminProcedures),
});

export type ApiRouter = typeof apiRouter;
export type ApiInput = inferRouterInputs<ApiRouter>;
export type ApiOutput = inferRouterOutputs<ApiRouter>;
