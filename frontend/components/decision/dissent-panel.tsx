"use client";

import { useEffect, useState, FormEvent } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { ShieldAlert, Send } from "lucide-react";
import { useDissentStore } from "@/store/dissent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function DissentPanel({ decisionId, initialTrustScore }: { decisionId: string; initialTrustScore: number }) {
  const { trustScore, objections, loadObjections, submitObjection, loading } = useDissentStore();
  const [form, setForm] = useState({ category: "compliance", severity: "major", rationale: "" });
  
  useEffect(() => {
    useDissentStore.setState({ trustScore: initialTrustScore });
    void loadObjections(decisionId);
  }, [decisionId, initialTrustScore, loadObjections]);

  const animatedScore = useSpring(initialTrustScore, { stiffness: 50, damping: 20 });
  animatedScore.set(trustScore !== null ? trustScore : initialTrustScore);
  const displayScore = useTransform(animatedScore, Math.round);

  const activeObjections = objections.filter(o => o.status === "active");
  const pastObjections = objections.filter(o => o.status !== "active");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submitObjection(decisionId, form);
    setForm({ category: "compliance", severity: "major", rationale: "" });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mt-8 shadow-xl">
      <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-rose-400" />
          <h3 className="text-lg font-bold text-slate-100">Stakeholder Dissent Tracker</h3>
        </div>
        <div className="bg-slate-900 shadow-inner px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-800">
          <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Live Trust Score</span>
          <motion.div className="text-3xl font-mono font-bold text-emerald-400">
            {displayScore}
          </motion.div>
        </div>
      </div>

      <div className="p-6 grid gap-8 lg:grid-cols-2">
        {/* Left Column: List */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Active Objections ({activeObjections.length})</h4>
          {activeObjections.length === 0 ? (
            <p className="text-sm text-slate-500 italic bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-700">No active blocks. The decision maintains standard alignment.</p>
          ) : (
            activeObjections.map(obj => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={obj._id} className={`p-4 rounded-xl border ${obj.severity === 'blocking' ? 'border-rose-500/50 bg-rose-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-slate-950 text-slate-300">{obj.category}</span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded ${obj.severity === 'blocking' ? 'bg-rose-900 text-rose-200' : 'bg-amber-900 text-amber-200'}`}>{obj.severity}</span>
                  </div>
                  <span className="text-xs text-slate-500">{obj.submittedBy.name}</span>
                </div>
                <p className="text-sm text-slate-300">{obj.rationale}</p>
              </motion.div>
            ))
          )}

          {pastObjections.length > 0 && (
            <div className="pt-6">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Resolved History</h4>
              <div className="space-y-3 opacity-60">
                {pastObjections.map(obj => (
                   <div key={obj._id} className="p-3 rounded-lg border border-slate-800 bg-slate-900/50">
                     <span className="text-xs font-bold text-slate-500 uppercase">[{obj.status}]</span>
                     <p className="text-sm text-slate-400 mt-1">{obj.rationale}</p>
                     {obj.adminNote && <p className="text-xs text-indigo-400 mt-2 border-l-2 border-indigo-500/30 pl-2">Admin: {obj.adminNote}</p>}
                   </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Form */}
        <div className="bg-slate-950/50 p-5 rounded-2xl border border-white/5">
          <h4 className="text-sm font-semibold text-slate-300 mb-4">Register Official Dissent</h4>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Category</label>
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="compliance">Compliance</option>
                  <option value="budget">Budget</option>
                  <option value="technical">Technical</option>
                  <option value="timing">Timing</option>
                  <option value="strategic">Strategic</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Severity</label>
                <Select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                  <option value="minor">Minor Warning</option>
                  <option value="major">Major Risk</option>
                  <option value="blocking">Fatal BLOCKER</option>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Objection Rationale</label>
              <Textarea 
                required
                placeholder="State exactly why this decision exposes the organization..."
                className="resize-none h-24"
                value={form.rationale}
                onChange={(e) => setForm({ ...form, rationale: e.target.value })}
              />
            </div>

            <Button disabled={loading} className="w-full" size="lg">
              <Send className="mr-2 h-4 w-4" />
              {loading ? "Re-Evaluating AI Trust Score..." : "Submit Dissent to Committee"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
