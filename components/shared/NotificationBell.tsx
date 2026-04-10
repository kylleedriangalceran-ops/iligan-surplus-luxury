"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { Channel } from "pusher-js";

import { getPusherClient } from "@/lib/pusher-client";

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        // Silently fail
      }
    };
    
    fetchNotifications();

    const pusher = getPusherClient();
    const handleNewNotification = (data: Notification) => {
      // Avoid duplicate rendering
      setNotifications((prev) => {
        if (prev.some(n => n.id === data.id)) return prev;
        return [data, ...prev];
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

    return () => {
      globalChannel.unbind("new-notification", handleNewNotification);
      pusher.unsubscribe("notifications-global");
      if (userId && privateChannel) {
        privateChannel.unbind("new-notification", handleNewNotification);
        pusher.unsubscribe(`private-notifications-${userId}`);
      }
    };
  }, [userId]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenDropdown = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // Mark as read when opening
      setUnreadCount(0);
      try {
        await fetch("/api/notifications", { method: "POST" });
        // Update local state to show them as read
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } catch (err) {}
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleOpenDropdown}
        className="relative flex items-center justify-center w-9 h-9 rounded-full bg-transparent hover:bg-[#1C1C1E]/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1C1C1E]/20"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C9.23858 2 7 4.23858 7 7V13C7 14.1046 6.55228 15.1641 5.75736 15.9497L4.34315 17.364C3.78014 17.927 4.17937 18.8893 4.97548 18.8893L19.0245 18.8893C19.8206 18.8893 20.2199 17.927 19.6568 17.364L18.2426 15.9497C17.4477 15.1641 17 14.1046 17 13V7C17 4.23858 14.7614 2 12 2Z" stroke="#1C1C1E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 21C9.64161 21.6111 10.741 22 12 22C13.259 22 14.3584 21.6111 15 21" stroke="#1C1C1E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-[#FAF9F6]"
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
            className="absolute right-0 mt-3 w-80 max-h-[400px] overflow-y-auto bg-[#FAF9F6] border border-[#1C1C1E]/10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] z-50 text-left"
          >
            <div className="px-5 py-4 border-b border-[#1C1C1E]/10 flex items-center justify-between sticky top-0 bg-[#FAF9F6]/90 backdrop-blur-sm z-10">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/60">Notifications</span>
              {unreadCount > 0 && <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">{unreadCount} New</span>}
            </div>

            <div className="flex flex-col">
              {notifications.length === 0 ? (
                <div className="px-5 py-8 text-center text-xs text-[#1C1C1E]/40 uppercase tracking-widest">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className={`px-5 py-4 border-b border-[#1C1C1E]/5 transition-colors ${!notif.isRead ? 'bg-[#1C1C1E]/[0.02]' : ''}`}>
                    <div className="flex gap-3">
                      <div className="pt-1">
                        {notif.type === "NEW_DROP" ? (
                          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        ) : notif.type === "RESERVATION_CANCELLED" ? (
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                        ) : (
                          <div className="w-2 h-2 bg-[#1C1C1E]/40 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-snug text-[#1C1C1E]">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-[#1C1C1E]/50 mt-1.5 uppercase tracking-widest">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </p>
                        {notif.link && (
                          <Link 
                            href={notif.link}
                            onClick={() => setIsOpen(false)} 
                            className="inline-block mt-2 text-[10px] uppercase tracking-widest font-semibold border-b border-[#1C1C1E] text-[#1C1C1E] hover:text-[#1C1C1E]/70 transition-colors"
                          >
                            View Details
                          </Link>
                        )}
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
