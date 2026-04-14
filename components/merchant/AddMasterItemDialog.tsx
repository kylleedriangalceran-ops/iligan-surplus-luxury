"use client";

import React, { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UploadDropzone } from "@/utils/uploadthing";
import { useToast } from "@/hooks/useToast";
import { ActionButton } from "@/components/shared/ActionButton";
import { addMasterMenuItem } from "@/app/actions/inventory";

export function AddMasterItemDialog() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <ActionButton variant="solid" className="min-w-[210px]">
          Add New Item
        </ActionButton>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New Master Item</DialogTitle>
          <DialogDescription>Create a template once. Publish in one tap daily.</DialogDescription>
        </DialogHeader>

        <form
          action={(formData) => {
            startTransition(async () => {
              const res = await addMasterMenuItem(formData);
              if (res?.error) {
                toast(res.error, "error");
                return;
              }
              toast("Master item saved", "success");
              setUploadedImageUrl(null);
              setIsOpen(false);
            });
          }}
          className="space-y-5"
        >
          <input type="hidden" name="imageUrl" value={uploadedImageUrl || ""} />

          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 font-semibold">
              Cover Image
            </p>
            {uploadedImageUrl ? (
              <div className="relative aspect-4/5 w-full overflow-hidden rounded-2xl border border-[#1C1C1E]/10">
                <img src={uploadedImageUrl} alt="Cover" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setUploadedImageUrl(null)}
                  className="absolute right-3 top-3 rounded-full border border-[#1C1C1E]/10 bg-white/80 px-3 py-1.5 text-[10px] uppercase tracking-widest text-[#1C1C1E]/70 hover:text-[#1C1C1E]"
                >
                  Remove
                </button>
              </div>
            ) : (
              <UploadDropzone
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  if (res?.[0]) {
                    setUploadedImageUrl(res[0].url);
                    toast("Image uploaded", "success");
                  }
                }}
                onUploadError={(error: Error) => {
                  toast(`Upload failed: ${error.message}`, "error");
                }}
                config={{ mode: "auto" }}
                content={{ label: "Choose a file or drag and drop", allowedContent: "PNG/JPG • Up to 4MB" }}
                appearance={{
                  container:
                    "bg-transparent cursor-pointer py-4 flex flex-col items-center justify-center max-w-full overflow-hidden",
                  label:
                    "text-[#1C1C1E] text-[13px] font-semibold tracking-widest uppercase hover:text-[#1C1C1E]/70 transition-colors mt-2 whitespace-nowrap",
                  allowedContent: "text-[#1C1C1E]/60 text-[10px] tracking-wider uppercase mt-1 whitespace-nowrap",
                  button:
                    "mt-4 rounded-[8px] bg-[#1C1C1E] text-[#FAF9F6] text-[11px] font-semibold uppercase tracking-[0.1em] hover:bg-[#1C1C1E]/90 transition-all px-6 py-3.5 whitespace-nowrap cursor-pointer",
                  uploadIcon: "text-[#1C1C1E]/50 w-7 h-7 mx-auto",
                }}
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="border-b border-[#1C1C1E]/15 pb-2 focus-within:border-[#1C1C1E]/40 transition-colors">
              <label className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 font-semibold">
                Name
              </label>
              <input
                name="name"
                required
                placeholder="e.g. Almond Croissant"
                className="mt-2 w-full bg-transparent outline-none text-sm text-[#1C1C1E] placeholder:text-[#1C1C1E]/30"
              />
            </div>

            <div className="border-b border-[#1C1C1E]/15 pb-2 focus-within:border-[#1C1C1E]/40 transition-colors">
              <label className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 font-semibold">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Short, sensory description."
                className="mt-2 w-full resize-none bg-transparent outline-none text-sm text-[#1C1C1E] placeholder:text-[#1C1C1E]/30"
              />
            </div>

            <div className="border-b border-[#1C1C1E]/15 pb-2 focus-within:border-[#1C1C1E]/40 transition-colors">
              <label className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 font-semibold">
                Base Price (₱)
              </label>
              <input
                name="originalPrice"
                required
                inputMode="decimal"
                placeholder="150.00"
                className="mt-2 w-full bg-transparent outline-none text-sm text-[#1C1C1E] placeholder:text-[#1C1C1E]/30"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <ActionButton type="submit" variant="solid" disabled={isPending}>
              {isPending ? "Saving..." : "Save Item"}
            </ActionButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

