import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  /**
   * imageUploader
   * Accepts a single image, max 4MB.
   * Verifies the user is a logged-in MERCHANT before allowing upload.
   */
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();

      if (!session?.user?.id) throw new UploadThingError("Unauthorized");
      if (session.user.role !== "MERCHANT" && session.user.role !== "ADMIN") {
        throw new UploadThingError("Only merchants can upload images.");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url:", file.ufsUrl);
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
