"use client";

import React, { useState, useTransition, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createSurplusDrop } from "@/app/actions/merchant";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/utils/uploadthing";
import { useToast } from "@/hooks/useToast";
import { ActionButton } from "@/components/shared/ActionButton";
import Image from "next/image";

export function CreateDropPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state across unmounts
  const [title, setTitle] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [reservedPrice, setReservedPrice] = useState("");
  const [quantityAvailable, setQuantityAvailable] = useState("");
  const [pickupTimeWindow, setPickupTimeWindow] = useState("");

  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragCounter, setDragCounter] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  const handleOpen = () => {
    setIsOpen(true);
    document.body.style.overflow = "hidden";
  };
  const handleClose = () => {
    setIsOpen(false);
    setError(null);
    document.body.style.overflow = "";
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleFullClear = () => {
    setTitle("");
    setOriginalPrice("");
    setReservedPrice("");
    setQuantityAvailable("");
    setPickupTimeWindow("");
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
        handleFullClear();
        handleClose();
        toast("Drop published successfully", "success");
        router.refresh();
      }
    });
  };

  return (
    <>
      {/* Trigger Button */}
      <ActionButton
        onClick={handleOpen}
        variant="solid"
        className="px-8"
      >
        Create Drop
      </ActionButton>

      {/* Slide-out Panel Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose} // Re-enabled because state is preserved
              className="fixed inset-0 bg-[#1C1C1E]/20 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[#FAF9F6] shadow-2xl z-50 overflow-hidden border-l border-[#1C1C1E]/10 flex flex-col"
            >
              {/* Header — pinned */}
              <div className="px-6 md:px-8 pt-8 pb-5 flex justify-between items-center shrink-0 border-b border-[#1C1C1E]/8">
                <h2 className="text-[14px] font-semibold tracking-[0.15em] uppercase text-[#1C1C1E]">
                  New Drop
                </h2>
                <button
                  onClick={handleClose}
                  disabled={isPending}
                  className="text-xs uppercase tracking-widest text-[#1C1C1E]/60 hover:text-[#1C1C1E] transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Scrollable form body */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-6 md:px-8 py-6">
                {error && (
                  <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-600 text-xs uppercase tracking-widest rounded-lg">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 flex flex-col pt-1">
                  {/* Hidden field for image URL */}
                  <input type="hidden" name="imageUrl" value={uploadedImageUrl || ""} />

                  {/* Cover Image Upload */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#1C1C1E]/60">
                      Cover Image
                    </span>

                    <AnimatePresence mode="wait">
                      {uploadedImageUrl ? (
                        <motion.div
                          key="preview"
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.97 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="relative w-full overflow-hidden rounded-[10px] border border-[#1C1C1E]/10"
                        >
                          <Image
                            src={uploadedImageUrl}
                            alt="Uploaded cover"
                            width={800}
                            height={600}
                            className="w-full h-auto object-contain block"
                          />
                          <button
                            type="button"
                            onClick={() => setUploadedImageUrl(null)}
                            className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-3 py-1.5 text-[9px] uppercase tracking-widest text-[#1C1C1E] border border-[#1C1C1E]/10 rounded hover:bg-white transition-all shadow-sm"
                          >
                            Remove
                          </button>
                        </motion.div>
                      ) : (
                        <AnimatePresence mode="wait">
                          {isUploading ? (
                            <motion.div
                              key="uploading"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                              className="py-10 px-6 border border-[#1C1C1E]/10 rounded-[10px] bg-white flex flex-col items-center justify-center text-center"
                            >
                              <motion.div
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                                className="mb-5"
                              >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#1C1C1E]/40">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
                                  <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round"/>
                                  <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round"/>
                                </svg>
                              </motion.div>
                              <div className="w-full max-w-[160px] mb-3">
                                <div className="w-full bg-[#1C1C1E]/6 rounded-full h-[3px] overflow-hidden">
                                  <motion.div
                                    className="bg-[#1C1C1E] h-full rounded-full"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${uploadProgress}%` }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                  />
                                </div>
                              </div>
                              <span className="text-[10px] font-mono tracking-widest text-[#1C1C1E]/40">
                                {uploadProgress < 100 ? `${uploadProgress}%` : "Processing..."}
                              </span>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="dropzone"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                              onDragEnter={() => setDragCounter(p => p + 1)}
                              onDragLeave={() => setDragCounter(p => p - 1)}
                              onDrop={() => setDragCounter(0)}
                            >
                              <UploadDropzone
                                endpoint="imageUploader"
                                onUploadBegin={() => {
                                  setIsUploading(true);
                                  setUploadProgress(0);
                                }}
                                onUploadProgress={(progress) => {
                                  setUploadProgress(progress);
                                }}
                                onClientUploadComplete={(res) => {
                                  setIsUploading(false);
                                  if (res?.[0]) {
                                    setUploadedImageUrl(res[0].url);
                                    toast("Image uploaded successfully", "success");
                                  }
                                }}
                                onUploadError={(error: Error) => {
                                  setIsUploading(false);
                                  setError(`Upload failed: ${error.message}`);
                                  toast(`Upload failed: ${error.message}`, "error");
                                }}
                                config={{ mode: "auto" }}
                                content={{
                                  label: dragCounter > 0 ? "Drag and Drop the file here" : "Choose a file or drag and drop",
                                  allowedContent: "PNG/JPG • Up to 4MB",
                                }}
                                appearance={{
                                  container:
                                    "bg-transparent cursor-pointer py-2 flex flex-col items-center justify-center max-w-full overflow-hidden",
                                  label:
                                    "text-[#1C1C1E] text-[13px] font-semibold tracking-widest uppercase hover:text-[#1C1C1E]/70 transition-colors mt-2 whitespace-nowrap",
                                  allowedContent:
                                    "text-[#1C1C1E]/60 text-[10px] tracking-wider uppercase mt-1 whitespace-nowrap",
                                  button:
                                    "mt-12 text-xs font-medium uppercase tracking-widest !text-[#1C1C1E]/60 hover:!text-[#1C1C1E] transition-colors cursor-pointer !bg-transparent !border-none !p-0 !m-0 !shadow-none inline-flex items-center justify-center",
                                  uploadIcon: "text-[#1C1C1E]/50 w-7 h-7 mx-auto",
                                }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Title */}
                  <div className="flex flex-col gap-1.5 border-b border-[#1C1C1E]/20 pb-1.5 focus-within:border-[#1C1C1E] transition-colors pt-2">
                    <label htmlFor="title" className="text-[10px] uppercase tracking-[0.2em] text-[#1C1C1E]/60">
                      Title
                    </label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      required
                      placeholder="e.g. A5 Wagyu Trim Offcuts"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-transparent border-none outline-none text-[13px] placeholder:text-[#1C1C1E]/30 text-[#1C1C1E]"
                    />
                  </div>

                  {/* Original Price */}
                  <div className="flex flex-col gap-1.5 border-b border-[#1C1C1E]/20 pb-1.5 focus-within:border-[#1C1C1E] transition-colors">
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
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      className="bg-transparent border-none outline-none text-[13px] placeholder:text-[#1C1C1E]/30 text-[#1C1C1E]"
                    />
                  </div>

                  {/* Surplus Price */}
                  <div className="flex flex-col gap-1.5 border-b border-[#1C1C1E]/20 pb-1.5 focus-within:border-[#1C1C1E] transition-colors">
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
                      value={reservedPrice}
                      onChange={(e) => setReservedPrice(e.target.value)}
                      className="bg-transparent border-none outline-none text-[13px] placeholder:text-[#1C1C1E]/30 text-[#1C1C1E]"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="flex flex-col gap-1.5 border-b border-[#1C1C1E]/20 pb-1.5 focus-within:border-[#1C1C1E] transition-colors">
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
                      value={quantityAvailable}
                      onChange={(e) => setQuantityAvailable(e.target.value)}
                      className="bg-transparent border-none outline-none text-[13px] placeholder:text-[#1C1C1E]/30 text-[#1C1C1E]"
                    />
                  </div>

                  {/* Pickup Time */}
                  <div className="flex flex-col gap-1.5 border-b border-[#1C1C1E]/20 pb-1.5 focus-within:border-[#1C1C1E] transition-colors">
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
                      value={pickupTimeWindow}
                      onChange={(e) => setPickupTimeWindow(e.target.value)}
                      className="bg-transparent border-none outline-none text-[13px] placeholder:text-[#1C1C1E]/30 text-[#1C1C1E]"
                    />
                    <datalist id="pickupTimeOptions">
                      <option value="Anytime" />
                      <option value="Today (Anytime)" />
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
                    className="mt-6 relative flex items-center justify-center px-8 py-4 border border-[#1C1C1E] bg-transparent rounded-[10px] text-[#1C1C1E] hover:bg-[#1C1C1E] hover:text-[#FAF9F6] transition-all duration-300 disabled:opacity-50"
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
