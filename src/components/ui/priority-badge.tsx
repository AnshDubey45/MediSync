import React from "react";
import { AlertCircle, AlertTriangle, Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type PriorityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

interface PriorityBadgeProps {
  priority: PriorityLevel;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = {
    CRITICAL: {
      color: "bg-red-100 text-red-800 border-red-200",
      icon: AlertCircle,
      label: "Critical"
    },
    HIGH: {
      color: "bg-amber-100 text-amber-800 border-amber-200",
      icon: AlertTriangle,
      label: "High"
    },
    MEDIUM: {
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: Info,
      label: "Medium"
    },
    LOW: {
      color: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: ShieldCheck,
      label: "Low"
    }
  };

  const { color, icon: Icon, label } = config[priority];

  return (
    <div className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", color, className)}>
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </div>
  );
}
