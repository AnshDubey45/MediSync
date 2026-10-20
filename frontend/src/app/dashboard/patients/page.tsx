"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { ExplainabilityCard } from "@/components/triage/explainability-card";
import {
  Users, Search, Filter, ChevronRight, Activity, Clock,
  Calendar, FileText, HeartPulse, RefreshCw, Loader2
} from "lucide-react";

interface PatientRecord {
  id: string;
  fullName: string;
  age: number;
  conditions: string;
  createdAt: string;
  totalCases: number;
  lastVisit: string;
  latestCase: {
    id: string;
    caseReference: string;
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    score: number;
    status: string;
    symptoms: string;
    duration: string;
    createdAt: string;
    factors: any[];
  } | null;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/patients", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPatients(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.conditions.toLowerCase().includes(q) ||
      (p.latestCase && p.latestCase.caseReference.toLowerCase().includes(q))
    );
  });

  const criticalCount = patients.filter((p) => p.latestCase?.priority === "CRITICAL").length;
  const highCount = patients.filter((p) => p.latestCase?.priority === "HIGH").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Patients Directory</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Registered patient records, medical background, and triage case histories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-2" onClick={fetchPatients}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border shadow-xs bg-white">
          <CardContent className="p-5">
            <div className="flex justify-between items-center pb-2">
              <p className="text-sm font-medium text-slate-600">Total Patients</p>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-3xl font-bold font-mono tracking-tighter text-slate-900">
              {patients.length.toString().padStart(2, "0")}
            </h3>
          </CardContent>
        </Card>

        <Card className="border shadow-xs border-l-4 border-l-red-500 bg-white">
          <CardContent className="p-5">
            <div className="flex justify-between items-center pb-2">
              <p className="text-sm font-medium text-slate-600">Critical Priority</p>
              <Activity className="h-4 w-4 text-red-500" />
            </div>
            <h3 className="text-3xl font-bold font-mono tracking-tighter text-slate-900">
              {criticalCount.toString().padStart(2, "0")}
            </h3>
          </CardContent>
        </Card>

        <Card className="border shadow-xs border-l-4 border-l-amber-500 bg-white">
          <CardContent className="p-5">
            <div className="flex justify-between items-center pb-2">
              <p className="text-sm font-medium text-slate-600">High Priority</p>
              <Activity className="h-4 w-4 text-amber-500" />
            </div>
            <h3 className="text-3xl font-bold font-mono tracking-tighter text-slate-900">
              {highCount.toString().padStart(2, "0")}
            </h3>
          </CardContent>
        </Card>

        <Card className="border shadow-xs border-l-4 border-l-emerald-500 bg-white">
          <CardContent className="p-5">
            <div className="flex justify-between items-center pb-2">
              <p className="text-sm font-medium text-slate-600">Active Records</p>
              <HeartPulse className="h-4 w-4 text-emerald-500" />
            </div>
            <h3 className="text-3xl font-bold font-mono tracking-tighter text-slate-900">
              {patients.filter((p) => p.totalCases > 0).length.toString().padStart(2, "0")}
            </h3>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 bg-white p-3 border rounded-xl shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by patient name, condition (e.g. Asthma, Hypertension), or case ID..."
            className="pl-9 bg-slate-50 border-slate-200 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-xs text-muted-foreground whitespace-nowrap px-2">
          Showing <strong>{filteredPatients.length}</strong> of {patients.length} patients
        </div>
      </div>

      {/* Patients Table */}
      <Card className="border shadow-xs overflow-hidden bg-white">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm">Loading patient records…</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center text-muted-foreground">
            <Users className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium">No matching patient records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80 border-b">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Patient</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Age</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Reported Conditions</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Active Case</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Priority</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer transition-colors hover:bg-primary/5 group"
                    onClick={() => {
                      setSelectedPatient(p);
                      setIsDrawerOpen(true);
                    }}
                  >
                    <TableCell>
                      <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                          {p.fullName.charAt(0)}
                        </div>
                        {p.fullName}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">{p.age} yrs</TableCell>
                    <TableCell className="max-w-[220px]">
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 line-clamp-1 inline-block">
                        {p.conditions}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-primary font-semibold">
                      {p.latestCase?.caseReference || "—"}
                    </TableCell>
                    <TableCell>
                      {p.latestCase ? (
                        <PriorityBadge priority={p.latestCase.priority} />
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.latestCase ? (
                        <Badge
                          variant={
                            p.latestCase.status === "Waiting"
                              ? "outline"
                              : p.latestCase.status === "Reviewing"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            p.latestCase.status === "Reviewing"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : p.latestCase.status === "Resolved"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : ""
                          }
                        >
                          {p.latestCase.status}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Archived</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 group-hover:text-primary">
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

      {/* Patient Medical Record Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto sm:p-0">
          {selectedPatient && (
            <div className="flex flex-col h-full bg-slate-50">
              <SheetHeader className="p-6 bg-white border-b sticky top-0 z-10">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <SheetTitle className="text-xl font-bold text-slate-900">{selectedPatient.fullName}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-slate-600 font-medium">{selectedPatient.age} years old</span>
                      <span>·</span>
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">ID: {selectedPatient.id}</span>
                    </SheetDescription>
                  </div>
                  {selectedPatient.latestCase && (
                    <PriorityBadge priority={selectedPatient.latestCase.priority} />
                  )}
                </div>
              </SheetHeader>

              <div className="p-6 space-y-5 flex-1">
                {/* Background Details */}
                <Card className="border shadow-xs bg-white">
                  <CardContent className="p-5 space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Medical Profile
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Pre-existing Conditions</div>
                        <div className="font-semibold text-slate-900">{selectedPatient.conditions}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Total Triage Visits</div>
                        <div className="font-semibold text-slate-900">{selectedPatient.totalCases} visit(s)</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Latest Triage Result */}
                {selectedPatient.latestCase ? (
                  <>
                    <div className="border-b pb-2 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Activity className="h-4 w-4 text-primary" /> Active Triage Encounter ({selectedPatient.latestCase.caseReference})
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {selectedPatient.latestCase.status}
                        </Badge>
                      </div>
                    </div>

                    <ExplainabilityCard
                      result={{
                        score: selectedPatient.latestCase.score,
                        priority: selectedPatient.latestCase.priority,
                        rule_version: "triage-v1.2",
                        factors: selectedPatient.latestCase.factors,
                      }}
                    />

                    <Card className="border shadow-xs bg-white">
                      <CardContent className="p-5 space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Reported Symptoms
                        </h4>
                        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border">
                          "{selectedPatient.latestCase.symptoms}"
                        </p>
                        <div className="text-xs text-muted-foreground mt-2">
                          Duration: <strong>{selectedPatient.latestCase.duration}</strong>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="p-6 bg-white border rounded-xl text-center text-sm text-muted-foreground">
                    No active triage cases recorded for this patient.
                  </div>
                )}
              </div>

              <div className="p-5 bg-white border-t sticky bottom-0 z-10 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setIsDrawerOpen(false)}>
                  Close Chart
                </Button>
                <Button className="flex-1" onClick={() => setIsDrawerOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
