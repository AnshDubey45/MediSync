"use client";

import { useState } from "react";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { ExplainabilityCard } from "@/components/triage/explainability-card";
import { TriageResult } from "@/lib/triage/engine";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Filter, MoreHorizontal, FileText, ChevronRight, Activity } from "lucide-react";

// Mock Data
type CaseStatus = "Waiting" | "Reviewing" | "Resolved";

interface PatientCase {
  id: string;
  patientName: string;
  age: number;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  score: number;
  symptoms: string;
  waitTime: string;
  status: CaseStatus;
  triageResult: TriageResult;
}

const MOCK_CASES: PatientCase[] = [
  {
    id: "MS-8492",
    patientName: "Robert T.",
    age: 68,
    priority: "CRITICAL",
    score: 85,
    symptoms: "Severe chest pain radiating to left arm, shortness of breath, dizzy.",
    waitTime: "2 mins",
    status: "Waiting",
    triageResult: {
      score: 85,
      priority: "CRITICAL",
      rule_version: "triage-v1.2",
      factors: [
        { factor_name: "Severe Symptom Indicator", contribution: 40, reason: "Matched critical risk keyword in symptoms." },
        { factor_name: "Sudden Onset", contribution: 30, reason: "Symptoms appeared very recently." },
        { factor_name: "Age Factor (65+)", contribution: 15, reason: "Patient is in an older age bracket." }
      ]
    }
  },
  {
    id: "MS-3102",
    patientName: "Emma W.",
    age: 34,
    priority: "HIGH",
    score: 65,
    symptoms: "High fever 103F, severe headache, neck stiffness.",
    waitTime: "8 mins",
    status: "Reviewing",
    triageResult: {
      score: 65,
      priority: "HIGH",
      rule_version: "triage-v1.2",
      factors: [
        { factor_name: "High Symptom Indicator", contribution: 25, reason: "Matched high risk keyword in symptoms." },
        { factor_name: "Recent Onset", contribution: 40, reason: "Symptoms appeared recently." }
      ]
    }
  },
  {
    id: "MS-9281",
    patientName: "James L.",
    age: 42,
    priority: "MEDIUM",
    score: 45,
    symptoms: "Persistent cough for 2 weeks, mild chest discomfort when coughing.",
    waitTime: "14 mins",
    status: "Waiting",
    triageResult: {
      score: 45,
      priority: "MEDIUM",
      rule_version: "triage-v1.2",
      factors: [
        { factor_name: "Medium Symptom Indicator", contribution: 10, reason: "Matched medium risk keyword in symptoms." },
        { factor_name: "Ongoing Issue", contribution: 35, reason: "Symptoms have been ongoing for some time." }
      ]
    }
  },
  {
    id: "MS-5512",
    patientName: "Sarah M.",
    age: 28,
    priority: "LOW",
    score: 15,
    symptoms: "Sprained ankle while jogging, mild swelling.",
    waitTime: "22 mins",
    status: "Waiting",
    triageResult: {
      score: 15,
      priority: "LOW",
      rule_version: "triage-v1.2",
      factors: [
        { factor_name: "Medium Symptom Indicator", contribution: 10, reason: "Matched medium risk keyword in symptoms." },
        { factor_name: "Sudden Onset", contribution: 5, reason: "Injury happened recently." }
      ]
    }
  }
];

export default function DashboardPage() {
  const [cases, setCases] = useState<PatientCase[]>(MOCK_CASES);
  const [selectedCase, setSelectedCase] = useState<PatientCase | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleRowClick = (c: PatientCase) => {
    setSelectedCase(c);
    setIsDrawerOpen(true);
  };

  const updateCaseStatus = (newStatus: CaseStatus) => {
    if (selectedCase) {
      const updated = cases.map(c => c.id === selectedCase.id ? { ...c, status: newStatus } : c);
      setCases(updated);
      setSelectedCase({ ...selectedCase, status: newStatus });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* KPI Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Overview</h2>
          <p className="text-muted-foreground">Monitor and manage the active triage queue.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9">
            <Filter className="h-4 w-4 mr-2" /> Filter
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border shadow-sm border-l-4 border-l-red-500 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6">
            <div className="flex justify-between items-center space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-600">Critical</p>
              <Activity className="h-4 w-4 text-red-500" />
            </div>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-3xl font-bold font-mono tracking-tighter text-slate-900">
                {cases.filter(c => c.priority === "CRITICAL" && c.status !== "Resolved").length.toString().padStart(2, '0')}
              </h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border shadow-sm border-l-4 border-l-amber-500 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6">
            <div className="flex justify-between items-center space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-600">High</p>
              <Activity className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-3xl font-bold font-mono tracking-tighter text-slate-900">
                {cases.filter(c => c.priority === "HIGH" && c.status !== "Resolved").length.toString().padStart(2, '0')}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm border-l-4 border-l-blue-500 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6">
            <div className="flex justify-between items-center space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-600">Waiting</p>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-3xl font-bold font-mono tracking-tighter text-slate-900">
                {cases.filter(c => c.status === "Waiting").length.toString().padStart(2, '0')}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm border-l-4 border-l-slate-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6">
            <div className="flex justify-between items-center space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-600">Resolved Today</p>
              <FileText className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-3xl font-bold font-mono tracking-tighter text-slate-900">
                24
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Triage Queue Table */}
      <Card className="border shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px]">Case ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="max-w-[300px]">Symptoms</TableHead>
                <TableHead>Wait</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((c) => (
                <TableRow 
                  key={c.id} 
                  className={`cursor-pointer transition-colors hover:bg-slate-50 group ${c.priority === "CRITICAL" ? "bg-red-50/20" : ""}`}
                  onClick={() => handleRowClick(c)}
                >
                  <TableCell className="font-mono text-xs font-medium text-slate-600">{c.id}</TableCell>
                  <TableCell className="font-medium text-slate-900">{c.patientName}</TableCell>
                  <TableCell>
                    <PriorityBadge priority={c.priority} />
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate text-muted-foreground text-sm">
                    {c.symptoms}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 font-medium">{c.waitTime}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "Waiting" ? "outline" : c.status === "Reviewing" ? "default" : "secondary"}
                      className={c.status === "Reviewing" ? "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100" : ""}
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
      </Card>

      {/* Patient Case Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto sm:p-0">
          {selectedCase && (
            <div className="flex flex-col h-full bg-slate-50">
              <SheetHeader className="p-6 bg-white border-b sticky top-0 z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <SheetTitle className="text-2xl font-bold text-slate-900">{selectedCase.patientName}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{selectedCase.id}</span>
                      <span>{selectedCase.age} years old</span>
                    </SheetDescription>
                  </div>
                  <Badge variant={selectedCase.status === "Waiting" ? "outline" : selectedCase.status === "Reviewing" ? "default" : "secondary"}
                    className={selectedCase.status === "Reviewing" ? "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100" : ""}
                  >
                    {selectedCase.status}
                  </Badge>
                </div>
              </SheetHeader>
              
              <div className="p-6 space-y-6 flex-1">
                {/* Explainability Card */}
                <ExplainabilityCard result={selectedCase.triageResult} />

                {/* Patient Details */}
                <Card className="border shadow-sm">
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-1">Reported Symptoms</h4>
                      <p className="text-sm text-slate-700 leading-relaxed bg-white p-3 rounded border">
                        "{selectedCase.symptoms}"
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">Wait Time</div>
                        <div className="font-medium text-slate-900">{selectedCase.waitTime}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Intake Method</div>
                        <div className="font-medium text-slate-900">Voice / Text</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline mock */}
                <div className="px-2">
                  <h4 className="text-sm font-semibold text-slate-900 mb-4">Activity Timeline</h4>
                  <div className="space-y-4 border-l-2 border-slate-200 pl-4 ml-2 relative">
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-300 ring-4 ring-slate-50" />
                      <p className="text-sm font-medium text-slate-900">Intake received</p>
                      <p className="text-xs text-muted-foreground">Today, {selectedCase.waitTime} ago</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-slate-50" />
                      <p className="text-sm font-medium text-slate-900">Triage generated priority</p>
                      <p className="text-xs text-muted-foreground">Today, {selectedCase.waitTime} ago</p>
                    </div>
                    {selectedCase.status === "Reviewing" && (
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-slate-50" />
                        <p className="text-sm font-medium text-slate-900">Dr. Sarah Jenkins opened case</p>
                        <p className="text-xs text-muted-foreground">Just now</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-6 bg-white border-t mt-auto sticky bottom-0 z-10 flex gap-3">
                {selectedCase.status === "Waiting" && (
                  <Button className="w-full" onClick={() => updateCaseStatus("Reviewing")}>
                    Start Review
                  </Button>
                )}
                {selectedCase.status === "Reviewing" && (
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => {
                    updateCaseStatus("Resolved");
                    setIsDrawerOpen(false);
                  }}>
                    Resolve Case
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
}
