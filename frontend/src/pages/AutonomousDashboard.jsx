import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../authStore";
import { 
  FallingDataStreams, 
  ElectronReactor, 
  StatCard, 
  ScoreArc, 
  RadarChart, 
  FixesTable, 
  Terminal,
  CITimeline 
} from "../components/dashboard";
import AgentConfigCard from "../components/AgentConfigCard";
import PerformanceMetrics from "../components/dashboard/PerformanceMetrics";
import AgentActivityLog from "../components/dashboard/AgentActivityLog";
import dotenv from "dotenv";

dotenv.config();

const SummaryField = ({ label, value, color = "text-white" }) => (
  <div className="space-y-0.5 md:space-y-1">
    <p className="text-[10px] font-mono text-[#4a7a8a] tracking-[0.3em] uppercase font-bold">
      {label}
    </p>
    <div className={`text-sm font-mono ${color} truncate font-medium`}>
      {value}
    </div>
  </div>
);

const AutonomousDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const [phase, setPhase] = useState("idle");
  const [runId, setRunId] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [activeFormData, setActiveFormData] = useState(null);
  const resultRef = useRef(null);

  const scoreData = { base: 100, speed: 10, total: 110 };

  // app/pages/AutonomousDashboard.jsx

  const handleLaunch = async (formData) => {
    if (phase === "running") return;
    
    setActiveFormData(formData);
    setShowResult(false);
    setPhase("running");
  
    try {
      // 🚀 CRITICAL: Explicitly map keys to match backend RunRequest schema
      const payload = {
        repo_url: formData.repoUrl,     // Mapping camelCase to snake_case
        team_name: formData.teamName,
        leader_name: formData.leaderName,
        github_token: process.env.github_access_token
      };
  
      const response = await fetch("http://localhost:8000/api/agent/run-orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      const data = await response.json();
  
      if (response.ok && data.success) {
        setRunId(data.run_id); 
      } else {
        console.error("422 Validation Error:", data.detail);
        setPhase("idle");
      }
    } catch (error) {
      console.error("Connection Error:", error);
      setPhase("idle");
    }
  };

  const handleDone = () => {
    setPhase("done");
    setTimeout(() => {
      setShowResult(true);
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 800);
  };

  const branchName = activeFormData 
    ? `${activeFormData.teamName}_${activeFormData.leaderName}`.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_9]/g, "") + "_AI_Fix"
    : "PENDING_INITIALIZATION";

  return (
    <div className="relative min-h-screen bg-[#000507] text-[#c8e6f0] font-['Exo_2'] overflow-x-hidden">
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ElectronReactor />
        <div className="absolute inset-0 opacity-40 md:opacity-100 transition-opacity duration-1000">
          <FallingDataStreams />
        </div>
      </div>
      
      <div className="fixed inset-0 pointer-events-none z-10">
        <div className="absolute left-0 right-0 h-[1px] md:h-[2px] bg-gradient-to-r from-transparent via-[#00ffe110] to-transparent animate-[scan_10s_linear_infinite]" />
      </div>

      <main className="relative z-20 max-w-7xl mx-auto p-4 md:p-8 pt-10">
        <div className="text-center mb-12 md:mb-20 px-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-[8vw] sm:text-6xl md:text-8xl font-bold font-['Rajdhani'] tracking-[0.1em] md:tracking-[0.2em] bg-gradient-to-r from-white via-[#00ffe1] to-[#38bdf8] bg-clip-text text-transparent uppercase drop-shadow-[0_0_15px_rgba(0,255,225,0.3)] leading-tight">
              Autonomous
            </h2>
            <p className="text-[2.5vw] sm:text-xl md:text-3xl font-light tracking-[0.4em] md:tracking-[0.6em] text-[#c8e6f0]/30 font-['Rajdhani'] uppercase italic">
              CI/CD Healing Agent
            </p>
          </motion.div>
        </div>

        <AgentConfigCard user={user} phase={phase} onLaunch={handleLaunch} />

        <AnimatePresence>
          {(phase === "running" || phase === "done") && (
            <Terminal 
              active={phase === "running"} 
              onDone={handleDone} 
              runId={runId} 
            />
          )}
        </AnimatePresence>

        <div ref={resultRef}>
          <AnimatePresence>
            {showResult && (
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 pt-10 pb-20">
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  <StatCard label="Total Detected" value={6} accent="#ff4d6d" icon="🔍" subLabel="Failures" />
                  <StatCard label="Auto-Patched" value={5} accent="#00ffe1" icon="🔧" subLabel="Fixes" />
                  <StatCard label="Total Runtime" value="3m 57s" accent="#38bdf8" icon="⏱" subLabel="Elapsed" />
                  <StatCard label="Of 5 Limit" value="3" accent="#a78bfa" icon="🔁" subLabel="Iterations" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                  <div className="lg:col-span-2 bg-[#000d12]/80 border border-[#002a35] p-6 md:p-10 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-10 border-l-4 border-[#38bdf8] pl-4">
                      <h3 className="text-[12px] md:text-[14px] font-bold tracking-[0.4em] text-[#38bdf8] uppercase font-['Rajdhani']">
                        Run Summary
                      </h3>
                    </div>

                    <div className="space-y-12">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-5 md:gap-y-8">
                        <SummaryField label="Repository" value={activeFormData?.repoUrl} />
                        <SummaryField label="Branch" value={branchName} color="text-[#00ffe1]" />
                        <SummaryField label="Team" value={activeFormData?.teamName} />
                        <SummaryField label="Leader" value={activeFormData?.leaderName} />
                      </div>

                      <div className="bg-[#00ffe108] border border-[#00ffe120] p-6 rounded-xl flex items-center gap-6">
                        <div className="relative">
                          <div className="w-4 h-4 rounded-full bg-[#00ffe1] shadow-[0_0_15px_#00ffe1] animate-pulse" />
                          <div className="absolute inset-[-6px] rounded-full border border-[#00ffe130] animate-ping" />
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm md:text-base font-bold font-['Rajdhani'] text-[#00ffe1] tracking-[0.3em] md:tracking-[0.5em] uppercase">
                            CI/CD Pipeline — Passed
                          </div>
                          <div className="text-[10px] md:text-[11px] font-mono text-[#4a7a8a] tracking-widest uppercase">
                            Final results synchronized with GitHub
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#000d12]/90 border border-[#00ffe120] p-4 md:p-6 rounded-2xl shadow-2xl flex flex-col">
                    <h3 className="text-[#00ffe1] font-['Rajdhani'] font-bold tracking-[0.4em] mb-4 uppercase text-[10px] border-l-2 border-[#00ffe1] pl-3 mt-2">
                      Final Score
                    </h3>
                    <div className="flex flex-row items-center justify-between gap-4 md:gap-8 flex-1">
                      <ScoreArc score={scoreData.total} />
                      <div className="flex-1 space-y-3 md:space-y-4">
                        <div className="flex justify-between items-center text-[10px] md:text-[11px] font-mono">
                          <span className="text-[#4a7a8a] uppercase tracking-widest font-bold">Base</span>
                          <span className="text-[#38bdf8] font-bold">+{scoreData.base}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] md:text-[11px] font-mono">
                          <span className="text-[#4a7a8a] uppercase tracking-widest font-bold">Bonus</span>
                          <span className="text-[#00ffe1] font-bold">+{scoreData.speed}</span>
                        </div>
                        <div className="h-[1px] bg-[#00ffe115] w-full" />
                        <div className="flex justify-between items-end">
                          <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Result</span>
                          <span className="text-2xl md:text-3xl font-bold font-['Rajdhani'] text-[#00ffe1] leading-none drop-shadow-[0_0_10px_#00ffe1]">
                            {scoreData.total}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-8">
                  <div className="bg-[#000d12]/80 border border-[#002a35] p-6 md:p-10 rounded-2xl shadow-2xl">
                    <div className="flex items-center gap-3 mb-10 border-l-4 border-[#ff4d6d] pl-4">
                      <h3 className="text-[11px] font-bold tracking-[0.4em] text-[#ff4d6d] uppercase font-['Rajdhani']">Fixes Applied</h3>
                    </div>
                    <FixesTable runId={runId} />
                  </div>
                  
                  <div className="bg-[#000d12]/80 border border-[#002a35] p-6 md:p-10 rounded-2xl shadow-2xl overflow-x-auto">
                    <div className="flex items-center gap-3 mb-12 border-l-4 border-[#a78bfa] pl-4">
                      <h3 className="text-[11px] font-bold tracking-[0.4em] text-[#a78bfa] uppercase font-['Rajdhani']">CI/CD Timeline</h3>
                    </div>
                    <CITimeline runId={runId} />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-10 pb-20">
                  <div className="bg-[#000d12]/80 border border-[#002a35] p-6 md:p-10 rounded-2xl shadow-2xl">
                      <div className="flex items-center gap-3 mb-10 border-l-4 border-[#38bdf8] pl-4">
                        <h3 className="text-[11px] font-bold tracking-[0.4em] text-[#38bdf8] uppercase font-['Rajdhani']">Bugs</h3>
                      </div>
                      <RadarChart runId={runId} />
                  </div>
                  <div className="bg-[#000d12]/80 border border-[#002a35] p-6 md:p-10 rounded-2xl shadow-2xl">
                      <div className="flex items-center gap-3 mb-10 border-l-4 border-[#facc15] pl-4">
                        <h3 className="text-[11px] font-bold tracking-[0.4em] text-[#facc15] uppercase font-['Rajdhani']">Metrics</h3>
                      </div>
                      <PerformanceMetrics runId={runId} />
                  </div>
                  <div className="bg-[#000d12]/80 border border-[#002a35] p-6 md:p-10 rounded-2xl shadow-2xl">
                      <div className="flex items-center gap-3 mb-10 border-l-4 border-[#00ffe1] pl-4">
                        <h3 className="text-[11px] font-bold tracking-[0.4em] text-[#00ffe1] uppercase font-['Rajdhani']">Activity</h3>
                      </div>
                      <AgentActivityLog runId={runId} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AutonomousDashboard;