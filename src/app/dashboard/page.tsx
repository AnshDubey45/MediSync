"use client";

import { useState, useEffect, useCallback } from "react";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { ExplainabilityCard } from "@/components/triage/explainability-card";
import { TriageResult } from "@/lib/triage/engine";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock, Filter, FileText, ChevronRight, Activity,
  Loader2, Users, RefreshCw, Database, CheckCircle2
} from "lucide-react";

type CaseStatus = "Waiting" | "Reviewing" | "Resolved";

interface PatientCase {
  id: string;
  patientName: string;
  age: number;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  score: number;
  symptoms: string;
  duration?: string;
  waitTime: string;
  status: CaseStatus;
  triageResult: TriageResult;
  case_reference: string;
  created_at: string;
}

export default function DashboardPage() {
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<PatientCase | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string>("Just now");

  const fetchCases = useCallback(async (showFullLoader = false) => {
    if (showFullLoader) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch("/api/cases", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCases(json.data);
        setLastSynced(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }
    } catch (err) {
      console.error("Failed to fetch cases from SQLite:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCases(true);

    // Auto-poll SQLite database every 3 seconds for real-time queue updates
    const interval = setInterval(() => {
      fetchCases(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchCases]);

  const handleRowClick = (c: PatientCase) => {
    setSelectedCase(c);
    setIsDrawerOpen(true);
  };

  const updateCaseStatus = async (newStatus: CaseStatus) => {
    if (!selectedCase) return;

    // Optimistic UI update
    const updated = cases.map((c) =>
      c.id === selectedCase.id ? { ...c, status: newStatus } : c
    );
    setCases(updated);
    setSelectedCase({ ...selectedCase, status: newStatus });

    try {
      await fetch(`/api/cases/${selectedCase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchCases(false);
    } catch (err) {
      console.error("Failed to update status in SQLite:", err);
    }
  };

  const activeCases = cases.filter((c) => c.status !== "Resolved");
  const criticalCount = activeCases.filter((c) => c.priority === "CRITICAL").length;
  const highCount = activeCases.filter((c) => c.priority === "HIGH").length;
  const waitingCount = activeCases.filter((c) => c.status === "Waiting").length;
  const resolvedCount = cases.filter((c) => c.status === "Resolved").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* System Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-xl px-5 py-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">SQLite Database Active</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Local zero-latency persistence & auto-refreshing real-time queue</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>Synced: <strong className="font-mono text-slate-700">{lastSynced}</strong></span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => fetchCases(false)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
            Sync Now
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Clinical Overview</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Prioritized patient intake queue and triage workload.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Filter className="h-3.5 w-3.5" /> Filter
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Critical", value: criticalCount, color: "border-l-red-500", icon: Activity, iconColor: "text-red-500", bg: "from-red-50/50" },
          { label: "High", value: highCount, color: "border-l-amber-500", icon: Activity, iconColor: "text-amber-500", bg: "from-amber-50/50" },
          { label: "Waiting", value: waitingCount, color: "border-l-blue-500", icon: Clock, iconColor: "text-blue-500", bg: "from-blue-50/50" },
          { label: "Resolved Cases", value: resolvedCount, color: "border-l-emerald-500", icon: FileText, iconColor: "text-emerald-500", bg: "from-emerald-50/50" },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className={`border shadow-xs border-l-4 ${kpi.color} relative overflow-hidden group bg-white`}>
              <div className={`absolute inset-0 bg-gradient-to-r ${kpi.bg} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
              <CardContent className="p-5">
                <div className="flex justify-between items-center pb-2">
                  <p className="text-sm font-medium text-slate-600">{kpi.label}</p>
                  <Icon className={`h-4 w-4 ${kpi.iconColor}`} />
                </div>
                {isLoading ? (
                  <div className="h-9 w-12 bg-slate-100 animate-pulse rounded" />
                ) : (
                  <h3 className="text-3xl font-bold font-mono tracking-tighter text-slate-900">
                    {kpi.value.toString().padStart(2, "0")}
                  </h3>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Triage Queue Table */}
      <Card className="border shadow-xs overflow-hidden bg-white">
        <div className="px-5 py-3 border-b bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-slate-700">Active Patient Queue</span>
            <Badge variant="outline" className="text-xs font-normal ml-1 bg-white">
              {activeCases.length} waiting
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">Automated Clinical Priority Sorting</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm">Connecting to local database…</p>
          </div>
        ) : activeCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <h3 className="text-base font-semibold text-slate-900">Queue is Clear</h3>
            <p className="text-sm text-muted-foreground max-w-sm">All patients have been reviewed and resolved. New incoming intakes will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80 border-b">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[100px] text-xs font-semibold text-slate-600 uppercase tracking-wide">Case ID</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Patient</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Priority</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wide max-w-[280px]">Symptoms</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Wait</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCases.map((c) => (
                  <TableRow
                    key={c.id}
                    className={`cursor-pointer transition-colors hover:bg-primary/5 group ${
                      c.priority === "CRITICAL" ? "bg-red-50/30 hover:bg-red-50/60" : ""
                    }`}
                    onClick={() => handleRowClick(c)}
                  >
                    <TableCell className="font-mono text-xs font-semibold text-primary">{c.case_reference}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-900 text-sm">{c.patientName}</div>
                      <div className="text-xs text-muted-foreground">{c.age} yrs</div>
                    </TableCell>
                    <TableCell><PriorityBadge priority={c.priority} /></TableCell>
                    <TableCell className="max-w-[280px]">
                      <p className="truncate text-sm text-muted-foreground">{c.symptoms}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {c.waitTime}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={c.status === "Waiting" ? "outline" : c.status === "Reviewing" ? "default" : "secondary"}
                        className={
                          c.status === "Reviewing"
                            ? "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100"
                            : c.status === "Resolved"
                            ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-100"
                            : ""
                        }
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 group-hover:text-primary transition-colors">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Patient Case Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto sm:p-0">
          {selectedCase && (
            <div className="flex flex-col h-full bg-slate-50">
              <SheetHeader className="p-6 bg-white border-b sticky top-0 z-10">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <SheetTitle className="text-xl font-bold text-slate-900">{selectedCase.patientName}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                        {selectedCase.case_reference}
                      </span>
                      <span className="text-slate-500">{selectedCase.age} years old</span>
                    </SheetDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant={selectedCase.status === "Waiting" ? "outline" : selectedCase.status === "Reviewing" ? "default" : "secondary"}
                      className={selectedCase.status === "Reviewing" ? "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100" : ""}
                    >
                      {selectedCase.status}
                    </Badge>
                    <PriorityBadge priority={selectedCase.priority} />
                  </div>
                </div>
              </SheetHeader>

              <div className="p-6 space-y-5 flex-1">
                {/* Explainability */}
                <ExplainabilityCard result={selectedCase.triageResult} />

                {/* Symptoms */}
                <Card className="border shadow-xs bg-white">
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Reported Symptoms</h4>
                      <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border">
                        "{selectedCase.symptoms}"
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Wait Time</div>
                        <div className="font-semibold text-slate-900">{selectedCase.waitTime}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Score</div>
                        <div className="font-semibold text-slate-900">{selectedCase.score}/100</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Activity Timeline</h4>
                  <div className="space-y-4 border-l-2 border-slate-200 pl-5 ml-1">
                    <div className="relative">
                      <div className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-slate-300 ring-4 ring-slate-50" />
                      <p className="text-sm font-semibold text-slate-900">Intake received</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Recorded in SQLite, {selectedCase.waitTime} ago</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-slate-50" />
                      <p className="text-sm font-semibold text-slate-900">
                        Triage priority assigned: <span className="text-primary">{selectedCase.priority}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Deterministic score: {selectedCase.score}/100</p>
                    </div>
                    {selectedCase.status === "Reviewing" && (
                      <div className="relative">
                        <div className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-slate-50" />
                        <p className="text-sm font-semibold text-slate-900">Clinician opened case</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Under review</p>
                      </div>
                    )}
                    {selectedCase.status === "Resolved" && (
                      <div className="relative">
                        <div className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-slate-50" />
                        <p className="text-sm font-semibold text-slate-900">Case resolved</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Clinician closed the case</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action footer */}
              <div className="p-5 bg-white border-t sticky bottom-0 z-10 flex gap-3">
                {selectedCase.status === "Waiting" && (
                  <Button className="flex-1" onClick={() => updateCaseStatus("Reviewing")}>
                    Start Review
                  </Button>
                )}
                {selectedCase.status === "Reviewing" && (
                  <>
                    <Button variant="outline" className="flex-1" onClick={() => updateCaseStatus("Waiting")}>
                      Put Back
                    </Button>
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => { updateCaseStatus("Resolved"); setIsDrawerOpen(false); }}
                    >
                      Resolve Case
                    </Button>
                  </>
                )}
                {selectedCase.status === "Resolved" && (
                  <div className="flex-1 text-center text-sm text-emerald-600 font-semibold py-2">
                    ✓ Case Resolved
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
