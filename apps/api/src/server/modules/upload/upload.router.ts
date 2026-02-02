import { protectedProcedure } from "@infra/trpc";
import { container, TOKENS } from "@/server/container";
import { UploadService } from "./upload.service";
import {
  presignedUploadRequestSchema,
  presignedUploadResponseSchema,
} from "@repo/upload";

const uploadService = container.resolve<UploadService>(TOKENS.UploadService);

export const uploadRouter = {
  getPresignedUploadUrl: protectedProcedure
    .input(presignedUploadRequestSchema)
    .output(presignedUploadResponseSchema)
    .mutation(async ({ input, ctx }) => {
      return uploadService.createPresignedUploadUrl(ctx.actor, input);
    }),
};
