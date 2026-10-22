"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  GitBranch, GitCommit, RefreshCw, Upload, Download, Plus, CheckCircle2,
  AlertTriangle, FileCode2, Terminal, Eye, X, Copy, Check, ShieldCheck,
  FolderGit2, Clock, Play, Trash2, Lock, Mail, KeyRound, LogOut, ShieldAlert, EyeOff,
  RotateCcw, ArrowDown, ArrowUp, ExternalLink, Globe, Sparkles, Navigation, GitMerge, Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ScmInfo {
  version: string;
  commit: string;
  fullCommit: string;
  bookmark: string;
  repoRoot: string;
  isInitialized: boolean;
}

interface ScmFile {
  status: string;
  type: "modified" | "added" | "untracked" | "missing" | "unknown";
  file: string;
}

interface ScmCounts {
  modified: number;
  added: number;
  untracked: number;
  missing: number;
  total: number;
}

interface ScmCommit {
  hash: string;
  author: string;
  age: string;
  message: string;
}

interface SlWebSession {
  url: string;
  port: number;
  token: string;
  pid: number;
  cwd: string;
}

async function safeFetchJson(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Server returned (${res.status}): ${text.slice(0, 150)}`);
  }
}

export default function SourceControlPage() {
  const [activeTab, setActiveTab] = useState<"changes" | "history" | "console" | "isl">("changes");
  const [info, setInfo] = useState<ScmInfo | null>(null);
  const [files, setFiles] = useState<ScmFile[]>([]);
  const [counts, setCounts] = useState<ScmCounts>({ modified: 0, added: 0, untracked: 0, missing: 0, total: 0 });
  const [commits, setCommits] = useState<ScmCommit[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState<"pull" | "push" | null>(null);
  const [commitMessage, setCommitMessage] = useState("");
  const [stageAllUntracked, setStageAllUntracked] = useState(true);

  // Status banner
  const [banner, setBanner] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Diff inspection modal
  const [activeDiffFile, setActiveDiffFile] = useState<string | null>(null);
  const [diffContent, setDiffContent] = useState<string>("");
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);

  // Console execution
  const [consoleCommand, setConsoleCommand] = useState("status");
  const [consoleOutput, setConsoleOutput] = useState<string>("");
  const [isExecutingCmd, setIsExecutingCmd] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Sapling Unique Feature: Undo Time Machine
  const [isUndoModalOpen, setIsUndoModalOpen] = useState(false);
  const [undoPreviewText, setUndoPreviewText] = useState("");
  const [isLoadingUndoPreview, setIsLoadingUndoPreview] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);

  // Sapling Unique Feature: Amend
  const [isAmendMode, setIsAmendMode] = useState(false);
  const [isAmending, setIsAmending] = useState(false);

  // Sapling Unique Feature: Stack Navigation (prev/next/goto) & Visual Tree
  const [isNavigating, setIsNavigating] = useState<string | null>(null);
  const [showAsciiTree, setShowAsciiTree] = useState(false);
  const [asciiTree, setAsciiTree] = useState<string>("");

  // Sapling Unique Feature: Meta Interactive Smartlog GUI (sl web)
  const [islRunning, setIslRunning] = useState(false);
  const [islSession, setIslSession] = useState<SlWebSession | null>(null);
  const [isLoadingIsl, setIsLoadingIsl] = useState(false);
  const [islPort] = useState(3011);

  // Admin Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name?: string; email: string; role: string } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState("neeraj@medisync.health");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Check persistent admin session on mount
  useEffect(() => {
    setIsMounted(true);
    const authSaved = localStorage.getItem("medisync_admin_auth") === "true";
    if (authSaved) {
      setIsAdminLoggedIn(true);
      try {
        const u = localStorage.getItem("medisync_admin_user");
        if (u) setAdminUser(JSON.parse(u));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const showBanner = (type: "success" | "error" | "info", message: string) => {
    setBanner({ type, message });
    setTimeout(() => {
      setBanner((prev) => (prev?.message === message ? null : prev));
    }, 6000);
  };

  const fetchScmData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch info
      const infoJson = await safeFetchJson("/api/scm/info");
      if (infoJson.success) setInfo(infoJson.data);

      // 2. Fetch status
      const statusJson = await safeFetchJson("/api/scm/status");
      if (statusJson.success) {
        setFiles(statusJson.data.files || []);
        setCounts(statusJson.data.counts || { modified: 0, added: 0, untracked: 0, missing: 0, total: 0 });
      }

      // 3. Fetch smartlog & commit stack
      const smartlogJson = await safeFetchJson("/api/scm/smartlog");
      if (smartlogJson.success) {
        setAsciiTree(smartlogJson.data.tree || "");
        if (smartlogJson.data.commits && smartlogJson.data.commits.length > 0) {
          setCommits(smartlogJson.data.commits);
        }
      } else {
        const logJson = await safeFetchJson("/api/scm/log?limit=20");
        if (logJson.success) {
          setCommits(logJson.data.commits || []);
        }
      }
    } catch (err: any) {
      showBanner("error", "Failed to connect to Sapling SCM backend: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check ISL Server Status
  const checkIslStatus = useCallback(async () => {
    try {
      const data = await safeFetchJson("/api/scm/web/status");
      if (data.success && data.running && data.session) {
        setIslRunning(true);
        setIslSession(data.session);
      } else {
        setIslRunning(false);
        setIslSession(null);
      }
    } catch {
      setIslRunning(false);
    }
  }, []);

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchScmData();
      checkIslStatus();
    }
  }, [isAdminLoggedIn, fetchScmData, checkIslStatus]);

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Please enter both email and password.");
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const data = await safeFetchJson("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });

      if (data.success) {
        setIsAdminLoggedIn(true);
        const adminData = data.admin || { email: loginEmail.trim(), role: "System Administrator" };
        setAdminUser(adminData);
        localStorage.setItem("medisync_admin_auth", "true");
        localStorage.setItem("medisync_admin_user", JSON.stringify(adminData));
        showBanner("success", "Welcome, Administrator! Sapling SCM console unlocked.");
      } else {
        setLoginError(data.error || "Authentication failed. Access denied.");
      }
    } catch (err: any) {
      setLoginError(err.message || "Unable to contact authentication server.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Admin Logout
  const handleAdminLogout = () => {
    localStorage.removeItem("medisync_admin_auth");
    localStorage.removeItem("medisync_admin_user");
    setIsAdminLoggedIn(false);
    setAdminUser(null);
    setLoginPassword("");
    showBanner("info", "Logged out of Administrator Portal.");
  };

  // Handle Commit or Amend
  const handleCommitOrAmend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAmendMode) {
      setIsAmending(true);
      try {
        const data = await safeFetchJson("/api/scm/amend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: commitMessage.trim() || undefined,
            addAll: stageAllUntracked,
          }),
        });
        if (data.success) {
          showBanner("success", data.message || "Amended changes into current commit.");
          setCommitMessage("");
          setIsAmendMode(false);
          fetchScmData();
        } else {
          showBanner("error", data.error || "Amend failed.");
        }
      } catch (err: any) {
        showBanner("error", "Error during amend: " + err.message);
      } finally {
        setIsAmending(false);
      }
      return;
    }

    if (!commitMessage.trim()) return;

    setIsCommitting(true);
    try {
      const data = await safeFetchJson("/api/scm/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: commitMessage.trim(),
          addAll: stageAllUntracked,
        }),
      });
      if (data.success) {
        showBanner("success", `Committed: "${commitMessage.trim()}"`);
        setCommitMessage("");
        fetchScmData();
      } else {
        showBanner("error", data.error || "Commit failed");
      }
    } catch (err: any) {
      showBanner("error", "Error during commit: " + err.message);
    } finally {
      setIsCommitting(false);
    }
  };

  // Open Undo Modal & Fetch Preview
  const handleOpenUndoModal = async () => {
    setIsUndoModalOpen(true);
    setIsLoadingUndoPreview(true);
    try {
      const data = await safeFetchJson("/api/scm/undo/preview");
      if (data.success) {
        setUndoPreviewText(data.data.preview || "No previous action to undo.");
      } else {
        setUndoPreviewText("Error loading preview: " + data.error);
      }
    } catch (err: any) {
      setUndoPreviewText("Failed to contact undo engine: " + err.message);
    } finally {
      setIsLoadingUndoPreview(false);
    }
  };

  // Execute Undo
  const handleExecuteUndo = async (keepChanges: boolean) => {
    setIsUndoing(true);
    try {
      const data = await safeFetchJson("/api/scm/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keep: keepChanges }),
      });
      if (data.success) {
        showBanner("success", data.message || "Sapling undo completed successfully!");
        setIsUndoModalOpen(false);
        fetchScmData();
      } else {
        showBanner("error", data.error || "Undo failed.");
      }
    } catch (err: any) {
      showBanner("error", "Error executing undo: " + err.message);
    } finally {
      setIsUndoing(false);
    }
  };

  // Handle Stack Navigation (prev, next, goto)
  const handleNavigateStack = async (action: "prev" | "next" | "goto", target?: string) => {
    setIsNavigating(target || action);
    try {
      const data = await safeFetchJson("/api/scm/nav", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, target }),
      });
      if (data.success) {
        showBanner("success", data.message || `Switched to ${action}`);
        fetchScmData();
      } else {
        showBanner("error", data.error || `Navigation ${action} failed.`);
      }
    } catch (err: any) {
      showBanner("error", "Navigation error: " + err.message);
    } finally {
      setIsNavigating(null);
    }
  };

  // Start ISL Server
  const handleStartIsl = async () => {
    setIsLoadingIsl(true);
    try {
      const data = await safeFetchJson("/api/scm/web/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ port: islPort }),
      });
      if (data.success && data.session) {
        setIslRunning(true);
        setIslSession(data.session);
        showBanner("success", `Interactive Smartlog Web GUI started on port ${data.session.port}!`);
      } else {
        showBanner("error", data.error || "Failed to launch ISL Web GUI.");
      }
    } catch (err: any) {
      showBanner("error", "Error starting ISL: " + err.message);
    } finally {
      setIsLoadingIsl(false);
    }
  };

  // Stop ISL Server
  const handleStopIsl = async () => {
    setIsLoadingIsl(true);
    try {
      const data = await safeFetchJson("/api/scm/web/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ port: islSession?.port || islPort }),
      });
      if (data.success) {
        setIslRunning(false);
        setIslSession(null);
        showBanner("info", "Interactive Smartlog Web server stopped.");
      } else {
        showBanner("error", data.error || "Failed to stop ISL.");
      }
    } catch (err: any) {
      showBanner("error", "Error stopping ISL: " + err.message);
    } finally {
      setIsLoadingIsl(false);
    }
  };

  // Handle Stage All
  const handleStageAll = async () => {
    try {
      const data = await safeFetchJson("/api/scm/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (data.success) {
        showBanner("success", "Added untracked files to tracking.");
        fetchScmData();
      } else {
        showBanner("error", data.error || "Failed to stage files.");
      }
    } catch (err: any) {
      showBanner("error", err.message);
    }
  };

  // Handle Remove Missing (sl remove --mark)
  const handleRemoveMissing = async () => {
    try {
      const data = await safeFetchJson("/api/scm/remove-missing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (data.success) {
        showBanner("success", "Marked missing files as deleted in Sapling repository.");
        fetchScmData();
      } else {
        showBanner("error", data.error || "Failed to remove missing files.");
      }
    } catch (err: any) {
      showBanner("error", err.message);
    }
  };

  // Handle Pull / Push
  const handleSync = async (action: "pull" | "push") => {
    setIsSyncing(action);
    try {
      const data = await safeFetchJson("/api/scm/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (data.success) {
        showBanner("success", data.output || `Sapling ${action} successful.`);
        fetchScmData();
      } else {
        showBanner("error", data.error || `Failed to ${action} changes.`);
      }
    } catch (err: any) {
      showBanner("error", err.message);
    } finally {
      setIsSyncing(null);
    }
  };

  // View Diff
  const handleViewDiff = async (filePath?: string) => {
    setActiveDiffFile(filePath || "All Working Copy");
    setIsLoadingDiff(true);
    try {
      const url = filePath ? `/api/scm/diff?file=${encodeURIComponent(filePath)}` : "/api/scm/diff";
      const data = await safeFetchJson(url);
      if (data.success) {
        setDiffContent(data.data.diff || "No changes or file is untracked.");
      } else {
        setDiffContent("Error loading diff: " + data.error);
      }
    } catch (err: any) {
      setDiffContent("Failed to load diff: " + err.message);
    } finally {
      setIsLoadingDiff(false);
    }
  };

  // Execute Console Command
  const handleExecuteCommand = async (cmdToRun?: string) => {
    const cmd = (cmdToRun || consoleCommand).trim();
    if (!cmd) return;

    setIsExecutingCmd(true);
    try {
      const data = await safeFetchJson("/api/scm/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });
      let outputText = "";
      if (data.stdout) outputText += data.stdout;
      if (data.stderr) outputText += (outputText ? "\n" : "") + data.stderr;
      if (!outputText) outputText = `(Command 'sl ${cmd}' completed with exit code ${data.exitCode})`;
      setConsoleOutput(outputText);
    } catch (err: any) {
      setConsoleOutput("Execution error: " + err.message);
    } finally {
      setIsExecutingCmd(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Filtering files
  const filteredFiles = files.filter((f) => {
    if (filterType !== "all" && f.type !== filterType) return false;
    if (searchFilter.trim() && !f.file.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (!isMounted) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs font-mono">
        Verifying administrator session...
      </div>
    );
  }

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="w-full max-w-md space-y-4">
          <Card className="border shadow-lg bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-primary/90 to-slate-900 p-6 text-white text-center relative">
              <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">MediSync Admin Portal</h2>
              <p className="text-xs text-white/80 mt-1">
                Authenticate with Administrator credentials to unlock the Sapling SCM management tool.
              </p>
            </div>

            <CardContent className="p-6 space-y-4">
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-800 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="email"
                      required
                      placeholder="admin@medisync.health"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-9 h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Admin Password
                    </label>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-9 pr-9 h-10 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full h-10 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShieldCheck className={`h-4 w-4 ${isLoggingIn ? "animate-spin" : ""}`} />
                  {isLoggingIn ? "Verifying Credentials..." : "Unlock Sapling SCM Console"}
                </Button>
              </form>

              {/* Authorized Administrators Credentials Helper */}
              <div className="pt-2 border-t space-y-2">
                <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                  Authorized Administrators:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {/* Neeraj */}
                  <div className="p-2.5 bg-slate-50 border rounded-lg space-y-1 hover:border-primary/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Neeraj Maurya</span>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginEmail("neeraj@medisync.health");
                          setLoginPassword("neeraj123");
                        }}
                        className="text-[10px] text-primary hover:underline font-bold"
                      >
                        Auto-fill
                      </button>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">
                      <p>neeraj@medisync.health</p>
                      <p>Pass: neeraj123</p>
                    </div>
                  </div>

                  {/* Ansh */}
                  <div className="p-2.5 bg-slate-50 border rounded-lg space-y-1 hover:border-primary/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Ansh Dubey</span>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginEmail("ansh@medisync.health");
                          setLoginPassword("ansh123");
                        }}
                        className="text-[10px] text-primary hover:underline font-bold"
                      >
                        Auto-fill
                      </button>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">
                      <p>ansh@medisync.health</p>
                      <p>Pass: ansh123</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-300">
      {/* Admin Verified Session Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-4 py-2.5 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold flex items-center gap-1.5 text-slate-100">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            ADMINISTRATOR PRIVILEGES ACTIVE
          </span>
          <span className="text-slate-500 hidden md:inline">|</span>
          <span className="text-slate-200 font-semibold hidden md:inline">
            {adminUser?.name || "Administrator"}
          </span>
          <span className="text-slate-400 font-mono text-[11px] hidden md:inline">
            ({adminUser?.email || "admin@medisync.health"})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-[10px] bg-white/10 text-emerald-300 border-emerald-500/30">
            {adminUser?.role || "Administrator"}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAdminLogout}
            className="h-7 px-2.5 text-xs text-red-300 hover:text-red-200 hover:bg-red-950/40"
          >
            <LogOut className="h-3.5 w-3.5 mr-1" />
            Lock & Logout
          </Button>
        </div>
      </div>

      {/* Top Banner / Notification */}
      {banner && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-sm font-medium transition-all ${
            banner.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : banner.type === "error"
              ? "bg-red-50 text-red-900 border-red-200"
              : "bg-blue-50 text-blue-900 border-blue-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            {banner.type === "error" && <AlertTriangle className="h-5 w-5 text-red-600" />}
            {banner.type === "info" && <ShieldCheck className="h-5 w-5 text-blue-600" />}
            <span>{banner.message}</span>
          </div>
          <button onClick={() => setBanner(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <FolderGit2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Console: Sapling Source Control</h1>
                <Badge variant="outline" className="bg-slate-100 text-slate-700 font-mono text-[11px]">
                  {info?.version ? info.version.replace("Sapling ", "v") : "sl"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {info?.repoRoot || "Loading repository path..."}
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenUndoModal}
            className="text-xs border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 hover:text-amber-900 font-medium"
            title="Undo last local command (sl undo)"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-amber-700" />
            Undo Action (<code className="font-mono text-[10px]">sl undo</code>)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSync("pull")}
            disabled={isSyncing !== null || isLoading}
            className="text-xs"
          >
            <Download className={`h-3.5 w-3.5 mr-1.5 ${isSyncing === "pull" ? "animate-bounce" : ""}`} />
            {isSyncing === "pull" ? "Pulling..." : "Pull"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSync("push")}
            disabled={isSyncing !== null || isLoading}
            className="text-xs"
          >
            <Upload className={`h-3.5 w-3.5 mr-1.5 ${isSyncing === "push" ? "animate-bounce" : ""}`} />
            {isSyncing === "push" ? "Pushing..." : "Push"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchScmData}
            disabled={isLoading}
            className="text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border shadow-xs bg-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Active Bookmark</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-1.5 font-mono">
                  <GitBranch className="h-4 w-4 text-primary" />
                  {info?.bookmark || "main"}
                </p>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {info?.commit || "000000"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Modified Files</p>
                <p className="text-lg font-bold text-amber-600 mt-0.5">
                  {counts.modified}
                </p>
              </div>
              <span className="h-8 w-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                M
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Untracked Files</p>
                <p className="text-lg font-bold text-blue-600 mt-0.5">
                  {counts.untracked}
                </p>
              </div>
              <span className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                ?
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Pending Changes</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  {counts.total}
                </p>
              </div>
              <span className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                {counts.total === 0 ? "✓" : counts.total}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab("changes")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "changes"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileCode2 className="h-4 w-4" />
          Working Copy Changes
          {counts.total > 0 && (
            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-bold">
              {counts.total}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="h-4 w-4" />
          Smartlog / Stack
          <span className="text-xs text-slate-400">({commits.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("isl");
            checkIslStatus();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "isl"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sparkles className="h-4 w-4 text-purple-600" />
          Interactive GUI (<code className="font-mono text-xs">sl web</code>)
          {islRunning && (
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="ISL Server Active" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("console")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "console"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Terminal className="h-4 w-4" />
          Sapling CLI Runner
        </button>
      </div>

      {/* TAB 1: CHANGES & STAGING */}
      {activeTab === "changes" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File Changes List (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border shadow-xs bg-white">
              <CardHeader className="pb-3 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Changed Files</CardTitle>
                    <CardDescription className="text-xs">
                      Inspect file statuses and individual diffs
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDiff()}
                      className="text-xs"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View Entire Diff
                    </Button>

                    {counts.missing > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveMissing}
                        className="text-xs bg-red-600 hover:bg-red-700 text-white"
                        title="Confirm deletion in Sapling (sl remove --mark)"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Remove Missing ({counts.missing})
                      </Button>
                    )}

                    {counts.untracked > 0 && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleStageAll}
                        className="text-xs"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Stage Untracked ({counts.untracked})
                      </Button>
                    )}
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-3">
                  <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                    {[
                      { id: "all", label: `All (${counts.total})` },
                      { id: "modified", label: `Modified (${counts.modified})` },
                      { id: "missing", label: `Missing (${counts.missing})` },
                      { id: "added", label: `Added (${counts.added})` },
                      { id: "untracked", label: `Untracked (${counts.untracked})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setFilterType(tab.id)}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                          filterType === tab.id
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <Input
                    placeholder="Filter file by name..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="h-8 text-xs sm:ml-auto w-full sm:w-48"
                  />
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {filteredFiles.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                    <p className="font-medium text-sm">Working directory clean</p>
                    <p className="text-xs text-slate-400 mt-1">
                      No pending changes match the selected filter.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y max-h-[500px] overflow-y-auto">
                    {filteredFiles.map((fileItem, idx) => {
                      let badgeColor = "bg-slate-100 text-slate-800";
                      let label = fileItem.status;
                      if (fileItem.status === "M") {
                        badgeColor = "bg-amber-100 text-amber-800 border-amber-300";
                        label = "MODIFIED";
                      } else if (fileItem.status === "A") {
                        badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300";
                        label = "ADDED";
                      } else if (fileItem.status === "?") {
                        badgeColor = "bg-blue-100 text-blue-800 border-blue-300";
                        label = "UNTRACKED";
                      } else if (fileItem.status === "!" || fileItem.status === "R") {
                        badgeColor = "bg-red-100 text-red-800 border-red-300";
                        label = "MISSING";
                      }

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 text-xs hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 truncate pr-2">
                            <span
                              className={`px-1.5 py-0.5 font-mono text-[10px] font-bold rounded border ${badgeColor}`}
                            >
                              {label}
                            </span>
                            <span className="font-mono text-slate-800 truncate" title={fileItem.file}>
                              {fileItem.file}
                            </span>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDiff(fileItem.file)}
                            className="h-7 px-2 text-[11px] text-slate-600 hover:text-slate-900 shrink-0"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Diff
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Commit Form Card (Right 1 col) */}
          <div className="space-y-4">
            <Card className="border shadow-xs bg-white">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <GitCommit className="h-4 w-4 text-primary" />
                  Commit or Amend
                </CardTitle>
                <CardDescription className="text-xs">
                  Record new changes or amend previous commit in Sapling
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <form onSubmit={handleCommitOrAmend} className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Commit Message
                      </label>
                      {isAmendMode && (
                        <span className="text-[10px] text-purple-600 font-medium">
                          Optional for Amend
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={4}
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder={
                        isAmendMode
                          ? "Leave blank to keep current commit message, or type a new message..."
                          : "e.g. feat(triage): improve patient intake prioritization engine"
                      }
                      className="w-full text-xs font-sans p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="stageAll"
                        checked={stageAllUntracked}
                        onChange={(e) => setStageAllUntracked(e.target.checked)}
                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <label htmlFor="stageAll" className="text-xs text-slate-600 cursor-pointer">
                        Auto-stage untracked files (<code className="font-mono text-[10px]">sl add</code>)
                      </label>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-purple-50/80 border border-purple-200/70 rounded-lg">
                      <input
                        type="checkbox"
                        id="amendMode"
                        checked={isAmendMode}
                        onChange={(e) => setIsAmendMode(e.target.checked)}
                        className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                      />
                      <label htmlFor="amendMode" className="text-xs text-purple-900 cursor-pointer font-medium leading-tight">
                        Amend into previous commit (<code className="font-mono text-[10px] font-bold">sl amend</code>)
                      </label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      (!isAmendMode && !commitMessage.trim()) ||
                      isCommitting ||
                      isAmending ||
                      (counts.total === 0 && !isAmendMode)
                    }
                    className={`w-full text-xs font-semibold ${
                      isAmendMode
                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                        : ""
                    }`}
                  >
                    {isAmendMode ? (
                      <>
                        <GitMerge className={`h-3.5 w-3.5 mr-1.5 ${isAmending ? "animate-spin" : ""}`} />
                        {isAmending ? "Amending Previous Commit..." : "Amend Previous Commit (sl amend)"}
                      </>
                    ) : (
                      <>
                        <GitCommit className={`h-3.5 w-3.5 mr-1.5 ${isCommitting ? "animate-spin" : ""}`} />
                        {isCommitting ? "Creating Commit..." : "Commit Changes"}
                      </>
                    )}
                  </Button>
                </form>

                <div className="p-3 bg-slate-50 rounded-lg border text-[11px] text-slate-600 space-y-1 font-mono">
                  <p className="font-semibold text-slate-800">Sapling Superpowers:</p>
                  <p>• <span className="font-bold text-amber-700">sl undo</span>: Undo any mistake in 1 click.</p>
                  <p>• <span className="font-bold text-purple-700">sl amend</span>: Meld changes into HEAD.</p>
                  <p>• <span className="font-bold text-primary">sl prev/next</span>: Fast stack navigation.</p>
                  <p>• <span className="font-bold text-indigo-700">sl web</span>: Meta interactive Smartlog GUI.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: SMARTLOG / COMMIT HISTORY */}
      {activeTab === "history" && (
        <Card className="border shadow-xs bg-white">
          <CardHeader className="border-b pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Sapling Commit History & Stack (Smartlog)
                </CardTitle>
                <CardDescription className="text-xs">
                  Stack-aware commit topology with single-step parent/child navigation and checkout
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchScmData} className="text-xs">
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh Stack
              </Button>
            </div>

            {/* Stack Navigation Action Bar */}
            <div className="mt-3 p-3 bg-slate-50 border rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-primary" />
                  Stack Navigation:
                </span>
                <span className="font-mono text-[11px] bg-primary/10 text-primary px-2.5 py-0.5 rounded font-bold">
                  Working Copy @ {info?.commit || "000000"}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigateStack("prev")}
                  disabled={isNavigating !== null}
                  className="h-7 text-xs bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                  title="Step down to parent commit (sl prev)"
                >
                  <ArrowDown className={`h-3 w-3 mr-1 ${isNavigating === "prev" ? "animate-bounce" : ""}`} />
                  Step Down (<code className="font-mono text-[10px]">sl prev</code>)
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigateStack("next")}
                  disabled={isNavigating !== null}
                  className="h-7 text-xs bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                  title="Step up to child commit (sl next)"
                >
                  <ArrowUp className={`h-3 w-3 mr-1 ${isNavigating === "next" ? "animate-bounce" : ""}`} />
                  Step Up (<code className="font-mono text-[10px]">sl next</code>)
                </Button>

                <Button
                  variant={showAsciiTree ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAsciiTree(!showAsciiTree)}
                  className="h-7 text-xs"
                >
                  <Terminal className="h-3 w-3 mr-1" />
                  {showAsciiTree ? "Hide ASCII Tree" : "Show ASCII Graph"}
                </Button>
              </div>
            </div>

            {/* Collapsible ASCII Smartlog Diagram */}
            {showAsciiTree && (
              <div className="mt-3 p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto border border-slate-800 shadow-inner">
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-2">
                  Sapling Visual Smartlog ASCII Diagram:
                </p>
                <pre className="whitespace-pre leading-relaxed">{asciiTree || "(Fetching smartlog graph...)"}</pre>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {commits.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <FolderGit2 className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-sm text-slate-700">No commits recorded yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  This repository has been initialized with Sapling. Head over to the &quot;Working Copy Changes&quot; tab to make your initial commit!
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {commits.map((c, i) => {
                  const isCurrent =
                    Boolean(info?.commit) &&
                    (c.hash.toLowerCase().startsWith(info!.commit.toLowerCase()) ||
                      info!.commit.toLowerCase().startsWith(c.hash.toLowerCase()));

                  return (
                    <div
                      key={i}
                      className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                        isCurrent ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                              isCurrent
                                ? "bg-primary text-white"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {isCurrent ? "@" : "o"} {c.hash}
                          </span>
                          {isCurrent && (
                            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 font-semibold">
                              Current Head (Working Copy)
                            </Badge>
                          )}
                          <span className="text-xs font-semibold text-slate-800">
                            {c.message}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-sans">
                          <span>Author: {c.author}</span>
                          <span>•</span>
                          <span>{c.age}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isCurrent && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleNavigateStack("goto", c.hash)}
                            disabled={isNavigating !== null}
                            className="h-8 text-xs text-primary border-primary/20 hover:bg-primary/5"
                            title={`Jump working copy to this revision (sl goto ${c.hash})`}
                          >
                            <Navigation className={`h-3 w-3 mr-1 ${isNavigating === c.hash ? "animate-spin" : ""}`} />
                            {isNavigating === c.hash ? "Going..." : "Checkout"}
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(c.hash)}
                          className="h-8 text-xs text-slate-500"
                        >
                          {copiedHash === c.hash ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 mr-1" />
                              Copy ID
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: META INTERACTIVE SMARTLOG GUI (sl web) */}
      {activeTab === "isl" && (
        <Card className="border shadow-xs bg-white">
          <CardHeader className="border-b pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Meta Interactive Smartlog (ISL) Web GUI
                  </CardTitle>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                    Built-in Meta GUI
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Meta&apos;s interactive web-based visual commit rebaser, smartlog graph, and hunk staging UI
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                {islRunning && islSession?.url && (
                  <>
                    <a
                      href={islSession.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open In New Window
                    </a>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleStopIsl}
                      disabled={isLoadingIsl}
                      className="text-xs"
                    >
                      Stop Server
                    </Button>
                  </>
                )}

                {!islRunning && (
                  <Button
                    size="sm"
                    onClick={handleStartIsl}
                    disabled={isLoadingIsl}
                    className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Play className={`h-3.5 w-3.5 mr-1.5 ${isLoadingIsl ? "animate-spin" : ""}`} />
                    {isLoadingIsl ? "Launching ISL Server..." : "Launch sl web GUI"}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {islRunning && islSession?.url ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold">Interactive Smartlog Server Active</span>
                    <span className="font-mono text-[11px] text-emerald-700">
                      (Port {islSession.port} • PID {islSession.pid})
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 hidden sm:inline">
                    Embedded securely below. You can drag, rebase, and inspect commits live.
                  </span>
                </div>

                <div className="w-full border rounded-xl overflow-hidden shadow-sm bg-slate-900 min-h-[650px] relative">
                  <iframe
                    src={islSession.url}
                    title="Sapling Interactive Smartlog"
                    className="w-full h-[750px] border-0 bg-white"
                    allow="clipboard-read; clipboard-write"
                  />
                </div>
              </div>
            ) : (
              <div className="py-16 px-4 text-center max-w-xl mx-auto space-y-4">
                <div className="h-16 w-16 mx-auto bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100 shadow-xs">
                  <Globe className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Interactive Smartlog GUI (<code className="font-mono text-purple-700">sl web</code>)
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Sapling includes an official browser GUI created by Meta called <strong>Interactive Smartlog (ISL)</strong>.
                    It allows you to visually reorder commits via drag-and-drop, stage individual lines/hunks,
                    amend, absorb, and view code reviews in real time without touching the command line.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left py-2">
                  <div className="p-3 bg-slate-50 rounded-lg border text-xs">
                    <p className="font-bold text-slate-800">🎯 Drag-and-Drop</p>
                    <p className="text-slate-500 text-[11px] mt-1">Reorder and rebase commits in your stack visually.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border text-xs">
                    <p className="font-bold text-slate-800">✂️ Hunk Staging</p>
                    <p className="text-slate-500 text-[11px] mt-1">Select and stage individual diff blocks with ease.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border text-xs">
                    <p className="font-bold text-slate-800">⚡ Live Stack Sync</p>
                    <p className="text-slate-500 text-[11px] mt-1">Seamlessly synchronized with MediSync repository.</p>
                  </div>
                </div>

                <Button
                  onClick={handleStartIsl}
                  disabled={isLoadingIsl}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-6 py-2 h-9"
                >
                  <Play className={`h-4 w-4 mr-2 ${isLoadingIsl ? "animate-spin" : ""}`} />
                  {isLoadingIsl ? "Starting ISL Server..." : "Start & Embed Interactive Smartlog"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: CLI RUNNER / CONSOLE */}
      {activeTab === "console" && (
        <Card className="border shadow-xs bg-white">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  Interactive Sapling CLI Runner
                </CardTitle>
                <CardDescription className="text-xs">
                  Run standard Sapling (`sl`) commands directly from the dashboard
                </CardDescription>
              </div>
            </div>

            {/* Quick Command Presets */}
            <div className="flex items-center gap-2 pt-3 flex-wrap">
              <span className="text-xs text-slate-500 font-medium">Quick run:</span>
              {[
                "undo --preview",
                "smartlog",
                "whereami",
                "status",
                "prev",
                "next",
                "book",
                "diff --stat",
                "version",
              ].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => {
                    setConsoleCommand(cmd);
                    handleExecuteCommand(cmd);
                  }}
                  className="px-2 py-1 text-xs font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  sl {cmd}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">
                  sl
                </span>
                <Input
                  value={consoleCommand}
                  onChange={(e) => setConsoleCommand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleExecuteCommand();
                  }}
                  placeholder="status, log -l 5, whereami..."
                  className="pl-9 font-mono text-xs h-9"
                />
              </div>

              <Button
                onClick={() => handleExecuteCommand()}
                disabled={isExecutingCmd || !consoleCommand.trim()}
                className="text-xs"
              >
                <Play className={`h-3.5 w-3.5 mr-1 ${isExecutingCmd ? "animate-spin" : ""}`} />
                {isExecutingCmd ? "Executing..." : "Execute"}
              </Button>
            </div>

            {/* Monospace Output Window */}
            <div className="rounded-xl bg-slate-950 p-4 font-mono text-xs text-emerald-400 min-h-[300px] max-h-[500px] overflow-y-auto border border-slate-800 shadow-inner">
              <div className="flex items-center justify-between text-slate-500 pb-2 mb-2 border-b border-slate-800 text-[11px]">
                <span>Output Console</span>
                <button
                  onClick={() => setConsoleOutput("")}
                  className="hover:text-slate-300"
                >
                  Clear
                </button>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed">
                {consoleOutput || "(Console ready. Select a command or type above and click Execute.)"}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* UNDO TIME MACHINE MODAL */}
      {isUndoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden border">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-amber-50/70">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-amber-700" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Sapling Undo Time Machine (<code className="font-mono text-xs">sl undo</code>)
                  </h3>
                  <p className="text-xs text-slate-500">Reverse your last local command safely</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsUndoModalOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-xs text-slate-600 leading-relaxed">
                Sapling provides a true <strong>time machine</strong>. Unlike git, any local command (commit, amend, goto, rebase) can be completely undone in one step without losing work.
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-amber-300 max-h-48 overflow-y-auto">
                {isLoadingUndoPreview ? (
                  <div className="text-slate-400 py-4 text-center">Calculating undo target preview...</div>
                ) : (
                  <pre className="whitespace-pre-wrap">{undoPreviewText || "No preview available."}</pre>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <div className="p-3 rounded-lg border bg-slate-50 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Option A: Undo & Keep Changes</p>
                    <p className="text-[11px] text-slate-500">
                      Uncommits the commit but keeps all modified files in your working directory (<code className="font-mono">sl undo --keep</code>).
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isUndoing || isLoadingUndoPreview}
                    onClick={() => handleExecuteUndo(true)}
                    className="text-xs shrink-0 font-semibold"
                  >
                    {isUndoing ? "Undoing..." : "Undo (Keep Files)"}
                  </Button>
                </div>

                <div className="p-3 rounded-lg border bg-amber-50/40 border-amber-200/70 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-amber-900">Option B: Full Undo</p>
                    <p className="text-[11px] text-amber-700">
                      Completely reverts the working tree and stack to before the command (<code className="font-mono">sl undo</code>).
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isUndoing || isLoadingUndoPreview}
                    onClick={() => handleExecuteUndo(false)}
                    className="text-xs shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                  >
                    {isUndoing ? "Undoing..." : "Full Undo"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t bg-slate-50 flex justify-end">
              <Button size="sm" variant="ghost" onClick={() => setIsUndoModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DIFF MODAL */}
      {activeDiffFile && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCode2 className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-mono">
                    Diff: {activeDiffFile}
                  </h3>
                  <p className="text-xs text-slate-500">Working tree vs Last Commit</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveDiffFile(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs bg-slate-900 text-slate-100">
              {isLoadingDiff ? (
                <div className="py-12 text-center text-slate-400">Loading diff...</div>
              ) : (
                <div className="space-y-0.5 leading-relaxed">
                  {diffContent.split("\n").map((line, idx) => {
                    let lineStyle = "text-slate-300";
                    if (line.startsWith("+") && !line.startsWith("+++")) {
                      lineStyle = "text-emerald-400 bg-emerald-950/40 px-1 rounded-xs";
                    } else if (line.startsWith("-") && !line.startsWith("---")) {
                      lineStyle = "text-red-400 bg-red-950/40 px-1 rounded-xs";
                    } else if (line.startsWith("@")) {
                      lineStyle = "text-blue-400 font-bold bg-blue-950/30 px-1";
                    }
                    return (
                      <div key={idx} className={lineStyle}>
                        {line || " "}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t bg-slate-50 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setActiveDiffFile(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
