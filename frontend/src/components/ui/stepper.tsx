import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full max-w-3xl mx-auto", className)}>
      <div className="relative flex justify-between items-center">
        {/* Connecting line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-slate-100 -z-10" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary transition-all duration-300 ease-in-out -z-10" 
          style={{ width: `${(Math.max(0, currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={step} className="flex flex-col items-center gap-2 bg-background px-2">
              <div 
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors duration-300",
                  isCompleted ? "border-primary bg-primary text-primary-foreground" : 
                  isCurrent ? "border-primary text-primary bg-primary/10" : 
                  "border-muted bg-background text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
              </div>
              <span 
                className={cn(
                  "text-xs font-medium hidden sm:block absolute mt-10 w-24 text-center",
                  isCurrent ? "text-slate-900" : "text-muted-foreground"
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
      {/* Spacer for the absolute positioned labels on mobile */}
      <div className="h-6 sm:h-8" />
    </div>
  );
}
