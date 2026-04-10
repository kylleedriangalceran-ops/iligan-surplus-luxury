"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ChatDrawer } from "./ChatDrawer";

// Custom event to remotely open chat from anywhere
export const openChatWith = (id: string, name: string) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("open-chat", { detail: { id, name } })
    );
  }
};

export function FloatingChatWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [targetName, setTargetName] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent;
      setTargetId(customEvent.detail.id);
      setTargetName(customEvent.detail.name);
      setIsOpen(true);
    };

    window.addEventListener("open-chat", handleOpenChat);
    return () => window.removeEventListener("open-chat", handleOpenChat);
  }, []);

  // Only render if logged in
  if (!session?.user) return null;

  return (
    <>
      <button
        onClick={() => {
          setTargetId(null);
          setTargetName(null);
          setIsOpen(true);
        }}
        className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-[#1C1C1E] text-[#FAF9F6] rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      <ChatDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialRecipientId={targetId}
        initialRecipientName={targetName}
      />
    </>
  );
}
