"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Stepper } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic, UploadCloud, AlertCircle, ArrowRight, Activity } from "lucide-react";
import Link from "next/link";
import { calculateTriage, TriageResult } from "@/lib/triage/engine";
import { ExplainabilityCard } from "@/components/triage/explainability-card";
import { supabase } from "@/lib/supabase/client";

type IntakeData = {
  fullName: string;
  age: string;
  conditions: string;
  symptoms: string;
  duration: string;
};

const STEPS = ["Basic Info", "Symptoms", "Review", "Submitted"];

export default function IntakePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<IntakeData>({
    fullName: "",
    age: "",
    conditions: "",
    symptoms: "",
    duration: "",
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

  const updateData = (field: keyof IntakeData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    
    // 1. Calculate Triage locally
    const result = calculateTriage({
      age: parseInt(data.age) || 30,
      symptoms: data.symptoms,
      duration: data.duration,
      conditions: data.conditions
    });
    
    const newCaseId = `MS-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      // 2. Insert into Supabase (Patients)
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .insert({
          full_name: data.fullName,
          age: parseInt(data.age) || 30,
          conditions: data.conditions
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // 3. Insert into Supabase (Cases)
      const { error: caseError } = await supabase
        .from('cases')
        .insert({
          patient_id: patientData.id,
          case_reference: newCaseId,
          symptoms: data.symptoms,
          duration: data.duration,
          score: result.score,
          priority: result.priority,
          status: 'Waiting',
          triage_factors: result.factors
        });

      if (caseError) throw caseError;

    } catch (error) {
      console.error("Error submitting triage:", error);
      // In a real app, show error toast here
    }
    
    setTriageResult(result);
    setCaseId(newCaseId);
    setIsProcessing(false);
    setCurrentStep(4);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Mock transcription
      setTimeout(() => {
        updateData("symptoms", data.symptoms + (data.symptoms ? " " : "") + "I've been experiencing a severe chest pain and some shortness of breath since yesterday morning.");
        setIsRecording(false);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b bg-white px-4 h-16 flex items-center shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <span className="font-semibold text-slate-900">MediSync Patient Portal</span>
        </Link>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl flex flex-col">
        <div className="mb-8">
          <Stepper steps={STEPS} currentStep={currentStep} />
        </div>

        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Tell us a bit about yourself.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input 
                        id="fullName" 
                        placeholder="John Doe" 
                        value={data.fullName}
                        onChange={(e) => updateData("fullName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input 
                        id="age" 
                        type="number" 
                        placeholder="45"
                        value={data.age}
                        onChange={(e) => updateData("age", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="conditions">Existing Conditions (Optional)</Label>
                      <Input 
                        id="conditions" 
                        placeholder="e.g. Asthma, Hypertension"
                        value={data.conditions}
                        onChange={(e) => updateData("conditions", e.target.value)}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleNext} disabled={!data.fullName || !data.age}>
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle>Tell us what is happening</CardTitle>
                    <CardDescription>Describe your symptoms in detail. You can type or use voice.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="symptoms">Symptoms</Label>
                        <Button 
                          variant={isRecording ? "destructive" : "outline"}
                          size="sm"
                          className="h-8 rounded-full"
                          onClick={toggleRecording}
                        >
                          <Mic className={`h-4 w-4 mr-2 ${isRecording ? "animate-pulse" : ""}`} />
                          {isRecording ? "Listening..." : "Speak"}
                        </Button>
                      </div>
                      <textarea 
                        id="symptoms" 
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Describe what you're experiencing..."
                        value={data.symptoms}
                        onChange={(e) => updateData("symptoms", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">How long have you had these symptoms?</Label>
                      <Input 
                        id="duration" 
                        placeholder="e.g. 2 days, since this morning"
                        value={data.duration}
                        onChange={(e) => updateData("duration", e.target.value)}
                      />
                    </div>
                    
                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-2 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer">
                      <UploadCloud className="h-8 w-8 text-slate-400" />
                      <div className="text-sm font-medium text-slate-700">Attach Medical Image (Optional)</div>
                      <div className="text-xs text-slate-500">Drag & drop or click to upload. PNG, JPG up to 5MB.</div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="ghost" onClick={handleBack}>Back</Button>
                    <Button onClick={handleNext} disabled={!data.symptoms}>
                      Review Case <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle>Review Your Case</CardTitle>
                    <CardDescription>Please confirm your details before submitting for initial triage.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border">
                      <div>
                        <div className="text-muted-foreground mb-1">Patient</div>
                        <div className="font-medium text-slate-900">{data.fullName}, {data.age} yrs</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Conditions</div>
                        <div className="font-medium text-slate-900">{data.conditions || "None reported"}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-900 border-b pb-2">Reported Symptoms</h4>
                      <p className="text-sm text-slate-700 leading-relaxed bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                        "{data.symptoms}"
                      </p>
                      <div className="text-sm text-muted-foreground mt-2">
                        <span className="font-medium">Duration:</span> {data.duration || "Not specified"}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-amber-50 p-3 rounded-md border border-amber-200 text-amber-800 text-sm">
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                      <p>
                        <strong>Note:</strong> MediSync is an initial triage system. The priority generated is a suggestion and will be reviewed by a clinician. In case of an emergency, please call emergency services immediately.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="ghost" onClick={handleBack} disabled={isProcessing}>Back</Button>
                    <Button onClick={handleSubmit} disabled={isProcessing} className="relative overflow-hidden group">
                      {isProcessing ? "Processing Triage..." : "Submit Case"}
                      {!isProcessing && (
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="space-y-6">
                  <Card className="border shadow-sm overflow-hidden border-primary/20">
                    <div className="bg-primary/5 p-8 flex flex-col items-center text-center border-b border-primary/10">
                      <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-primary">
                        <Activity className="h-8 w-8" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">Triage Complete</h2>
                      <p className="text-muted-foreground max-w-sm">
                        Your case has been analyzed and added to the doctor's queue.
                      </p>
                    </div>
                    <CardContent className="p-8">
                      <div className="flex flex-col items-center gap-6">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">Case Reference</div>
                          <div className="text-2xl font-mono font-bold tracking-wider text-slate-900">{caseId}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {triageResult && (
                    <ExplainabilityCard result={triageResult} />
                  )}

                  <div className="flex justify-center mt-6">
                    <Link href="/">
                      <Button variant="outline">Return to Home</Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
