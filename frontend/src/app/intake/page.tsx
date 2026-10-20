"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Mic, MicOff, UploadCloud, AlertCircle, ArrowRight, Activity,
  CheckCircle2, User, Stethoscope, Clock, ShieldCheck,
  ChevronRight, Loader2, Image as ImageIcon, X, Trash2, Volume2
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

interface AttachedImage {
  dataUrl: string;
  name: string;
  size: string;
}

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
    tips: ["Speak or type your symptoms freely", "Attach a photo of rash, swelling, or wound", "Include when the symptoms began"],
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

  // Voice Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Medical Image Upload State
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

  const updateData = (field: keyof IntakeData, value: string) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const handleNext = () => { if (currentStep < 4) setCurrentStep((p) => p + 1); };
  const handleBack = () => { if (currentStep > 1) setCurrentStep((p) => p - 1); };

  // ─── Real Speech-to-Text via Web Speech API ───
  const startListening = () => {
    setSpeechError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not supported in this browser. Please type your symptoms.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalChunk = "";
        let interimChunk = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript;
          } else {
            interimChunk += event.results[i][0].transcript;
          }
        }

        if (finalChunk) {
          setData((prev) => ({
            ...prev,
            symptoms: prev.symptoms ? `${prev.symptoms} ${finalChunk.trim()}` : finalChunk.trim(),
          }));
        }
        setInterimTranscript(interimChunk);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setSpeechError("Microphone permission was denied. Please allow microphone access in your browser.");
        } else if (event.error !== "no-speech") {
          setSpeechError(`Voice error: ${event.error}. You can also type your symptoms.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript("");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("Failed to start speech recognition:", err);
      setSpeechError("Could not access microphone.");
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
  };

  const toggleRecording = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // ─── Real Image Upload Handling ───
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert("Image size exceeds 8MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const sizeKB = Math.round(file.size / 1024);
      const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
      setAttachedImage({
        dataUrl: result,
        name: file.name,
        size: sizeStr,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // ─── Intake Submission to SQLite ───
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
          medicalImage: attachedImage?.dataUrl || null,
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
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12">
              <div className="bg-white/20 p-2 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">MediSync</span>
            </div>

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
            {/* Step indicator */}
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

                  {/* ── Step 2: Symptoms & Real Voice / Image ── */}
                  {currentStep === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
                      <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-900">Describe Your Symptoms</h1>
                        <p className="text-muted-foreground mt-1">Be as specific as possible — type or speak your symptoms and attach an optional photo.</p>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-white rounded-xl border p-6 shadow-sm space-y-5">
                          {/* Symptoms text area with real voice button */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label className="text-sm font-semibold text-slate-700">What are your symptoms?</Label>
                              <Button
                                type="button"
                                variant={isListening ? "destructive" : "outline"}
                                size="sm"
                                className={`h-8 gap-1.5 rounded-full text-xs font-semibold transition-all ${
                                  isListening
                                    ? "bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-md"
                                    : "border-primary text-primary hover:bg-primary/5"
                                }`}
                                onClick={toggleRecording}
                              >
                                {isListening ? (
                                  <>
                                    <MicOff className="h-3.5 w-3.5" />
                                    <span>Stop Voice</span>
                                  </>
                                ) : (
                                  <>
                                    <Mic className="h-3.5 w-3.5" />
                                    <span>Speak Symptoms</span>
                                  </>
                                )}
                              </Button>
                            </div>

                            {/* Active listening banner */}
                            {isListening && (
                              <div className="flex items-center justify-between gap-3 text-xs text-red-700 bg-red-50 px-4 py-2.5 rounded-lg border border-red-200 animate-in fade-in">
                                <div className="flex items-center gap-2">
                                  <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
                                  </span>
                                  <span className="font-semibold">Microphone active — Listening to your speech...</span>
                                </div>
                                <span className="text-[11px] text-red-500 font-mono">Speak clearly</span>
                              </div>
                            )}

                            {speechError && (
                              <div className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                                {speechError}
                              </div>
                            )}

                            <textarea
                              className="flex min-h-[140px] w-full rounded-lg border border-input bg-slate-50 px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                              placeholder="e.g. I have been having sharp chest pain for the past 2 hours, along with difficulty breathing…"
                              value={data.symptoms}
                              onChange={(e) => updateData("symptoms", e.target.value)}
                            />

                            {/* Interim real-time speech preview */}
                            {isListening && interimTranscript && (
                              <p className="text-xs text-slate-500 italic px-1">
                                Recognizing: &ldquo;{interimTranscript}&rdquo;
                              </p>
                            )}
                          </div>

                          {/* Duration */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              How long have you had these symptoms?
                            </Label>
                            <Input
                              placeholder="e.g. 2 days, since this morning, about an hour"
                              value={data.duration}
                              onChange={(e) => updateData("duration", e.target.value)}
                              className="h-11 text-base"
                            />
                          </div>
                        </div>

                        {/* ─── Real Image Upload Dropzone ─── */}
                        <div className="space-y-3">
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/png, image/jpeg, image/jpg, image/webp"
                            className="hidden"
                            onChange={handleFileChange}
                          />

                          {!attachedImage ? (
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              className={`bg-white rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer group ${
                                isDragging
                                  ? "border-primary bg-primary/10 scale-[1.01]"
                                  : "border-slate-200 hover:border-primary/50 hover:bg-primary/5"
                              }`}
                            >
                              <div className="h-12 w-12 bg-slate-100 group-hover:bg-primary/10 rounded-full flex items-center justify-center transition-colors">
                                <UploadCloud className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-800">
                                  {isDragging ? "Drop your image here" : "Attach a Medical Image (Optional)"}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  Upload photo of rash, eye, wound, or test result (PNG, JPG, WEBP up to 8MB)
                                </div>
                              </div>
                              <Button type="button" variant="outline" size="sm" className="text-xs pointer-events-none">
                                Browse from device
                              </Button>
                            </div>
                          ) : (
                            <div className="bg-white rounded-xl border p-4 shadow-sm flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={attachedImage.dataUrl}
                                  alt="Attached medical preview"
                                  className="h-14 w-14 rounded-lg object-cover border bg-slate-100 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-slate-900 truncate">
                                    {attachedImage.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                    <span>{attachedImage.size}</span>
                                    <span>·</span>
                                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3" /> Attached
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setAttachedImage(null)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9 px-3 gap-1.5 shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Remove</span>
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between">
                          <Button variant="ghost" size="lg" onClick={handleBack} className="h-12">
                            Back
                          </Button>
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
                              &ldquo;{data.symptoms}&rdquo;
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Duration:</span>
                              <span className="font-medium text-slate-900">{data.duration || "Not specified"}</span>
                            </div>

                            {/* Attached image review */}
                            {attachedImage && (
                              <div className="pt-2 border-t">
                                <span className="text-xs font-semibold text-slate-600 block mb-2">Attached Medical Image:</span>
                                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border w-fit">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={attachedImage.dataUrl}
                                    alt="Review attached image"
                                    className="h-12 w-12 rounded object-cover border bg-white"
                                  />
                                  <span className="text-xs text-slate-700 font-medium">{attachedImage.name}</span>
                                </div>
                              </div>
                            )}
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
                          <Button variant="ghost" size="lg" onClick={handleBack} disabled={isProcessing} className="h-12">
                            Back
                          </Button>
                          <Button size="lg" onClick={handleSubmit} disabled={isProcessing} className="h-12 px-8 text-base gap-2 relative overflow-hidden group">
                            {isProcessing ? (
                              <><Loader2 className="h-4 w-4 animate-spin" /> Processing Triage…</>
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
                            <p className="text-sm text-slate-600 mt-0.5">Your case has been recorded into SQLite and added to the doctor's queue.</p>
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
                              "Your case is live on the doctor dashboard queue",
                              "A clinician will inspect your symptoms and attached image",
                              "You will be called as soon as your triage case is reviewed",
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
