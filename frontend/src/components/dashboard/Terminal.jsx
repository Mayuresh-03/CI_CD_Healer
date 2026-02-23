import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────
//  Shared hook – Now fetches real-time logs from the API
// ─────────────────────────────────────────────
const useMockLogs = (active, onDone, runId) => {
  const [lines, setLines] = useState([]);
  const lastFetchedCount = useRef(0);

  useEffect(() => {
    // Only poll if the agent is active and we have a valid runId
    if (!active || !runId) return;

    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/agent/fix-progress/${runId}`);
        const data = await response.json();

        if (data.success) {
          // Map database fixes to the terminal line format
          const newLogs = data.details.map((fix) => ({
            text: `✔ [AI-AGENT] ${fix.bug_type} in ${fix.file}:${fix.line} -> ${fix.status}`,
            color: fix.status === "Fixed" ? "text-[#00ffe1]" : "text-[#ff4d6d]",
          }));

          // Only update state if new data has arrived to prevent unnecessary re-renders
          if (newLogs.length > lastFetchedCount.current) {
            setLines(newLogs);
            lastFetchedCount.current = newLogs.length;
          }

          // Check if the backend process has reached a terminal state
          if (data.status === "PASSED" || data.status === "FAILED") {
            const finalStatusColor = data.status === "PASSED" ? "text-[#00ffe1]" : "text-[#ff4d6d]";
            setLines(prev => [...prev, { 
              text: `── ✔ RUN COMPLETE: STATUS ${data.status} ──`, 
              color: `${finalStatusColor} font-bold` 
            }]);
            onDone();
            return true; // Signal to stop interval
          }
        }
      } catch (err) {
        console.error("Terminal polling error:", err);
      }
      return false;
    };

    // Initial fetch
    pollProgress();

    // Set up polling interval (every 3 seconds)
    const interval = setInterval(async () => {
      const isFinished = await pollProgress();
      if (isFinished) clearInterval(interval);
    }, 3000);

    return () => clearInterval(interval);
  }, [active, runId, onDone]);

  return lines;
};

// ─────────────────────────────────────────────
//  DESKTOP VIEW  (≥ 768 px)
// ─────────────────────────────────────────────
const DesktopTerminal = ({ active, lines }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines]);

  return (
    <div className="hidden md:block bg-[#000d12]/80 border border-[#002a35] rounded-xl overflow-hidden backdrop-blur-xl shadow-2xl mb-8 font-mono">
      {/* Title bar */}
      <div className="bg-[#001a22] px-4 py-2 flex justify-between items-center border-b border-[#002a35]">
        <div className="flex gap-1.5 items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff4d6d]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#facc15]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#00ffe1]" />
          <span className="text-[10px] text-[#4a7a8a] ml-4 tracking-widest uppercase opacity-60">
            agent@rift-2026:~ -- bash
          </span>
        </div>
        {!active && lines.length > 0 && (
          <span className="text-[10px] text-[#facc15] font-bold tracking-[0.3em] animate-pulse">
            COMPLETE
          </span>
        )}
      </div>

      {/* Log body */}
      <div
        ref={ref}
        className="p-6 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-[#002a35] scrollbar-track-transparent"
      >
        {lines.map((l, i) => {
          if (!l) return null;
          return (
            <div key={i} className={`${l.color || "text-white"} text-xs mb-2 tracking-wide flex gap-3`}>
              <span className="opacity-40 select-none w-5 text-right shrink-0">{i + 1}</span>
              <span>{l.text}</span>
            </div>
          );
        })}
        {active && (
          <div className="flex gap-3 items-center">
            <span className="opacity-40 select-none w-5 text-right shrink-0">{lines.length + 1}</span>
            <span className="w-2 h-4 bg-[#00ffe1] animate-pulse shadow-[0_0_10px_#00ffe1]" />
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  MOBILE VIEW  (< 768 px)
// ─────────────────────────────────────────────
const MobileTerminal = ({ active, lines }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines]);

  return (
    <div className="md:hidden bg-[#000d12]/90 border border-[#002a35] rounded-lg overflow-hidden shadow-xl mb-6 font-mono">
      {/* Compact title bar */}
      <div className="bg-[#001a22] px-3 py-1.5 flex justify-between items-center border-b border-[#002a35]">
        <div className="flex gap-1 items-center">
          <div className="w-2 h-2 rounded-full bg-[#ff4d6d]" />
          <div className="w-2 h-2 rounded-full bg-[#facc15]" />
          <div className="w-2 h-2 rounded-full bg-[#00ffe1]" />
          <span className="text-[9px] text-[#4a7a8a] ml-2 tracking-widest uppercase opacity-60">
            bash
          </span>
        </div>
        {!active && lines.length > 0 && (
          <span className="text-[9px] text-[#facc15] font-bold tracking-widest animate-pulse">
            COMPLETE
          </span>
        )}
        {active && (
          <span className="text-[9px] text-[#38bdf8] tracking-widest animate-pulse">
            RUNNING…
          </span>
        )}
      </div>

      {/* Log body */}
      <div
        ref={ref}
        className="p-3 h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-[#002a35] scrollbar-track-transparent"
      >
        {lines.map((l, i) => {
          if (!l) return null;
          return (
            <div key={i} className={`${l.color || "text-white"} text-[10px] leading-relaxed mb-1.5 flex gap-2`}>
              <span className="hidden min-[380px]:inline opacity-30 select-none w-4 text-right shrink-0 text-[9px] mt-0.5">
                {i + 1}
              </span>
              <span className="break-all whitespace-pre-wrap">{l.text}</span>
            </div>
          );
        })}
        {active && (
          <div className="flex gap-2 items-center mt-1">
            <span className="hidden min-[380px]:inline opacity-30 select-none w-4 text-right shrink-0 text-[9px]">
              {lines.length + 1}
            </span>
            <span className="w-1.5 h-3.5 bg-[#00ffe1] animate-pulse shadow-[0_0_8px_#00ffe1]" />
          </div>
        )}
      </div>

      {!active && lines.length > 0 && (
        <div className="bg-[#001a22]/60 border-t border-[#002a35] px-3 py-1.5 flex justify-between items-center">
          <span className="text-[9px] text-[#4a7a8a] opacity-60 tracking-widest uppercase">
            {lines.length} lines logged
          </span>
          <span className="text-[9px] text-[#00ffe1] tracking-widest">
            ✔ done
          </span>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
//  Root export – Now accepts runId to power real logs
// ─────────────────────────────────────────────
const Terminal = ({ active, onDone, runId }) => {
  const lines = useMockLogs(active, onDone, runId);

  return (
    <>
      <DesktopTerminal active={active} lines={lines} />
      <MobileTerminal  active={active} lines={lines} />
    </>
  );
};

export default Terminal;