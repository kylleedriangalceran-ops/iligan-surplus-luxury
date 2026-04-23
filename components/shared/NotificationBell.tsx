"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import type { Channel } from "pusher-js";

import { getPusherClient } from "@/lib/pusher-client";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  userId: string | null;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

type SocialFollower = {
  userId: string;
  name: string;
  email: string;
  followedAt: string;
};

type SocialFollowing = {
  storeId: string;
  storeName: string;
  merchantUserId: string;
  merchantName: string;
  followedAt: string;
};

type Tab = "all" | "social";

interface NotificationBellProps {
  userId?: string;
  userRole?: "MERCHANT" | "CUSTOMER" | "ADMIN";
}

/* ─── Helpers ─── */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Generate a deterministic pastel hue from a string
function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 60%)`;
}

function Avatar({ name, size = 42 }: { name: string; size?: number }) {
  const bg = getAvatarColor(name);
  return (
    <div
      className="rounded-full shrink-0 flex items-center justify-center font-semibold text-white"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.36 }}
    >
      {getInitials(name)}
    </div>
  );
}

function parseNotificationActor(message: string): { actor: string; rest: string } {
  // Try to extract "@username" or leading bold-name patterns
  const atMatch = message.match(/^(@\S+)([\s\S]*)/);
  if (atMatch) return { actor: atMatch[1], rest: atMatch[2].trim() };
  // Try "StoreName followed" style
  const wordMatch = message.match(/^(\S+(?:\s+\S+)?)(.*)/m);
  if (wordMatch) return { actor: wordMatch[1], rest: wordMatch[2].trim() };
  return { actor: "", rest: message };
}

export function NotificationBell({ userId, userRole }: NotificationBellProps) {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  // Social tab data
  const [socialItems, setSocialItems] = useState<(SocialFollower | SocialFollowing)[]>([]);
  const [socialRole, setSocialRole] = useState<"MERCHANT" | "CUSTOMER" | null>(null);
  const [isFetchingSocial, setIsFetchingSocial] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastFetchedRef = useRef(0);
  const lastSocialFetchRef = useRef(0);

  /* ─── Fetch notifications ─── */
  const fetchNotifications = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchedRef.current < 8000) return;
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

  /* ─── Fetch social (followers / followings) ─── */
  const fetchSocial = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastSocialFetchRef.current < 15000) return;
    setIsFetchingSocial(true);
    try {
      const res = await fetch("/api/notifications/social", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setSocialItems(data.items || []);
      setSocialRole(data.role || null);
      lastSocialFetchRef.current = now;
    } catch {
      // Silently fail
    } finally {
      setIsFetchingSocial(false);
    }
  }, []);

  /* ─── Pusher real-time setup ─── */
  useEffect(() => {
    fetchNotifications(true);

    const pusher = getPusherClient();

    const handleNewNotification = (data: NotificationItem) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === data.id)) return prev;
        return [data, ...prev].slice(0, 30);
      });
      setUnreadCount((prev) => prev + 1);
    };

    const globalChannel = pusher.subscribe("notifications-global");
    globalChannel.bind("new-notification", handleNewNotification);

    let privateChannel: Channel | undefined;
    if (userId) {
      privateChannel = pusher.subscribe(`private-notifications-${userId}`);
      privateChannel.bind("new-notification", handleNewNotification);
    }

    // Refetch on tab visibility
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

  // Poll while open
  useEffect(() => {
    if (!isOpen) return;
    const id = window.setInterval(() => fetchNotifications(), 15000);
    return () => window.clearInterval(id);
  }, [isOpen, fetchNotifications]);

  // Fetch social when switching to social tab
  useEffect(() => {
    if (isOpen && activeTab === "social") {
      fetchSocial(true);
    }
  }, [isOpen, activeTab, fetchSocial]);

  useClickOutside(dropdownRef, useCallback(() => setIsOpen(false), []));

  /* ─── Actions ─── */
  const handleToggleDropdown = async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      await fetchNotifications(true);
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

  const clearOne = async (notificationId: string) => {
    if (isMutating) return;
    setIsMutating(true);
    const target = notifications.find((n) => n.id === notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    if (target && !target.isRead) setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await fetch(`/api/notifications?id=${notificationId}`, { method: "DELETE", cache: "no-store" });
    } finally {
      setIsMutating(false);
      fetchNotifications(true);
    }
  };

  /* ─── Derived ─── */
  const socialLabel = socialRole === "MERCHANT" ? "Followers" : "Followings";
  const socialCount = socialItems.length;
  const totalCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={handleToggleDropdown}
        className={cn(
          "relative flex h-10 w-10 md:h-9 md:w-9 items-center justify-center rounded-full border bg-white/80 backdrop-blur-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 shadow-sm",
          unreadCount > 0 
            ? "border-[#D4AF37]/30 hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5" 
            : "border-[#1C1C1E]/10 hover:border-[#1C1C1E]/25 hover:bg-white"
        )}
        aria-label="Notifications"
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill={unreadCount > 0 ? "#D4AF37" : "none"} 
          className="md:w-[18px] md:h-[18px] transition-colors duration-300"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2C9.23858 2 7 4.23858 7 7V13C7 14.1046 6.55228 15.1641 5.75736 15.9497L4.34315 17.364C3.78014 17.927 4.17937 18.8893 4.97548 18.8893L19.0245 18.8893C19.8206 18.8893 20.2199 17.927 19.6568 17.364L18.2426 15.9497C17.4477 15.1641 17 14.1046 17 13V7C17 4.23858 14.7614 2 12 2Z" stroke={unreadCount > 0 ? "#D4AF37" : "#1C1C1E"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 21C9.64161 21.6111 10.741 22 12 22C13.259 22 14.3584 21.6111 15 21" stroke={unreadCount > 0 ? "#D4AF37" : "#1C1C1E"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="absolute -right-1 -top-1 md:-right-0.5 md:-top-0.5 flex h-5 min-w-[20px] md:h-[18px] md:min-w-[18px] items-center justify-center rounded-full bg-[#1C1C1E] border-2 border-white px-1 shadow-md"
          >
            <span className="text-[10px] md:text-[9px] font-bold text-[#D4AF37] leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </motion.div>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-[72px] left-[16px] right-[16px] w-auto sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-3 sm:w-[380px] flex flex-col rounded-2xl bg-white border border-gray-100 shadow-[0_8px_40px_rgba(0,0,0,0.12),0_4px_12px_rgba(212,175,55,0.05)] z-9999 overflow-hidden origin-top sm:origin-top-right"
            style={{ maxHeight: "min(600px, 85dvh)" }}
          >
            {/* ── Header ── */}
            <div className="px-5 pt-5 pb-3 flex items-start justify-between shrink-0">
              <h3 className="text-[17px] sm:text-[19px] font-bold text-gray-900 tracking-tight leading-none mt-0.5">
                Notifications
              </h3>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); markAllAsRead(); }}
                disabled={isMutating || unreadCount === 0}
                className="flex items-center gap-1 text-[11px] sm:text-[12px] font-bold text-[#D4AF37] hover:text-[#B6952F] disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {/* Double-check icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12l5 5L18 5" />
                  <path d="M8 12l5 5 7-10" />
                </svg>
                Mark all as read
              </button>
            </div>

            {/* ── Tabs ── */}
            <div className="px-5 pb-3 shrink-0">
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                <TabButton
                  active={activeTab === "all"}
                  onClick={() => setActiveTab("all")}
                  label="View all"
                  count={totalCount}
                  loading={isFetching}
                />
                {userRole !== "ADMIN" && (
                  <TabButton
                    active={activeTab === "social"}
                    onClick={() => setActiveTab("social")}
                    label={socialRole ? socialLabel : (userRole === "MERCHANT" ? "Followers" : "Followings")}
                    count={socialCount}
                    loading={isFetchingSocial}
                  />
                )}
              </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <AnimatePresence mode="wait" initial={false}>
                {activeTab === "all" ? (
                  <motion.div
                    key="all"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {notifications.length === 0 ? (
                      <EmptyState
                        icon={
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                            <path d="M12 2C9.23858 2 7 4.23858 7 7V13C7 14.1046 6.55228 15.1641 5.75736 15.9497L4.34315 17.364C3.78014 17.927 4.17937 18.8893 4.97548 18.8893L19.0245 18.8893C19.8206 18.8893 20.2199 17.927 19.6568 17.364L18.2426 15.9497C17.4477 15.1641 17 14.1046 17 13V7C17 4.23858 14.7614 2 12 2Z" />
                            <path d="M9 21C9.64161 21.6111 10.741 22 12 22C13.259 22 14.3584 21.6111 15 21" />
                          </svg>
                        }
                        title="You're all caught up"
                        subtitle="No notifications yet"
                      />
                    ) : (
                      notifications.map((notif) => (
                        <NotifRow
                          key={notif.id}
                          notif={notif}
                          onMarkRead={() => markOneAsRead(notif.id)}
                          onDismiss={() => clearOne(notif.id)}
                          isMutating={isMutating}
                        />
                      ))
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="social"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {isFetchingSocial ? (
                      <SocialSkeletons />
                    ) : socialItems.length === 0 ? (
                      <EmptyState
                        icon={
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                        }
                        title={socialRole === "MERCHANT" ? "No followers yet" : "Not following anyone yet"}
                        subtitle={socialRole === "MERCHANT" ? "Customers who follow your store will appear here" : "Stores you follow will appear here"}
                      />
                    ) : (
                      socialItems.map((item, i) => (
                        <SocialRow key={i} item={item} role={socialRole} />
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────
   Sub-components
───────────────────────────────────────── */

function TabButton({
  active,
  onClick,
  label,
  count,
  loading,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
        active
          ? "bg-white text-[#1C1C1E] shadow-sm"
          : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {label}
      {loading ? (
        <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : count > 0 ? (
        <span
          className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center tabular-nums leading-none ${
            active ? "bg-[#1C1C1E]/10 text-[#1C1C1E]" : "bg-gray-200 text-gray-600"
          }`}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

function NotifRow({
  notif,
  onMarkRead,
  onDismiss,
  isMutating,
}: {
  notif: NotificationItem;
  onMarkRead: () => void;
  onDismiss: () => void;
  isMutating: boolean;
}) {
  const { actor, rest } = parseNotificationActor(notif.message);
  const actorDisplay = actor || "System";
  const createdAt = new Date(notif.createdAt);

  // Format: "Thursday 4:20pm" style
  const dayTime = format(createdAt, "EEEE h:mmaaa").replace("am", "am").replace("pm", "pm");
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

  return (
    <div
      className={`group relative flex gap-4 px-6 py-4 border-b border-gray-100 last:border-b-0 transition-colors cursor-default ${
        !notif.isRead ? "bg-gray-50/80 hover:bg-gray-50" : "hover:bg-gray-50/50"
      }`}
      onClick={() => !notif.isRead && onMarkRead()}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar name={actorDisplay} size={44} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] leading-snug text-gray-800">
          <span className="font-bold text-gray-900">{actor}</span>
          {actor && " "}
          {rest || notif.message}
        </p>
        <div className="flex items-center justify-between mt-1.5 gap-2">
          <span className="text-[12px] text-gray-400">{dayTime}</span>
          <span className="text-[12px] text-gray-400 shrink-0">{timeAgo}</span>
        </div>
      </div>

      {/* Unread dot + dismiss */}
      <div className="shrink-0 flex flex-col items-center gap-2 pt-1">
        {!notif.isRead ? (
          <div className="w-2.5 h-2.5 rounded-full bg-[#1C1C1E]" />
        ) : (
          <div className="w-2.5 h-2.5" />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          disabled={isMutating}
          className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
          aria-label="Dismiss"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function SocialRow({
  item,
  role,
}: {
  item: SocialFollower | SocialFollowing;
  role: "MERCHANT" | "CUSTOMER" | null;
}) {
  const isMerchantView = role === "MERCHANT";
  const name = isMerchantView
    ? (item as SocialFollower).name
    : (item as SocialFollowing).storeName;
  const subLabel = isMerchantView
    ? (item as SocialFollower).email
    : `by ${(item as SocialFollowing).merchantName}`;
  const followedAt = new Date(isMerchantView
    ? (item as SocialFollower).followedAt
    : (item as SocialFollowing).followedAt);

  const timeAgo = formatDistanceToNow(followedAt, { addSuffix: true });
  const action = isMerchantView ? "followed your store" : "you are following";

  return (
    <div className="group flex gap-4 px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
      <div className="relative shrink-0">
        <Avatar name={name} size={44} />
        {/* Follow icon badge */}
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#1C1C1E] flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8v6M22 11h-6" />
          </svg>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] leading-snug text-gray-800">
          <span className="font-bold text-gray-900">{name}</span>{" "}
          <span className="text-gray-500">{action}</span>
        </p>
        <p className="text-[12px] text-gray-400 mt-0.5">{subLabel}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[12px] text-gray-400">{format(followedAt, "EEEE h:mmaaa")}</span>
          <span className="text-[12px] text-gray-400">{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="mb-3">{icon}</div>
      <p className="text-[14px] font-semibold text-gray-400">{title}</p>
      <p className="text-[12px] text-gray-300 mt-1">{subtitle}</p>
    </div>
  );
}

function SocialSkeletons() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 px-6 py-4 border-b border-gray-100">
          <div className="w-11 h-11 rounded-full bg-gray-100 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-gray-100 rounded-lg animate-pulse w-3/4" />
            <div className="h-3 bg-gray-100 rounded-lg animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </>
  );
}
