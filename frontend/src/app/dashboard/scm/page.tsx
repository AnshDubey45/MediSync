"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  GitBranch, GitCommit, RefreshCw, Upload, Download, Plus, CheckCircle2,
  AlertTriangle, FileCode2, Terminal, Eye, X, Copy, Check, ShieldCheck,
  FolderGit2, Clock, Play, Trash2
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
  const [activeTab, setActiveTab] = useState<"changes" | "history" | "console">("changes");
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

      // 3. Fetch log
      const logJson = await safeFetchJson("/api/scm/log?limit=20");
      if (logJson.success) {
        setCommits(logJson.data.commits || []);
      }
    } catch (err: any) {
      showBanner("error", "Failed to connect to Sapling SCM backend: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScmData();
  }, [fetchScmData]);

  // Handle Commit
  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-300">
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
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sapling Source Control</h1>
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
        <div className="flex items-center gap-2">
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
      <div className="flex items-center gap-2 border-b">
        <button
          onClick={() => setActiveTab("changes")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
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
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="h-4 w-4" />
          Smartlog / Commits
          <span className="text-xs text-slate-400">({commits.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("console")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
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
                  Commit Changes
                </CardTitle>
                <CardDescription className="text-xs">
                  Record your changes to the Sapling repository
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <form onSubmit={handleCommit} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Commit Message
                    </label>
                    <textarea
                      rows={4}
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder="e.g. feat(triage): improve patient intake prioritization engine"
                      className="w-full text-xs font-sans p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="stageAll"
                      checked={stageAllUntracked}
                      onChange={(e) => setStageAllUntracked(e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                    />
                    <label htmlFor="stageAll" className="text-xs text-slate-600 cursor-pointer">
                      Auto-stage untracked files (`sl add`)
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={!commitMessage.trim() || isCommitting || counts.total === 0}
                    className="w-full text-xs font-semibold"
                  >
                    <GitCommit className={`h-3.5 w-3.5 mr-1.5 ${isCommitting ? "animate-spin" : ""}`} />
                    {isCommitting ? "Creating Commit..." : "Commit Changes"}
                  </Button>
                </form>

                <div className="p-3 bg-slate-50 rounded-lg border text-[11px] text-slate-600 space-y-1 font-mono">
                  <p className="font-semibold text-slate-800">Quick Tips:</p>
                  <p>• Sapling tracks changes automatically.</p>
                  <p>• Use pull/push to synchronize with your remote.</p>
                  <p>• Commits are immutable & stackable.</p>
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Sapling Commit History (Smartlog)
                </CardTitle>
                <CardDescription className="text-xs">
                  Recent commits recorded in this repository
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchScmData} className="text-xs">
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh History
              </Button>
            </div>
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
                {commits.map((c, i) => (
                  <div key={i} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          @{c.hash}
                        </span>
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
                ))}
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
                "status",
                "addremove",
                "remove --mark",
                "log -l 5",
                "whereami",
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
