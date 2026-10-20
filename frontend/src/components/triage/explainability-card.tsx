import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { TriageResult } from "@/lib/triage/engine";
import { Info } from "lucide-react";

interface ExplainabilityCardProps {
  result: TriageResult;
}

export function ExplainabilityCard({ result }: ExplainabilityCardProps) {
  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50 border-b pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">Why this priority?</CardTitle>
            <div className="text-sm text-muted-foreground mt-1">Rule profile: <span className="font-mono">{result.rule_version}</span></div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold tracking-tight text-slate-900">{result.score} <span className="text-sm font-normal text-muted-foreground">/ 100</span></div>
            <PriorityBadge priority={result.priority} className="mt-1" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {result.factors.map((factor, idx) => (
            <div key={idx} className="p-4 flex justify-between items-start hover:bg-slate-50 transition-colors">
              <div>
                <div className="font-medium text-slate-900 text-sm">{factor.factor_name}</div>
                <div className="text-xs text-muted-foreground mt-1">{factor.reason}</div>
              </div>
              <div className="font-mono text-sm font-semibold text-primary">
                +{factor.contribution}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-blue-50/50 border-t p-3 flex items-start gap-2 text-xs text-blue-800">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
          <p>Initial triage suggestion — clinician review required.</p>
        </div>
      </CardContent>
    </Card>
  );
}
