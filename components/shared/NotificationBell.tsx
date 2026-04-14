"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { Channel } from "pusher-js";

import { getPusherClient } from "@/lib/pusher-client";
import { useClickOutside } from "@/hooks/useClickOutside";

type Notification = {
  id: string;
  userId: string | null;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

interface NotificationBellProps {
  userId?: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastFetchedRef = useRef(0);

  const fetchNotifications = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchedRef.current < 8000) {
      return;
    }

    setIsFetching(true);
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.unreadCount || 0);
      setNotifications(data.notifications || []);
      lastFetchedRef.current = now;
    } catch {
      // Silently fail
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(true);
    const pusher = getPusherClient();

    const handleNewNotification = (data: Notification) => {
      setNotifications((prev) => {
        if (prev.some(n => n.id === data.id)) return prev;
        return [data, ...prev].slice(0, 30);
      });
      setUnreadCount((prev) => prev + 1);
    };

    // Global channel
    const globalChannel = pusher.subscribe("notifications-global");
    globalChannel.bind("new-notification", handleNewNotification);

    // Private user channel
    let privateChannel: Channel | undefined;
    if (userId) {
      privateChannel = pusher.subscribe(`private-notifications-${userId}`);
      privateChannel.bind("new-notification", handleNewNotification);
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications(true);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      globalChannel.unbind("new-notification", handleNewNotification);
      pusher.unsubscribe("notifications-global");
      if (userId && privateChannel) {
        privateChannel.unbind("new-notification", handleNewNotification);
        pusher.unsubscribe(`private-notifications-${userId}`);
      }
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId, fetchNotifications]);

  useEffect(() => {
    if (!isOpen) return;
    const id = window.setInterval(() => {
      fetchNotifications();
    }, 15000);
    return () => window.clearInterval(id);
  }, [isOpen, fetchNotifications]);

  // Handle click outside
  useClickOutside(dropdownRef, useCallback(() => setIsOpen(false), []));

  const handleToggleDropdown = async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      await fetchNotifications(true);
    }
  };

  const markOneAsRead = async (notificationId: string) => {
    if (isMutating) return;
    setIsMutating(true);

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
        cache: "no-store",
      });
    } finally {
      setIsMutating(false);
      fetchNotifications(true);
    }
  };

  const markAllAsRead = async () => {
    if (isMutating || unreadCount === 0) return;
    setIsMutating(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await fetch("/api/notifications", { method: "POST", cache: "no-store" });
    } finally {
      setIsMutating(false);
      fetchNotifications(true);
    }
  };

  const clearMine = async () => {
    if (isMutating || notifications.length === 0) return;
    setIsMutating(true);
    try {
      await fetch("/api/notifications", { method: "DELETE", cache: "no-store" });
      await fetchNotifications(true);
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggleDropdown}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#1C1C1E]/10 bg-white/70 backdrop-blur-sm hover:border-[#1C1C1E]/25 hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#1C1C1E]/20"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C9.23858 2 7 4.23858 7 7V13C7 14.1046 6.55228 15.1641 5.75736 15.9497L4.34315 17.364C3.78014 17.927 4.17937 18.8893 4.97548 18.8893L19.0245 18.8893C19.8206 18.8893 20.2199 17.927 19.6568 17.364L18.2426 15.9497C17.4477 15.1641 17 14.1046 17 13V7C17 4.23858 14.7614 2 12 2Z" stroke="#1C1C1E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 21C9.64161 21.6111 10.741 22 12 22C13.259 22 14.3584 21.6111 15 21" stroke="#1C1C1E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#D4AF37] border-2 border-[#FAF9F6]"
          />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 mt-4 w-80 max-h-[440px] overflow-y-auto rounded-2xl bg-white/70 backdrop-blur-2xl border border-[#1C1C1E]/10 shadow-[0_24px_54px_rgba(28,28,30,0.12)] z-50 text-left"
          >
            <div className="px-5 py-4 border-b border-[#1C1C1E]/5 flex items-center justify-between sticky top-0 bg-white/50 backdrop-blur-xl z-20">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wider text-[#1C1C1E]">Notifications</span>
                {isFetching && <span className="text-[9px] uppercase tracking-wider text-[#1C1C1E]/40">Syncing</span>}
              </div>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-[#D4AF37]/15 text-[#8C6E2E] px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} New
                </span>
              )}
            </div>

            <div className="px-5 py-3 border-b border-[#1C1C1E]/5 flex items-center gap-4 bg-white/30 backdrop-blur-md">
              <button
                onClick={markAllAsRead}
                disabled={isMutating || unreadCount === 0}
                className="text-[10px] font-medium tracking-wide text-[#1C1C1E]/60 hover:text-[#1C1C1E] disabled:opacity-30 transition-colors"
              >
                Mark all read
              </button>
              <button
                onClick={clearMine}
                disabled={isMutating || notifications.length === 0}
                className="text-[10px] font-medium tracking-wide text-[#1C1C1E]/60 hover:text-[#1C1C1E] disabled:opacity-30 transition-colors"
              >
                Clear mine
              </button>
            </div>

            <div className="flex flex-col">
              {notifications.length === 0 ? (
                <div className="px-5 py-8 text-center text-xs text-[#1C1C1E]/40 uppercase tracking-widest">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className={`p-5 border-b border-[#1C1C1E]/5 transition-colors ${!notif.isRead ? 'bg-[#1C1C1E]/[0.02]' : 'hover:bg-white/40'}`}>
                    <div className="flex gap-4 items-start">
                      <div className="mt-1.5 shrink-0">
                        {notif.type === "NEW_DROP" ? (
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        ) : notif.type === "RESERVATION_CANCELLED" || notif.type === "MERCHANT_REJECTED" ? (
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        ) : notif.type === "MERCHANT_APPROVED" ? (
                          <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                        ) : (
                          <div className="w-1.5 h-1.5 bg-[#1C1C1E]/40 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-[13px] leading-relaxed ${!notif.isRead ? 'font-semibold text-[#1C1C1E]' : 'font-medium text-[#1C1C1E]/80'}`}>
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <p className="text-[10px] text-[#1C1C1E]/40 uppercase tracking-widest font-medium">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </p>
                          {notif.link && (
                            <Link 
                              href={notif.link}
                              onClick={() => setIsOpen(false)} 
                              className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/70 hover:text-[#1C1C1E] transition-colors"
                            >
                              View
                            </Link>
                          )}
                          {!notif.isRead && (
                            <button
                              onClick={() => markOneAsRead(notif.id)}
                              disabled={isMutating}
                              className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/70 hover:text-[#1C1C1E] disabled:opacity-40 transition-colors"
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
