"use client";

import React, { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createSurplusDrop } from "@/app/actions/merchant";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/utils/uploadthing";
import { useToast } from "@/components/shared/ToastProvider";

export function CreateDropPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => {
    setIsOpen(false);
    setError(null);
    setUploadedImageUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await createSurplusDrop(formData);
      
      if (result?.error) {
        setError(result.error);
        toast(result.error, "error");
      } else if (result?.success) {
        handleClose();
        toast("Drop published successfully", "success");
        router.refresh();
      }
    });
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        className="group relative flex items-center justify-center px-8 py-4 overflow-hidden border border-[#1C1C1E] bg-[#1C1C1E] text-[#FAF9F6] transition-colors hover:bg-transparent hover:text-[#1C1C1E]"
      >
        <span className="text-xs uppercase tracking-[0.25em] font-medium z-10 transition-colors">
          Create Drop
        </span>
      </button>

      {/* Slide-out Panel Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-[#1C1C1E]/20 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[#FAF9F6] shadow-2xl z-50 overflow-y-auto border-l border-border/30"
            >
              <div className="p-8 md:p-12">
                <div className="flex justify-between items-center mb-12">
                  <h2 className="text-2xl font-light tracking-widest uppercase">New Drop</h2>
                  <button
                    onClick={handleClose}
                    disabled={isPending}
                    className="text-xs uppercase tracking-widest text-[#1C1C1E]/60 hover:text-[#1C1C1E] transition-colors"
                  >
                    Close
                  </button>
                </div>

                {error && (
                  <div className="mb-8 p-4 border border-red-200 bg-red-50 text-red-600 text-xs uppercase tracking-widest">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8 flex flex-col">
                  {/* Hidden field for image URL */}
                  <input type="hidden" name="imageUrl" value={uploadedImageUrl || ""} />

                  {/* Cover Image Upload */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#1C1C1E]/60">
                      Cover Image
                    </span>

                    {uploadedImageUrl ? (
                      <div className="relative aspect-[4/5] w-full overflow-hidden border border-[#1C1C1E]/10">
                        <img
                          src={uploadedImageUrl}
                          alt="Uploaded cover"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setUploadedImageUrl(null)}
                          className="absolute top-3 right-3 bg-[#FAF9F6]/90 backdrop-blur-sm px-3 py-1.5 text-[10px] uppercase tracking-widest text-[#1C1C1E] border border-[#1C1C1E]/10 hover:border-[#1C1C1E]/40 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <UploadDropzone
                        endpoint="imageUploader"
                        onClientUploadComplete={(res) => {
                          if (res?.[0]) {
                            setUploadedImageUrl(res[0].ufsUrl);
                          }
                        }}
                        onUploadError={(error: Error) => {
                          setError(`Upload failed: ${error.message}`);
                        }}
                        config={{ mode: "auto" }}
                        appearance={{
                          container: "border border-dashed border-[#1C1C1E]/20 bg-[#1C1C1E]/[0.02] hover:bg-[#1C1C1E]/[0.04] transition-colors cursor-pointer py-10 ut-uploading:border-[#1C1C1E]/40",
                          label: "text-[#1C1C1E]/60 text-xs uppercase tracking-widest font-medium hover:text-[#1C1C1E] transition-colors",
                          allowedContent: "text-[#1C1C1E]/40 text-[10px] uppercase tracking-widest",
                          button: "bg-[#1C1C1E] text-[#FAF9F6] text-[10px] uppercase tracking-[0.2em] font-medium px-6 py-2.5 hover:bg-[#1C1C1E]/80 transition-colors ut-uploading:bg-[#1C1C1E]/60",
                          uploadIcon: "text-[#1C1C1E]/30 w-8 h-8",
                        }}
                      />
                    )}
                  </div>

                  {/* Title */}
                  <div className="flex flex-col gap-2 border-b border-[#1C1C1E]/20 pb-2 focus-within:border-[#1C1C1E] transition-colors">
                    <label htmlFor="title" className="text-[10px] uppercase tracking-[0.2em] text-[#1C1C1E]/60">
                      Title
                    </label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      required
                      placeholder="e.g. A5 Wagyu Trim Offcuts"
                      className="bg-transparent border-none outline-none text-base placeholder:text-[#1C1C1E]/30 text-[#1C1C1E]"
                    />
                  </div>

                  {/* Original Price */}
                  <div className="flex flex-col gap-2 border-b border-[#1C1C1E]/20 pb-2 focus-within:border-[#1C1C1E] transition-colors">
                    <label htmlFor="originalPrice" className="text-[10px] uppercase tracking-[0.2em] text-[#1C1C1E]/60">
                      Original Price (₱)
                    </label>
                    <input
                      id="originalPrice"
                      name="originalPrice"
                      type="number"
                      step="0.01"
                      required
                      placeholder="1500.00"
                      className="bg-transparent border-none outline-none text-base placeholder:text-[#1C1C1E]/30 text-[#1C1C1E]"
                    />
                  </div>

                  {/* Surplus Price */}
                  <div className="flex flex-col gap-2 border-b border-[#1C1C1E]/20 pb-2 focus-within:border-[#1C1C1E] transition-colors">
                    <label htmlFor="reservedPrice" className="text-[10px] uppercase tracking-[0.2em] text-[#1C1C1E]/60">
                      Surplus Price (₱)
                    </label>
                    <input
                      id="reservedPrice"
                      name="reservedPrice"
                      type="number"
                      step="0.01"
                      required
                      placeholder="500.00"
                      className="bg-transparent border-none outline-none text-base placeholder:text-[#1C1C1E]/30 text-[#1C1C1E]"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="flex flex-col gap-2 border-b border-[#1C1C1E]/20 pb-2 focus-within:border-[#1C1C1E] transition-colors">
                    <label htmlFor="quantityAvailable" className="text-[10px] uppercase tracking-[0.2em] text-[#1C1C1E]/60">
                      Quantity Available
                    </label>
                    <input
                      id="quantityAvailable"
                      name="quantityAvailable"
                      type="number"
                      min="1"
                      required
                      placeholder="5"
                      className="bg-transparent border-none outline-none text-base placeholder:text-[#1C1C1E]/30 text-[#1C1C1E]"
                    />
                  </div>

                  {/* Pickup Time */}
                  <div className="flex flex-col gap-2 border-b border-[#1C1C1E]/20 pb-2 focus-within:border-[#1C1C1E] transition-colors">
                    <label htmlFor="pickupTimeWindow" className="text-[10px] uppercase tracking-[0.2em] text-[#1C1C1E]/60">
                      Pickup Time Window
                    </label>
                    <input
                      id="pickupTimeWindow"
                      name="pickupTimeWindow"
                      type="text"
                      required
                      list="pickupTimeOptions"
                      autoComplete="off"
                      placeholder="Select or type a time window"
                      className="bg-transparent border-none outline-none text-base placeholder:text-[#1C1C1E]/30 text-[#1C1C1E]"
                    />
                    <datalist id="pickupTimeOptions">
                      <option value="Today, 11:00 AM - 1:00 PM" />
                      <option value="Today, 1:00 PM - 3:00 PM" />
                      <option value="Today, 3:00 PM - 5:00 PM" />
                      <option value="Today, 5:00 PM - 7:00 PM" />
                      <option value="Today, 7:00 PM - 9:00 PM" />
                      <option value="Tomorrow, 8:00 AM - 10:00 AM" />
                      <option value="Tomorrow, 10:00 AM - 12:00 PM" />
                      <option value="Tomorrow, 12:00 PM - 2:00 PM" />
                    </datalist>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="mt-8 relative flex items-center justify-center px-8 py-5 border border-[#1C1C1E] text-[#1C1C1E] hover:bg-[#1C1C1E] hover:text-[#FAF9F6] transition-all duration-300 disabled:opacity-50"
                  >
                    <span className="text-xs uppercase tracking-[0.25em] font-medium">
                      {isPending ? "Creating..." : "Publish Drop"}
                    </span>
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
