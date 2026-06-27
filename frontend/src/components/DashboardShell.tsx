"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell,
  Users,
  CreditCard,
  Calendar,
  BarChart3,
  LogOut,
  QrCode,
  FileText,
  Apple,
  Activity,
  Menu,
  X,
  Bell,
  Check,
  CheckCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  sentAt: string;
}

const sidebarConfig: Record<string, SidebarItem[]> = {
  ADMIN: [
    { name: "Analytics", href: "/admin", icon: BarChart3 },
    { name: "Members", href: "/admin/members", icon: Users },
    { name: "Trainers", href: "/admin/trainers", icon: Users },
    { name: "Plans", href: "/admin/memberships", icon: Dumbbell },
    { name: "Payments", href: "/admin/payments", icon: CreditCard },
    { name: "Scan Check-In", href: "/admin/scan", icon: QrCode },
    { name: "Reports", href: "/admin/reports", icon: FileText },
  ],
  SUPER_ADMIN: [
    { name: "Analytics", href: "/admin", icon: BarChart3 },
    { name: "Members", href: "/admin/members", icon: Users },
    { name: "Trainers", href: "/admin/trainers", icon: Users },
    { name: "Plans", href: "/admin/memberships", icon: Dumbbell },
    { name: "Payments", href: "/admin/payments", icon: CreditCard },
    { name: "Scan Check-In", href: "/admin/scan", icon: QrCode },
    { name: "Reports", href: "/admin/reports", icon: FileText },
  ],
  TRAINER: [
    { name: "Dashboard", href: "/trainer", icon: BarChart3 },
    { name: "My Members", href: "/trainer/members", icon: Users },
  ],
  MEMBER: [
    { name: "My Profile", href: "/member", icon: Users },
    { name: "Progress Logs", href: "/member/progress", icon: Activity },
    { name: "Workouts", href: "/member/workouts", icon: Dumbbell },
    { name: "Diet Tracker", href: "/member/diet", icon: Apple },
    { name: "Receipts", href: "/member/invoices", icon: CreditCard },
  ],
};

function SidebarContent({
  onClose,
}: {
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user?.role || "MEMBER";
  const navigationItems = sidebarConfig[role] || [];

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-white/5 gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 shadow-[0_0_15px_rgba(124,58,237,0.5)]">
          <Dumbbell className="h-6 w-6 text-white" />
        </div>
        <span className="font-extrabold text-lg tracking-wider">
          <span className="gradient-text">CORE</span>
          <span className="text-cyan-400">FIT</span>
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto text-white/40 hover:text-white transition-colors lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" &&
              item.href !== "/trainer" &&
              item.href !== "/member" &&
              pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
            >
              <motion.div
                whileHover={{
                  x: 4,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-violet-600/30 to-cyan-500/10 border-l-4 border-violet-500 text-white shadow-lg"
                    : "text-white/60 hover:text-white border-l-4 border-transparent"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 ${
                    isActive ? "text-violet-400" : "text-white/40"
                  }`}
                />
                <span className="text-sm font-medium">{item.name}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User info + Logout */}
      <div className="p-4 border-t border-white/5 space-y-3">
        {user && (
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90 truncate">
                {user.name}
              </p>
              <p className="text-xs text-white/40 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 text-white/50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  // Screen size check
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    setIsLargeScreen(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsLargeScreen(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Fetch notifications helper
  const fetchNotifications = async () => {
    try {
      const response = await api.get("/api/notifications/my");
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  // Fetch notifications on mount and set polling interval
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // check every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  // Mark a notification as read
  const handleMarkRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification read:", error);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      await api.put("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all notifications read:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex min-h-screen bg-[#09090b] text-white overflow-hidden relative font-sans">
      {/* Background Glow Accents */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent-purple pointer-events-none opacity-60 z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent-cyan pointer-events-none opacity-40 z-0" />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-white/5 backdrop-blur-md bg-white/[0.02] flex-col fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Navigation Bottom Sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 inset-x-0 max-h-[85vh] bg-[#0c0c0e]/95 border-t border-white/10 rounded-t-3xl z-50 lg:hidden flex flex-col pb-6 shadow-[0_-10px_35px_rgba(0,0,0,0.85)]"
            >
              {/* Handle bar */}
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto my-3" />
              {/* Navigation list */}
              <div className="overflow-y-auto flex-1">
                <SidebarContent onClose={() => setMobileOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notifications Sliding Panel Overlay */}
      <AnimatePresence>
        {notificationsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotificationsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            {/* Slide-out side drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 sm:w-96 bg-[#0f0f13]/95 border-l border-white/10 backdrop-blur-md shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-white">Alerts</h3>
                  <p className="text-xs text-white/40">{unreadCount} unread messages</p>
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck className="h-4 w-4" />
                      Mark all
                    </button>
                  )}
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="p-1 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Notification feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-white/30 text-sm gap-2">
                    <Bell className="h-8 w-8 text-white/10" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
                        notif.isRead
                          ? "bg-white/[0.01] border-white/5 text-white/60"
                          : "bg-gradient-to-r from-violet-950/20 to-cyan-950/10 border-violet-500/20 text-white shadow-md shadow-violet-950/10"
                      }`}
                    >
                      {!notif.isRead && (
                        <div className="absolute top-4 left-3 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                      )}
                      <div className={!notif.isRead ? "pl-3" : ""}>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-semibold ${!notif.isRead ? "text-white" : "text-white/80"}`}>
                            {notif.title}
                          </h4>
                          {!notif.isRead && (
                            <button
                              onClick={() => handleMarkRead(notif.id)}
                              className="text-white/40 hover:text-violet-400 transition-colors p-1 rounded-md hover:bg-white/5"
                              title="Mark read"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs mt-1 leading-relaxed text-white/50">{notif.message}</p>
                        <span className="text-[10px] text-white/30 block mt-2">
                          {new Date(notif.sentAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col relative z-10"
        style={{ paddingLeft: isLargeScreen ? "256px" : "0px" }}
      >
        {/* Unified Glassmorphism Header */}
        <header className="flex items-center justify-between px-4 lg:px-8 h-16 border-b border-white/5 bg-white/[0.01] backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="text-white/60 hover:text-white transition-colors lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <Dumbbell className="h-5 w-5 text-violet-400 animate-pulse" />
              <span className="font-bold text-sm">
                CORE<span className="text-cyan-400">FIT</span>
              </span>
            </div>
            <div className="hidden lg:block">
              <h2 className="text-sm font-semibold tracking-wide text-white/70">
                Welcome back, <span className="gradient-text font-bold">{user?.name || "User"}</span>
              </h2>
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-4">
            {/* Notification Bell Widget */}
            <button
              onClick={() => setNotificationsOpen(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all relative group border border-white/5 shadow-inner"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-gradient-to-r from-violet-600 to-cyan-500 text-[10px] font-extrabold rounded-full flex items-center justify-center border border-[#09090b] text-white shadow-lg shadow-violet-500/20 animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Profile Avatar */}
            {user && (
              <div className="flex items-center gap-2 border-l border-white/10 pl-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-sm font-bold text-white shadow-lg border border-white/10">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

