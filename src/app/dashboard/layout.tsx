"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity, LayoutDashboard, Users, Settings, Bell, Search,
  CheckCircle2, AlertTriangle, AlertCircle, Clock, X, ChevronRight, Check
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NotificationItem {
  id: string;
  type: "critical" | "warning" | "info" | "success";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "critical",
    title: "Critical Priority Triage Alert",
    description: "Robert T. (MS-8492) flagged CRITICAL (Score 85/100) — immediate triage evaluation requested.",
    timestamp: "2 mins ago",
    read: false,
    link: "/dashboard",
  },
  {
    id: "notif-2",
    type: "warning",
    title: "High Priority Intake Arrived",
    description: "David K. (MS-7741) flagged HIGH (Score 70/100) with acute abdominal pain.",
    timestamp: "12 mins ago",
    read: false,
    link: "/dashboard",
  },
  {
    id: "notif-3",
    type: "info",
    title: "Case Review Started",
    description: "Dr. Murthy began reviewing Emma W. (MS-3102).",
    timestamp: "18 mins ago",
    read: true,
    link: "/dashboard",
  },
  {
    id: "notif-4",
    type: "success",
    title: "SQLite Database Online",
    description: "Connected to local SQLite persistence (WAL mode). Real-time queue synchronized.",
    timestamp: "30 mins ago",
    read: true,
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close notifications dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markItemAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/patients?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      label: "Patients",
      href: "/dashboard/patients",
      icon: Users,
      active: pathname.startsWith("/dashboard/patients"),
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      active: pathname.startsWith("/dashboard/settings"),
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold tracking-tight text-slate-900 text-lg">MediSync</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
            Operations
          </div>

          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${item.active ? "text-primary" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Doctor Profile Footer */}
        <div className="p-4 border-t bg-slate-50/50">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-primary/20">
              <AvatarImage src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80" />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">NM</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-slate-900 truncate">Dr. Narayan Murthy</span>
              <span className="text-xs text-muted-foreground">Triage Lead · Trauma</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4 flex-1">
            <Link href="/" className="flex items-center gap-2 md:hidden">
              <div className="bg-primary/10 p-1 rounded">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold text-slate-900">MediSync</span>
            </Link>

            {/* Functional Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex relative w-96">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search case ID, patient, or condition..."
                className="w-full bg-slate-50 border-slate-200 pl-9 h-9 text-sm focus-visible:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Status indicator */}
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-700">LIVE QUEUE</span>
            </div>

            {/* Notification Bell with interactive popover */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
                aria-label="View notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 ring-2 ring-white"></span>
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
                  <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">Clinical Alerts</span>
                      {unreadCount > 0 && (
                        <Badge className="bg-red-500 text-white hover:bg-red-500 text-xs px-1.5 py-0">
                          {unreadCount} new
                        </Badge>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        No notifications.
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            markItemAsRead(item.id);
                            if (item.link) {
                              router.push(item.link);
                              setIsNotifOpen(false);
                            }
                          }}
                          className={`p-4 transition-colors hover:bg-slate-50 cursor-pointer flex gap-3 text-left ${
                            !item.read ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className="shrink-0 mt-0.5">
                            {item.type === "critical" && (
                              <div className="h-7 w-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                                <AlertCircle className="h-4 w-4" />
                              </div>
                            )}
                            {item.type === "warning" && (
                              <div className="h-7 w-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                                <AlertTriangle className="h-4 w-4" />
                              </div>
                            )}
                            {item.type === "info" && (
                              <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                <Activity className="h-4 w-4" />
                              </div>
                            )}
                            {item.type === "success" && (
                              <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <p className={`text-xs font-semibold truncate ${!item.read ? "text-slate-900" : "text-slate-700"}`}>
                                {item.title}
                              </p>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {item.timestamp}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-50 border-t text-center">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsNotifOpen(false)}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      View Live Triage Queue &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Avatar */}
            <Avatar className="h-8 w-8 md:hidden border">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">NM</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
