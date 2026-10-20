"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Mic, UploadCloud, AlertCircle, ArrowRight, Activity,
  CheckCircle2, User, Stethoscope, Clock, ShieldCheck,
  ChevronRight, Loader2
} from "lucide-react";
import Link from "next/link";
import { calculateTriage, TriageResult } from "@/lib/triage/engine";
import { ExplainabilityCard } from "@/components/triage/explainability-card";
import { PriorityBadge } from "@/components/ui/priority-badge";

type IntakeData = {
  fullName: string;
  age: string;
  conditions: string;
  symptoms: string;
  duration: string;
};

const STEPS = [
  { label: "Basic Info", icon: User },
  { label: "Symptoms", icon: Stethoscope },
  { label: "Review", icon: ShieldCheck },
  { label: "Results", icon: CheckCircle2 },
];

const LEFT_PANEL_CONTENT = [
  {
    step: 1,
    title: "Patient Information",
    subtitle: "We collect your basic info to personalize your care experience.",
    tips: ["All information is handled securely", "Your data is only visible to your care team", "Takes less than 2 minutes to complete"],
  },
  {
    step: 2,
    title: "Describe Your Symptoms",
    subtitle: "The more detail you provide, the better your triage result.",
    tips: ["Be specific about pain location", "Include any recent changes in condition", "You can speak or type your symptoms"],
  },
  {
    step: 3,
    title: "Review & Submit",
    subtitle: "Check your details carefully before submitting to the queue.",
    tips: ["Your case will be added to the live queue", "A clinician will review the triage suggestion", "Keep your case reference number handy"],
  },
  {
    step: 4,
    title: "Triage Complete",
    subtitle: "Your case has been analyzed and added to the doctor's queue.",
    tips: ["A doctor will review your case shortly", "Priority is a suggestion — clinician decides final care", "You may be contacted for more information"],
  },
];

export default function IntakePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<IntakeData>({
    fullName: "", age: "", conditions: "", symptoms: "", duration: "",
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

  const updateData = (field: keyof IntakeData, value: string) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const handleNext = () => { if (currentStep < 4) setCurrentStep((p) => p + 1); };
  const handleBack = () => { if (currentStep > 1) setCurrentStep((p) => p - 1); };

  const handleSubmit = async () => {
    setIsProcessing(true);
    const result = calculateTriage({
      age: parseInt(data.age) || 30,
      symptoms: data.symptoms,
      duration: data.duration,
      conditions: data.conditions,
    });
    const newCaseId = `MS-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName,
          age: data.age,
          conditions: data.conditions,
          symptoms: data.symptoms,
          duration: data.duration,
          score: result.score,
          priority: result.priority,
          factors: result.factors,
          caseReference: newCaseId,
        }),
      });
      const res = await response.json();
      if (!res.success) {
        console.error("API error:", res.error);
      }
    } catch (err) {
      console.error("Error submitting triage to SQLite:", err);
    }
    setTriageResult(result);
    setCaseId(newCaseId);
    setIsProcessing(false);
    setCurrentStep(4);
  };

  const toggleRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      updateData("symptoms", data.symptoms + (data.symptoms ? " " : "") + "I've been experiencing a severe chest pain and some shortness of breath since yesterday morning.");
      setIsRecording(false);
    }, 3000);
  };

  const leftContent = LEFT_PANEL_CONTENT[currentStep - 1];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Nav Bar */}
      <header className="border-b bg-white px-6 h-14 flex items-center justify-between shrink-0 z-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary/10 p-1 rounded-md">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-slate-900 text-sm">MediSync</span>
        </Link>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-green-500" />
          <span>Secure & Encrypted</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ─── Left Panel ─── */}
        <div className="hidden lg:flex w-[380px] xl:w-[420px] shrink-0 bg-gradient-to-br from-primary to-blue-700 flex-col justify-between p-10 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          {/* Logo area */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12">
              <div className="bg-white/20 p-2 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">MediSync</span>
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
              >
                <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1 text-white/80 text-xs font-medium mb-6">
                  Step {currentStep} of 4
                </div>
                <h2 className="text-2xl font-bold text-white mb-3 leading-tight">{leftContent.title}</h2>
                <p className="text-blue-100 text-sm leading-relaxed mb-8">{leftContent.subtitle}</p>

                <div className="space-y-3">
                  {leftContent.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 h-5 w-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                      <p className="text-blue-100 text-sm">{tip}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Step dots */}
          <div className="relative z-10 flex gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i + 1 === currentStep ? "bg-white w-6" : i + 1 < currentStep ? "bg-white/60 w-4" : "bg-white/25 w-4"}`}
              />
            ))}
          </div>
        </div>

        {/* ─── Right Panel (Form Area) ─── */}
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full flex flex-col">
            {/* Step indicator (mobile + desktop top) */}
            <div className="border-b bg-white px-6 py-4">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between">
                  {STEPS.map((step, i) => {
                    const Icon = step.icon;
                    const isActive = i + 1 === currentStep;
                    const isDone = i + 1 < currentStep;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive ? "text-primary" : isDone ? "text-green-600" : "text-slate-400"}`}>
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all ${isActive ? "border-primary bg-primary text-white" : isDone ? "border-green-500 bg-green-500 text-white" : "border-slate-200 bg-white text-slate-400"}`}>
                            {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                          </div>
                          <span className="hidden sm:inline">{step.label}</span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <ChevronRight className="h-4 w-4 text-slate-300 mx-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Form content */}
            <div className="flex-1 px-6 py-8">
              <div className="max-w-2xl mx-auto">
                <AnimatePresence mode="wait">

                  {/* ── Step 1: Basic Info ── */}
                  {currentStep === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
                      <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-900">Patient Information</h1>
                        <p className="text-muted-foreground mt-1">Please provide your basic details to begin intake.</p>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-white rounded-xl border p-6 shadow-sm space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-sm font-semibold text-slate-700">Full Name</Label>
                            <Input id="fullName" placeholder="e.g. John Doe" value={data.fullName} onChange={(e) => updateData("fullName", e.target.value)} className="h-11 text-base" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="age" className="text-sm font-semibold text-slate-700">Age</Label>
                            <Input id="age" type="number" placeholder="e.g. 45" value={data.age} onChange={(e) => updateData("age", e.target.value)} className="h-11 text-base" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="conditions" className="text-sm font-semibold text-slate-700">
                              Existing Conditions
                              <Badge variant="outline" className="ml-2 font-normal text-xs">Optional</Badge>
                            </Label>
                            <Input id="conditions" placeholder="e.g. Asthma, Hypertension, Diabetes" value={data.conditions} onChange={(e) => updateData("conditions", e.target.value)} className="h-11 text-base" />
                            <p className="text-xs text-muted-foreground">Separate multiple conditions with a comma.</p>
                          </div>
                        </div>

                        {/* Privacy note */}
                        <div className="flex items-start gap-3 bg-blue-50 rounded-lg p-4 border border-blue-100">
                          <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <p className="text-sm text-blue-800">Your information is securely submitted and only accessible to your assigned care team.</p>
                        </div>

                        <div className="flex justify-end">
                          <Button size="lg" onClick={handleNext} disabled={!data.fullName || !data.age} className="h-12 px-8 text-base gap-2">
                            Continue <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 2: Symptoms ── */}
                  {currentStep === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
                      <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-900">Describe Your Symptoms</h1>
                        <p className="text-muted-foreground mt-1">Be as specific as possible — it helps the triage engine give an accurate result.</p>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-white rounded-xl border p-6 shadow-sm space-y-5">
                          {/* Symptoms */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label className="text-sm font-semibold text-slate-700">What are your symptoms?</Label>
                              <Button
                                variant={isRecording ? "destructive" : "outline"}
                                size="sm"
                                className={`h-8 gap-1.5 rounded-full text-xs font-medium ${isRecording ? "" : "border-primary text-primary hover:bg-primary/5"}`}
                                onClick={toggleRecording}
                              >
                                <Mic className={`h-3.5 w-3.5 ${isRecording ? "animate-pulse" : ""}`} />
                                {isRecording ? "Listening…" : "Use Voice"}
                              </Button>
                            </div>
                            {isRecording && (
                              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-200">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                </span>
                                Recording… speak clearly
                              </div>
                            )}
                            <textarea
                              className="flex min-h-[140px] w-full rounded-lg border border-input bg-slate-50 px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              placeholder="e.g. I have been having sharp chest pain for the past 2 hours, along with difficulty breathing…"
                              value={data.symptoms}
                              onChange={(e) => updateData("symptoms", e.target.value)}
                            />
                          </div>

                          {/* Duration */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              How long have you had these symptoms?
                            </Label>
                            <Input placeholder="e.g. 2 days, since this morning, about an hour" value={data.duration} onChange={(e) => updateData("duration", e.target.value)} className="h-11 text-base" />
                          </div>
                        </div>

                        {/* Image Upload */}
                        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center gap-3 hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer group">
                          <div className="h-12 w-12 bg-slate-100 group-hover:bg-primary/10 rounded-full flex items-center justify-center transition-colors">
                            <UploadCloud className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-700">Attach a Medical Image</div>
                            <div className="text-xs text-slate-500 mt-0.5">Optional — PNG, JPG up to 5MB</div>
                          </div>
                          <Badge variant="outline" className="text-xs font-normal">Click or drag & drop</Badge>
                        </div>

                        <div className="flex justify-between">
                          <Button variant="ghost" size="lg" onClick={handleBack} className="h-12">Back</Button>
                          <Button size="lg" onClick={handleNext} disabled={!data.symptoms} className="h-12 px-8 text-base gap-2">
                            Review Case <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 3: Review ── */}
                  {currentStep === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
                      <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-900">Review Your Case</h1>
                        <p className="text-muted-foreground mt-1">Please confirm your details before submitting for triage.</p>
                      </div>

                      <div className="space-y-5">
                        {/* Patient details */}
                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                          <div className="bg-slate-50 border-b px-6 py-3 flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-semibold text-slate-700">Patient Details</span>
                          </div>
                          <div className="p-6 grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Full Name</div>
                              <div className="font-semibold text-slate-900">{data.fullName}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Age</div>
                              <div className="font-semibold text-slate-900">{data.age} years old</div>
                            </div>
                            {data.conditions && (
                              <div className="col-span-2">
                                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Existing Conditions</div>
                                <div className="font-semibold text-slate-900">{data.conditions}</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Symptoms */}
                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                          <div className="bg-slate-50 border-b px-6 py-3 flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-semibold text-slate-700">Reported Symptoms</span>
                          </div>
                          <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-700 leading-relaxed italic bg-blue-50 rounded-lg p-4 border border-blue-100">
                              "{data.symptoms}"
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Duration:</span>
                              <span className="font-medium text-slate-900">{data.duration || "Not specified"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Disclaimer */}
                        <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-xl border border-amber-200">
                          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-sm text-amber-800">
                            <strong>Important:</strong> The triage result is an initial suggestion — a clinician will make the final clinical decision. If you are experiencing an emergency, call emergency services immediately.
                          </p>
                        </div>

                        <div className="flex justify-between">
                          <Button variant="ghost" size="lg" onClick={handleBack} disabled={isProcessing} className="h-12">Back</Button>
                          <Button size="lg" onClick={handleSubmit} disabled={isProcessing} className="h-12 px-8 text-base gap-2 relative overflow-hidden group">
                            {isProcessing ? (
                              <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                            ) : (
                              <>Submit Case <ArrowRight className="h-4 w-4" /></>
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 4: Results ── */}
                  {currentStep === 4 && (
                    <motion.div key="step4" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
                      <div className="space-y-6">
                        {/* Success Banner */}
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-5">
                          <div className="h-14 w-14 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-7 w-7 text-green-600" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-slate-900">Triage Complete</h2>
                            <p className="text-sm text-slate-600 mt-0.5">Your case has been submitted and added to the doctor's priority queue.</p>
                          </div>
                        </div>

                        {/* Case Reference + Priority */}
                        <div className="bg-white rounded-xl border shadow-sm p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Case Reference</div>
                              <div className="text-3xl font-mono font-bold tracking-widest text-slate-900">{caseId}</div>
                            </div>
                            {triageResult && (
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Initial Priority</div>
                                <PriorityBadge priority={triageResult.priority} />
                                <div className="text-sm text-muted-foreground mt-1.5">Score: <span className="font-bold text-slate-900">{triageResult.score}/100</span></div>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground bg-amber-50 rounded-md p-3 border border-amber-100">
                            Initial triage suggestion — clinician review required before any treatment decision.
                          </div>
                        </div>

                        {/* Explainability */}
                        {triageResult && <ExplainabilityCard result={triageResult} />}

                        {/* Next Steps */}
                        <div className="bg-white rounded-xl border shadow-sm p-6">
                          <h3 className="font-semibold text-slate-900 mb-4">What happens next?</h3>
                          <div className="space-y-3">
                            {[
                              "Your case has been added to the real-time doctor queue",
                              "A clinician will review your triage result and symptoms",
                              "You will be called when a doctor is ready to see you",
                            ].map((step, i) => (
                              <div key={i} className="flex items-start gap-3">
                                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
                                <p className="text-sm text-slate-700">{step}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-3 justify-center">
                          <Link href="/"><Button variant="outline" size="lg">Return Home</Button></Link>
                          <Link href="/intake"><Button size="lg">New Intake</Button></Link>
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
