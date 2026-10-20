"use client";

import Link from "next/link";
import { ArrowRight, Activity, Clock, ShieldCheck, Stethoscope, Users, Zap, CheckCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const FLOW_STEPS = [
  { step: "01", label: "Patient Intake", desc: "Patient fills out basic info and describes symptoms via text or voice.", color: "from-blue-500 to-blue-600" },
  { step: "02", label: "Triage Engine", desc: "Rules-based engine scores symptoms against clinical risk factors.", color: "from-violet-500 to-violet-600" },
  { step: "03", label: "Priority Score", desc: "A 0–100 score is generated with an explainable factor breakdown.", color: "from-amber-500 to-orange-500" },
  { step: "04", label: "Doctor Queue", desc: "Case appears live on the doctor dashboard — sorted by priority.", color: "from-emerald-500 to-green-600" },
];

const FEATURES = [
  {
    icon: Stethoscope,
    title: "Explainable Triage",
    desc: "Every triage result includes a clear 'Why this priority?' breakdown — no black-box decisions.",
    accent: "bg-blue-100 text-blue-600",
  },
  {
    icon: Zap,
    title: "Real-Time Queue",
    desc: "New cases appear instantly on the doctor dashboard using Supabase Realtime websockets.",
    accent: "bg-violet-100 text-violet-600",
  },
  {
    icon: ShieldCheck,
    title: "Secure by Design",
    desc: "Row-level security, encrypted in transit, and accessible only to the assigned care team.",
    accent: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: Users,
    title: "Dual Interface",
    desc: "Separate optimised UIs for patients (intake) and clinicians (operations dashboard).",
    accent: "bg-amber-100 text-amber-600",
  },
  {
    icon: Clock,
    title: "Wait Time Tracking",
    desc: "Dynamic wait time display on the queue, updated in real time as cases are resolved.",
    accent: "bg-rose-100 text-rose-600",
  },
  {
    icon: Activity,
    title: "Priority Badges",
    desc: "Colour-coded CRITICAL / HIGH / MEDIUM / LOW badges give doctors instant visual signals.",
    accent: "bg-sky-100 text-sky-600",
  },
];

const STATS = [
  { value: "< 2 min", label: "Intake completion time" },
  { value: "4-level", label: "Priority classification" },
  { value: "100%", label: "Explainable results" },
  { value: "Live", label: "Real-time queue sync" },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">MediSync</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a>
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-primary font-medium">Doctor Login</Button>
            </Link>
            <Link href="/intake">
              <Button size="sm" className="shadow-sm gap-1.5">Start Intake <ChevronRight className="h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden bg-white">
          {/* Gradient blobs */}
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

          <div className="container mx-auto px-6 pt-20 pb-24 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  Live · Real-Time Triage Ecosystem
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }}
                className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight"
              >
                From symptom<br className="hidden md:block" />
                <span className="text-primary"> to priority.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.2 }}
                className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              >
                MediSync streamlines patient intake and gives care teams a clear, explainable priority queue — without the waiting-room guesswork.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.3 }}
                className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link href="/intake">
                  <Button size="lg" className="h-12 px-8 text-base shadow-md group gap-2 relative overflow-hidden">
                    <span className="relative z-10 flex items-center gap-2">
                      Start Patient Intake
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                    View Doctor Dashboard
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Stats strip */}
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 rounded-2xl overflow-hidden border shadow-sm max-w-3xl mx-auto"
            >
              {STATS.map((s) => (
                <div key={s.label} className="bg-white px-6 py-5 text-center">
                  <div className="text-2xl font-extrabold text-primary">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section id="how-it-works" className="py-24 bg-slate-50 border-t">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">How MediSync Works</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">Four steps from symptom to doctor — in under two minutes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {FLOW_STEPS.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.1 }}
                >
                  <div className="bg-white rounded-2xl border p-6 h-full shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color}`} />
                    <div className="text-5xl font-black text-slate-100 group-hover:text-slate-200 transition-colors mb-4 select-none">{item.step}</div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">{item.label}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    {i < FLOW_STEPS.length - 1 && (
                      <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full h-6 w-6 items-center justify-center shadow-sm">
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Features ─── */}
        <section id="features" className="py-24 bg-white border-t">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Built for Modern Clinical Operations</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">Every feature designed with speed, transparency, and safety in mind.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.07 }}
                    className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group"
                  >
                    <div className={`h-11 w-11 rounded-xl ${f.accent} flex items-center justify-center mb-4`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── CTA Banner ─── */}
        <section className="py-20 bg-gradient-to-br from-primary to-blue-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(255,255,255,0.08)_0%,_transparent_70%)] pointer-events-none" />
          <div className="container mx-auto px-6 text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 bg-white/15 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                <CheckCircle className="h-4 w-4" /> Clinician review required for all results
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Ready to streamline your intake?</h2>
              <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">Experience the full triage flow from patient submission to doctor queue in under two minutes.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/intake">
                  <Button size="lg" className="h-12 px-8 bg-white text-primary hover:bg-slate-100 shadow-lg text-base gap-2">
                    Start Patient Intake <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="h-12 px-8 border-white/30 text-white hover:bg-white/10 text-base">
                    Doctor Dashboard
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1 rounded-md">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-slate-900">MediSync</span>
          </div>
          <p className="text-sm text-muted-foreground">Initial triage suggestion — clinician review required before any treatment decision.</p>
          <div className="flex gap-5 text-sm font-medium">
            <Link href="/intake" className="text-primary hover:underline">Patient Intake</Link>
            <Link href="/dashboard" className="text-primary hover:underline">Doctor Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
