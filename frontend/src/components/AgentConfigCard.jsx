import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from '../authStore';
import { useNavigate } from 'react-router-dom'; 
import { Github, Users, UserCircle, Rocket, Activity, Info } from "lucide-react";
import dotenv from "dotenv";

dotenv.config();

const AgentConfigCard = ({ onLaunch, phase, user }) => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  // Fixed GitHub Token as requested
  const GITHUB_TOKEN = process.env.github_access_token || "";

  const [form, setForm] = useState({
    repoUrl: "https://github.com/SahilJ1305/test-cicd-healer.git",
    teamName: "INVINCIBLE",
    leaderName: user?.full_name || "Saiyam Kumar"
  });

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const branchName = `${form.teamName}_${form.leaderName}`
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "") + "_AI_Fix";

  // ACTUAL BACKEND INTEGRATION
  const validateAndLaunch = async () => {
    if (!form.repoUrl || !form.teamName || !form.leaderName) {
      setError("CRITICAL_ERROR: FIELDS_REQUIRED");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Scan Repository
      // Matches payload defined in RunRequest
      const scanResponse = await fetch("http://localhost:8000/api/agent/scan-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_url: form.repoUrl,
          team_name: form.teamName,
          leader_name: form.leaderName,
          github_token: GITHUB_TOKEN 
        }),
      });

      const scanResult = await scanResponse.json();

      if (!scanResponse.ok) {
        throw new Error(scanResult.detail || "SCAN_FAILED");
      }

      // Step 2: Trigger Fix Logic
      // Passes team_name as query param as defined in fix_all_endpoint
      const fixResponse = await fetch(`http://localhost:8000/api/agent/fix-all?team_name=${encodeURIComponent(form.teamName)}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Optional: if your backend requires auth
        },
      });

      const fixResult = await fixResponse.json();

      if (!fixResponse.ok) {
        throw new Error(fixResult.detail || "FIX_TRIGGER_FAILED");
      }

      // Step 3: Notify parent dashboard of successful launch
      if (onLaunch) {
        onLaunch({
          ...form,
          run_id: fixResult.run_id // Assuming fix logic returns a run_id for progress tracking
        });
      }

    } catch (err) {
      console.error("Agent Launch Error:", err);
      setError(`EXECUTION_FAILURE: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden group bg-[#000d12]/95 md:bg-[#000d12]/80 border border-[#002a35] backdrop-blur-none md:backdrop-blur-xl shadow-2xl transition-all duration-300 rounded-2xl p-5 mb-6 md:rounded-3xl md:p-10 md:mb-10">
      <div className="absolute top-0 left-0 w-6 h-6 md:w-10 md:h-10 border-t-2 border-l-2 border-[#00ffe1] rounded-tl-xl opacity-40" />
      <div className="absolute bottom-0 right-0 w-6 h-6 md:w-10 md:h-10 border-b-2 border-r-2 border-[#00ffe1] rounded-br-xl opacity-40" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-l-4 border-[#00ffe1] pl-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold tracking-[0.2em] md:tracking-[0.5em] text-[#38bdf8] uppercase font-['Rajdhani']">
            Agent Config
          </h3>
          <p className="text-[10px] md:text-xs font-mono text-[#00ffe180] uppercase tracking-widest mt-1">
            Initialization v2.0.26
          </p>
        </div>
        
        {phase === "running" && (
          <div className="flex self-start sm:self-center items-center gap-2 px-3 py-1 bg-[#00ffe1]/10 border border-[#00ffe1]/30 rounded-full">
            <Activity size={14} className="text-[#00ffe1] animate-pulse" />
            <span className="text-[10px] font-mono text-[#00ffe1] uppercase">Active Run</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8">
        {[
          { id: 'repoUrl', label: 'GitHub Repo', icon: <Github size={16}/>, ph: 'URL' },
          { id: 'teamName', label: 'Team Name', icon: <Users size={16}/>, ph: 'ID' },
          { id: 'leaderName', label: 'Leader', icon: <UserCircle size={16}/>, ph: 'Name' }
        ].map((field) => (
          <div key={field.id} className="space-y-3">
            <label className="text-[10px] md:text-xs font-mono text-[#6ba7bd] tracking-widest uppercase flex items-center gap-2 font-bold">
              {field.icon} {field.label}
            </label>
            <div className="relative">
              <input 
                className="w-full bg-[#001312] border border-[#002a35] rounded-xl p-3 md:p-4 text-sm md:text-base text-[#c8e6f0] focus:border-[#00ffe1] focus:ring-1 focus:ring-[#00ffe140] outline-none transition-all font-mono placeholder:text-[#4a7a8a]"
                value={form[field.id]}
                onChange={(e) => setForm({...form, [field.id]: e.target.value})}
                placeholder={field.ph}
                disabled={isLoading || phase === "running"}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8 p-4 md:p-6 bg-[#00ffe105] border border-[#002a35] rounded-xl relative overflow-hidden">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Info size={14} className="text-[#38bdf8]" />
          <label className="text-[10px] md:text-xs font-mono text-[#38bdf8] tracking-widest uppercase font-extrabold">
            Target Branch
          </label>
        </div>
        <div className="text-center font-mono text-[#00ffe1] text-xs md:text-base tracking-[0.05em] md:tracking-[0.2em] break-all">
          origin / <span className="font-bold underline decoration-[#00ffe1]/30">{branchName}</span>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }}
            className="mb-4 text-center text-red-500 font-mono text-[10px] md:text-xs uppercase"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button 
        onClick={validateAndLaunch}
        disabled={isLoading || phase === "running"}
        whileHover={!(isLoading || phase === "running") ? { scale: 1.01 } : {}}
        whileTap={!(isLoading || phase === "running") ? { scale: 0.98 } : {}}
        className="w-full py-4 md:py-6 bg-gradient-to-r from-[#00ffe1] to-[#38bdf8] text-black font-black font-['Rajdhani'] tracking-[0.2em] md:tracking-[0.7em] rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,255,225,0.2)]"
      >
        {isLoading || phase === "running" ? (
          <div className="flex items-center gap-3">
            <Activity className="animate-spin" size={20} />
            <span className="text-sm md:text-base uppercase tracking-widest">Running AI Agents...</span>
          </div>
        ) : (
          <>
            <Rocket size={20} /> 
            <span className="text-sm md:text-base uppercase">Launch Healing Agent</span>
          </>
        )}
      </motion.button>
    </section>
  );
};

export default AgentConfigCard;