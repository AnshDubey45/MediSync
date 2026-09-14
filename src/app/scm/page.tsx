"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity, GitBranch, GitCommit, GitMerge, FileCode, CheckCircle2, Server, ArrowRight } from "lucide-react";

// Mock Data for CIs
const CONFIGURATION_ITEMS = [
  { id: "CI-APP-001", file: ".env.example", module: "Runtime Config", version: "v2.1", owner: "Platform Team", status: "Approved", baseline: "baseline-04", lastModified: "2 hours ago" },
  { id: "CI-TRIAGE-001", file: "ai_scoring_rules.json", module: "Triage Engine", version: "v1.4", owner: "Ansh Dubey", status: "Approved", baseline: "baseline-04", lastModified: "Sep 12" },
  { id: "CI-SPEECH-001", file: "whisper_params.yaml", module: "Voice UI", version: "v1.1", owner: "Frontend Team", status: "Reviewing", baseline: "baseline-03", lastModified: "Yesterday" },
  { id: "CI-PROXY-001", file: "nginx.conf", module: "Deployment", version: "v1.0", owner: "DevOps", status: "Approved", baseline: "baseline-04", lastModified: "Sep 10" },
  { id: "CI-DB-001", file: "database_schema.sql", module: "Database", version: "v3.0", owner: "Data Team", status: "Approved", baseline: "baseline-04", lastModified: "Sep 05" },
];

const WORKFLOW_STEPS = ["MODIFY", "COMMIT", "VERSION", "REVIEW", "APPROVE", "BASELINE", "MERGE", "DEPLOY"];

export default function SCMScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white px-6 h-16 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-semibold text-slate-900">MediSync</span>
          </Link>
          <div className="h-4 w-px bg-slate-200 mx-2"></div>
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <GitBranch className="h-4 w-4" />
            <span>Configuration Control</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary">
            Return to Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl space-y-8 animate-in fade-in duration-500">
        
        {/* Page Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">SCM Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track controlled artifacts, changes, and approved baselines.</p>
          </div>
          <div className="flex items-center gap-3 bg-white border px-4 py-2 rounded-lg shadow-sm">
            <Server className="h-4 w-4 text-green-500" />
            <div className="text-sm">
              <span className="text-slate-500 mr-2">Production:</span>
              <span className="font-semibold text-slate-900">Operational</span>
            </div>
            <div className="h-4 w-px bg-slate-200 mx-2"></div>
            <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">v1.4.2</span>
          </div>
        </div>

        {/* Change Control Workflow Visualization */}
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <GitMerge className="h-4 w-4 text-primary" />
              Standard Configuration Control Workflow
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-2 text-xs md:text-sm font-semibold text-slate-600">
              {WORKFLOW_STEPS.map((step, idx) => (
                <React.Fragment key={step}>
                  <div className={`flex items-center justify-center px-3 py-1.5 rounded-full border ${idx === 5 ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200'}`}>
                    {step}
                  </div>
                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-slate-300 hidden md:block shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content: CI Table & Baselines */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Configuration Items (CI)</CardTitle>
                <CardDescription>Controlled artifacts currently tracked in Sapling repository.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Configuration ID</TableHead>
                      <TableHead>Artifact</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Baseline</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {CONFIGURATION_ITEMS.map((ci) => (
                      <TableRow key={ci.id}>
                        <TableCell className="font-mono text-xs text-slate-500">{ci.id}</TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-900 flex items-center gap-2">
                            <FileCode className="h-4 w-4 text-muted-foreground" />
                            {ci.file}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{ci.module}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{ci.version}</TableCell>
                        <TableCell>
                          <Badge variant={ci.status === "Approved" ? "default" : "secondary"} className={ci.status === "Approved" ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200" : ""}>
                            {ci.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-primary bg-primary/5 px-2 py-1 rounded inline-block mt-2 border border-primary/10">
                          {ci.baseline}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Change Requests */}
            <Card className="border shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
              <CardHeader>
                <CardTitle>Active Change Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between border rounded-lg p-4 bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-slate-900">CR-042</span>
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Under Review</Badge>
                    </div>
                    <p className="text-sm font-medium text-slate-700">Update critical symptom threshold</p>
                    <div className="text-xs text-muted-foreground mt-2 grid grid-cols-2 gap-4 max-w-sm">
                      <div><span className="font-semibold">Target CI:</span> ai_scoring_rules.json</div>
                      <div><span className="font-semibold">Requested By:</span> Ansh</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="text-xs bg-white border shadow-sm px-3 py-1.5 rounded-md font-medium text-primary hover:bg-slate-50 transition-colors">Review CR</button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar: Timeline & Repository Status */}
          <div className="space-y-8">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Repository Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-muted-foreground">SCM Engine</span>
                  <span className="font-medium text-slate-900 flex items-center gap-1"><GitBranch className="h-3 w-3"/> Sapling</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-muted-foreground">Active Branch</span>
                  <span className="font-mono font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">main</span>
                </div>
                <div className="flex justify-between items-center text-sm pb-2">
                  <span className="text-muted-foreground">Working Tree</span>
                  <span className="font-medium text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Clean</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Commit History (Sapling Log)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-white p-3 rounded-lg border shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <GitCommit className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-xs text-slate-500">fac14f3</span>
                      </div>
                      <p className="text-sm text-slate-900 font-medium">feat: implement Phase 3 Triage Engine</p>
                    </div>
                  </div>
                  
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-slate-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-white p-3 rounded-lg border shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-2 mb-1">
                        <GitCommit className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-xs text-slate-500">ddf0ec3</span>
                      </div>
                      <p className="text-sm text-slate-900 font-medium">feat: implement Phase 2 Patient Intake</p>
                    </div>
                  </div>

                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-slate-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-white p-3 rounded-lg border shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-2 mb-1">
                        <GitCommit className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-xs text-slate-500">5159fc0</span>
                      </div>
                      <p className="text-sm text-slate-900 font-medium">feat: initialize nextjs, design system</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
