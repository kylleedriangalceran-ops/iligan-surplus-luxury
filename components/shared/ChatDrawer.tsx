"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { getInbox, getUserConversation, sendUserMessage, getChatChannelName } from "@/app/actions/messages";
import { getPusherClient } from "@/lib/pusher-client";
import type { ChatMessage } from "@/lib/repositories/messageRepository";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  // If provided, directly opens conversation with this user
  initialRecipientId?: string | null;
  initialRecipientName?: string | null;
}

export function ChatDrawer({ isOpen, onClose, initialRecipientId, initialRecipientName }: ChatDrawerProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [view, setView] = useState<"INBOX" | "CONVERSATION">(initialRecipientId ? "CONVERSATION" : "INBOX");
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(initialRecipientId || null);
  const [activeRecipientName, setActiveRecipientName] = useState<string | null>(initialRecipientName || null);

  const [inbox, setInbox] = useState<{ userId: string; name: string; lastMessageAt: Date }[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync props to state if it opens with a target
  useEffect(() => {
    if (isOpen && initialRecipientId) {
      setView("CONVERSATION");
      setActiveRecipientId(initialRecipientId);
      setActiveRecipientName(initialRecipientName || "User");
    } else if (isOpen && !initialRecipientId) {
      setView("INBOX");
      setActiveRecipientId(null);
    }
  }, [isOpen, initialRecipientId, initialRecipientName]);

  // Fetch inbox on open (no polling needed — one-shot)
  useEffect(() => {
    if (!isOpen || view !== "INBOX") return;

    const fetchInbox = async () => {
      const data = await getInbox();
      setInbox(data);
    };
    fetchInbox();
  }, [isOpen, view]);

  // Fetch initial messages when conversation opens
  useEffect(() => {
    if (!isOpen || view !== "CONVERSATION" || !activeRecipientId) return;

    const fetchMessages = async () => {
      const data = await getUserConversation(activeRecipientId);
      setMessages(data);
    };
    fetchMessages();
  }, [isOpen, view, activeRecipientId]);

  // ----------------------------------------------------------------
  // Real-time Pusher subscription for the active conversation
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || view !== "CONVERSATION" || !activeRecipientId) return;

    let channelName: string | null = null;

    const subscribe = async () => {
      channelName = await getChatChannelName(activeRecipientId);
      if (!channelName) return;

      const pusher = getPusherClient();
      const channel = pusher.subscribe(channelName);

      channel.bind("new-message", (data: {
        id: string;
        senderId: string;
        receiverId: string;
        content: string;
        createdAt: string;
      }) => {
        const incoming: ChatMessage = {
          id: data.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          content: data.content,
          createdAt: new Date(data.createdAt),
        };

        // Only append if we don't already have this message (avoid duplicates from optimistic updates)
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
      });
    };

    subscribe();

    return () => {
      if (channelName) {
        const pusher = getPusherClient();
        pusher.unsubscribe(channelName);
      }
    };
  }, [isOpen, view, activeRecipientId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (view === "CONVERSATION" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, view]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeRecipientId || isSending) return;

    const text = inputText;
    setInputText("");
    setIsSending(true);

    try {
      // Optimistic append using a temporary fake ID
      const fakeMsg: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        senderId: currentUserId || "",
        receiverId: activeRecipientId,
        content: text,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, fakeMsg]);

      // Execute server action — this saves to Postgres & triggers Pusher
      const savedMsg = await sendUserMessage(activeRecipientId, text);

      // Replace optimistic message with the real one
      if (savedMsg) {
        setMessages((prev) =>
          prev.map((m) => (m.id === fakeMsg.id ? { ...savedMsg } : m))
        );
      }
    } catch (err) {
      console.error(err);
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("optimistic-")));
    } finally {
      setIsSending(false);
    }
  };

  const openConversation = (id: string, name: string) => {
    setActiveRecipientId(id);
    setActiveRecipientName(name);
    setView("CONVERSATION");
  };

  const backToInbox = () => {
    setActiveRecipientId(null);
    setActiveRecipientName(null);
    setMessages([]);
    setView("INBOX");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[#1C1C1E]/20 backdrop-blur-[2px]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-50 w-full sm:w-[400px] h-full bg-[#FAF9F6] shadow-2xl border-l border-[#1C1C1E]/10 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#1C1C1E]/10 shrink-0">
              <div className="flex items-center gap-3">
                {view === "CONVERSATION" && !initialRecipientId && (
                  <button onClick={backToInbox} className="text-[#1C1C1E]/40 hover:text-[#1C1C1E] transition-colors p-1">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6"/>
                    </svg>
                  </button>
                )}
                <div>
                  <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-[#1C1C1E]">
                    {view === "INBOX" ? "Messages" : activeRecipientName}
                  </h2>
                  <p className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/40 mt-0.5">
                    {view === "INBOX" ? "Connect & Coordinate" : (
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        Live Chat
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <button onClick={onClose} className="p-2 text-[#1C1C1E]/40 hover:text-[#1C1C1E] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-white/30">
              {view === "INBOX" ? (
                <div className="flex flex-col">
                  {inbox.length === 0 ? (
                    <div className="p-12 text-center text-xs uppercase tracking-widest text-[#1C1C1E]/40">
                      No active conversations
                    </div>
                  ) : (
                    inbox.map((chat) => (
                      <button
                        key={chat.userId}
                        onClick={() => openConversation(chat.userId, chat.name)}
                        className="w-full text-left p-6 border-b border-[#1C1C1E]/5 hover:bg-white transition-colors group flex justify-between items-center"
                      >
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest text-[#1C1C1E] group-hover:text-[#1C1C1E]/80 transition-colors">
                            {chat.name}
                          </p>
                          <p className="text-[10px] text-[#1C1C1E]/40 mt-1 uppercase tracking-widest">
                            {new Date(chat.lastMessageAt).toLocaleDateString()}
                          </p>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#1C1C1E]/20 group-hover:text-[#1C1C1E] transition-colors" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="p-6 flex flex-col gap-4 min-h-full">
                  {messages.length === 0 ? (
                    <div className="my-auto text-center text-xs uppercase tracking-widest text-[#1C1C1E]/40 font-light">
                      Start the conversation
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === currentUserId;
                      const isOptimistic = typeof msg.id === "string" && msg.id.startsWith("optimistic-");
                      return (
                        <motion.div 
                          key={msg.id} 
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: isOptimistic ? 0.6 : 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={cn("flex flex-col w-full max-w-[85%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}
                        >
                          <div
                            className={cn(
                              "px-4 py-3 text-sm font-light leading-relaxed",
                              isMe 
                                ? "bg-[#1C1C1E] text-[#FAF9F6] rounded-t-xl rounded-bl-xl" 
                                : "bg-white border border-[#1C1C1E]/10 text-[#1C1C1E] rounded-t-xl rounded-br-xl"
                            )}
                          >
                            {msg.content}
                          </div>
                          <span className="text-[9px] uppercase tracking-wider text-[#1C1C1E]/40 mt-1.5 px-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Footer */}
            {view === "CONVERSATION" && (
              <form onSubmit={handleSendMessage} className="p-4 bg-[#FAF9F6] border-t border-[#1C1C1E]/10 shrink-0">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full bg-white border border-[#1C1C1E]/20 rounded-full px-5 py-3 text-sm text-[#1C1C1E] placeholder:text-[#1C1C1E]/30 outline-none transition-colors focus:border-[#1C1C1E]"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="absolute right-2 w-8 h-8 flex items-center justify-center bg-[#1C1C1E] text-[#FAF9F6] rounded-full hover:bg-black disabled:opacity-50 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
