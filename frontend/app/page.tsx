"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, BrainCircuit, CheckCircle2, FileSearch, Gauge, ShieldCheck, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

const metrics = [
  ["$18.7M", "modeled leakage identified"],
  ["42%", "faster executive review"],
  ["25", "seeded enterprise decisions"],
  ["99.9%", "target internal uptime"]
];

const features = [
  { icon: BrainCircuit, title: "Decision Intelligence", body: "Convert operational data into recommendations, trust scoring, and executive summaries." },
  { icon: ShieldCheck, title: "Silent Risk Detection", body: "Surface unstated compliance, vendor, workflow, and people-impact risks before scale." },
  { icon: Gauge, title: "What-If Forecasting", body: "Model cost saved, risk deltas, SLA impact, and customer impact across major scenarios." },
  { icon: Workflow, title: "Pilot Strategy", body: "Generate phased rollout plans with measurable control gates and accountable owners." }
];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 20 } }
};

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-8"
      >
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-300/25 bg-emerald-300/10 shadow-glow">
            <span className="h-4 w-4 rounded-md bg-gradient-to-br from-emerald-200 via-cyan-200 to-amber-200" />
          </span>
          <span className="font-semibold text-foreground">SureVision AI</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground transition-colors">
            Platform
          </a>
          <a href="#demo" className="hover:text-foreground transition-colors">
            Demo
          </a>
          <a href="#metrics" className="hover:text-foreground transition-colors">
            Metrics
          </a>
        </nav>
        <Button asChild variant="secondary" className="hover:scale-105 transition-transform">
          <Link href="/login">Sign in</Link>
        </Button>
      </motion.header>

      <section className="relative mx-auto grid min-h-[calc(100vh-84px)] max-w-7xl items-center gap-12 px-4 pb-12 pt-8 md:px-8 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl animate-pulse" />
        
        <motion.div 
          className="relative z-10"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUp} className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-emerald-100 hover:bg-white/10 transition-colors cursor-default">
            <CheckCircle2 className="h-4 w-4" />
            Enterprise AI for decisions, risks, and opportunity signals
          </motion.div>
          <motion.h1 variants={fadeUp} className="max-w-4xl text-5xl font-semibold tracking-normal text-foreground md:text-7xl bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
            SureVision AI
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Turn document extraction, workflow automation, reconciliation, and compliance data into board-ready decisions with risk alerts, predictive insights, and governed what-if simulations.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="hover:scale-105 transition-transform shadow-emerald-500/20 shadow-lg group">
              <Link href="/dashboard">
                Open Dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="hover:scale-105 transition-transform bg-white/5 backdrop-blur-sm border-white/10">
              <Link href="/analyze">Analyze Decision</Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div 
          id="demo" 
          className="relative z-10"
          initial={{ opacity: 0, x: 50, rotateY: 10 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          style={{ perspective: 1000 }}
        >
          <DashboardPreview />
        </motion.div>
      </section>

      <section id="metrics" className="border-y border-white/10 bg-black/40 backdrop-blur-md">
        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="mx-auto grid max-w-7xl gap-4 px-4 py-8 md:grid-cols-4 md:px-8"
        >
          {metrics.map(([value, label], index) => (
            <motion.div 
              variants={fadeUp}
              key={label} 
              className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-5 hover:border-emerald-500/50 transition-colors"
            >
              <p className="text-3xl font-semibold text-emerald-50">{value}</p>
              <p className="mt-2 text-sm text-slate-400">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-24 md:px-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">Executive-grade operating intelligence</p>
          <h2 className="mt-3 text-3xl font-semibold text-foreground md:text-5xl leading-tight">
            Built for banks, insurers, logistics teams, and enterprise ops.
          </h2>
        </div>
        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4"
        >
          {features.map((feature, i) => (
            <motion.div variants={fadeUp} key={feature.title} whileHover={{ y: -5 }}>
              <Card className="p-6 h-full bg-slate-900/50 border-white/10 hover:border-emerald-400/30 backdrop-blur-sm transition-all overflow-hidden relative group">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent group-hover:via-emerald-400/50 transition-all opacity-0 group-hover:opacity-100" />
                <feature.icon className="h-8 w-8 text-emerald-300 mb-6" />
                <h3 className="text-xl font-semibold text-slate-100">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{feature.body}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <footer className="border-t border-white/10 px-4 py-12 text-center text-sm text-slate-500 md:px-8 bg-black/40">
        <p>SureVision AI ships with RBAC, audit logs, export workflows, Gemini-backed intelligence, and Docker support.</p>
        <p className="mt-2 text-xs opacity-60">© 2026 SureVision AI. All rights reserved.</p>
      </footer>
    </main>
  );
}

function DashboardPreview() {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-3 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
      <div className="rounded-xl border border-white/10 bg-black/40 p-6 shadow-inner">
        <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Command Center</p>
            <p className="text-lg font-semibold text-slate-200 mt-1">Executive Decision Cockpit</p>
          </div>
          <motion.div 
            animate={{ opacity: [1, 0.5, 1] }} 
            transition={{ duration: 2, repeat: Infinity }}
            className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 flex items-center gap-2 text-xs font-medium text-emerald-300"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 blur-[1px]" />
            Live
          </motion.div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {["Risk 43", "Trust 87", "ROI 74"].map((item, i) => (
            <motion.div 
              key={item} 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 + (i * 0.1), type: "spring" }}
              className="rounded-xl border border-white/5 bg-white/5 p-4 relative overflow-hidden group hover:bg-white/10 transition-colors"
            >
              <div className="absolute -inset-2 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <p className="text-xs font-medium text-slate-400">{item.split(" ")[0]}</p>
              <p className="mt-2 text-3xl font-bold bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">{item.split(" ")[1]}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border border-white/5 bg-white/5 p-5">
            <div className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-200">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              Risk Trend
            </div>
            <div className="flex h-44 items-end gap-3 px-2">
              {[62, 58, 64, 51, 47, 43].map((height, index) => (
                <div key={index} className="flex flex-1 flex-col items-center justify-end gap-3 group">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.8 + (index * 0.1), duration: 0.8, type: "spring" }}
                    className="w-full rounded-md bg-gradient-to-t from-emerald-500/20 to-emerald-400/80 group-hover:brightness-125 transition-all" 
                  />
                  <span className="text-xs font-medium text-slate-500">{["J", "F", "M", "A", "M", "J"][index]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/5 p-5 flex flex-col">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-200">
              <FileSearch className="h-4 w-4 text-emerald-400" />
              Priority Signals
            </div>
            <div className="flex-1 flex flex-col justify-between">
              {["KYC backlog exceeds tolerance", "Vendor dependency concentration", "SLA penalty leakage"].map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + (i * 0.15) }}
                  key={item} 
                  className="rounded border border-white/5 bg-black/40 p-3 text-sm font-medium text-slate-300 flex items-start gap-3"
                >
                  <div className="mt-0.5 min-w-1.5 h-1.5 rounded-full bg-rose-400" />
                  {item}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
