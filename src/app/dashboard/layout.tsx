import React from "react";
import Link from "next/link";
import { Activity, LayoutDashboard, Users, Settings, GitBranch, Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <div className="bg-primary/10 p-1 rounded">
              <Activity className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight text-slate-900">MediSync</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Operations</div>
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 bg-primary/5 text-primary rounded-md font-medium">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-md font-medium">
            <Users className="h-4 w-4" />
            Patients
          </Link>
          <Link href="/scm" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-md font-medium">
            <GitBranch className="h-4 w-4" />
            SCM & Config
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-md font-medium">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://i.pravatar.cc/150?img=32" />
              <AvatarFallback>DR</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-900">Dr. Sarah Jenkins</span>
              <span className="text-xs text-muted-foreground">Triage Lead</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-xl font-semibold text-slate-900 md:hidden">MediSync</h1>
            <div className="hidden md:flex relative w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search case ID or patient..." 
                className="w-full bg-slate-50 border-slate-200 pl-9 h-9 focus-visible:ring-primary/20"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-semibold text-green-700">LIVE</span>
            </div>
            <button className="relative p-2 text-slate-400 hover:text-slate-500">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            <Avatar className="h-8 w-8 md:hidden">
              <AvatarImage src="https://i.pravatar.cc/150?img=32" />
              <AvatarFallback>DR</AvatarFallback>
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
