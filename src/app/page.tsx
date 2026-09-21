"use client";

import Link from "next/link";
import { ArrowRight, Activity, Clock, ShieldCheck, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <span className="font-semibold text-lg tracking-tight">MediSync</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#how-it-works" className="hover:text-primary transition-colors">How It Works</Link>
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="hidden sm:flex text-primary">Doctor Login</Button>
            </Link>
            <Link href="/intake">
              <Button className="shadow-sm">Start Intake</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
          
          <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary mb-6"
            >
              Prototype v2.0
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl text-slate-900"
            >
              From symptom to priority — <br className="hidden md:block" />
              <span className="text-primary">without the waiting-room guesswork.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl"
            >
              MediSync streamlines patient intake and gives care teams a clear, explainable priority queue.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row gap-4"
            >
              <Link href="/intake">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base shadow-sm group relative overflow-hidden">
                  <span className="relative z-10 flex items-center">
                    Start Patient Intake
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  {/* Subtle shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base">
                  View Doctor Dashboard
                </Button>
              </Link>
            </motion.div>

            {/* Workflow Visualization */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-20 w-full max-w-4xl mx-auto"
            >
              <Card className="border shadow-sm bg-white/50 backdrop-blur">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-medium text-slate-600">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        1
                      </div>
                      <span>Patient Intake</span>
                    </div>
                    <ArrowRight className="hidden md:block h-5 w-5 text-muted-foreground/50" />
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
                        2
                      </div>
                      <span>AI Triage</span>
                    </div>
                    <ArrowRight className="hidden md:block h-5 w-5 text-muted-foreground/50" />
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 border border-amber-200">
                        3
                      </div>
                      <span>Priority Score</span>
                    </div>
                    <ArrowRight className="hidden md:block h-5 w-5 text-muted-foreground/50" />
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200">
                        4
                      </div>
                      <span>Doctor Queue</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section id="features" className="py-24 bg-slate-50 border-t border-b">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Modern Clinical Operations</h2>
              <p className="mt-4 text-lg text-muted-foreground">Built for speed, transparency, and traceability.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="md:col-span-2 group hover:shadow-md transition-all duration-300 relative overflow-hidden bg-white">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-8 h-full flex flex-col justify-between">
                  <div>
                    <Stethoscope className="h-8 w-8 text-primary mb-4" />
                    <h3 className="text-xl font-bold text-slate-900">Explainable Triage Engine</h3>
                    <p className="mt-2 text-muted-foreground">
                      Our deterministic rules engine calculates priority scores based on clinical factors, providing clear "Why this priority?" explanations for every case.
                    </p>
                  </div>
                  <div className="mt-8 p-4 bg-slate-50 rounded-lg border text-sm font-mono text-slate-600">
                    Severity indicator &nbsp;&nbsp;&nbsp;+30<br/>
                    Duration &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+18<br/>
                    <span className="text-primary font-bold">Total Score &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;78 (HIGH)</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-md transition-all duration-300 relative overflow-hidden bg-white">
                <CardContent className="p-8 flex flex-col h-full">
                  <Clock className="h-8 w-8 text-primary mb-4" />
                  <h3 className="text-xl font-bold text-slate-900">Real-Time Queue</h3>
                  <p className="mt-2 text-muted-foreground">
                    New patient intakes appear instantly on the doctor's dashboard.
                  </p>
                  <div className="mt-auto pt-6">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                      </span>
                      Live Sync Active
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-3 group hover:shadow-md transition-all duration-300 bg-white">
                <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1">
                    <ShieldCheck className="h-8 w-8 text-primary mb-4" />
                    <h3 className="text-xl font-bold text-slate-900">Secure & Confidential</h3>
                    <p className="mt-2 text-muted-foreground">
                      Patient data is securely transmitted and immediately available to the care team, ensuring a seamless and confidential triage process.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-semibold text-slate-900">MediSync</span>
          </div>
          <div className="text-sm text-muted-foreground text-center md:text-left">
            <p>Initial triage suggestion — clinician review required.</p>
          </div>
          <div className="flex gap-4 text-sm font-medium">
            <Link href="/intake" className="text-primary hover:underline">Patient Demo</Link>
            <Link href="/dashboard" className="text-primary hover:underline">Doctor Demo</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
