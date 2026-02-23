import React, { useState, useEffect } from "react";

const FixesTable = ({ runId }) => {
  const [fixes, setFixes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper to map bug types to your UI colors
  const getColor = (type) => {
    const colors = {
      SYNTAX: "#ff4d6d",
      TYPE_ERROR: "#facc15",
      IMPORT: "#38bdf8",
      LINTING: "#00ffe1",
      LOGIC: "#a78bfa",
      INDENTATION: "#fbbf24"
    };
    return colors[type] || "#c8e6f0";
  };

  useEffect(() => {
    if (!runId) return;

    const fetchFixes = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/agent/fix-progress/${runId}`);
        const data = await response.json();

        if (data.success) {
          // Map backend data to frontend table structure
          const formattedFixes = data.details.map((f) => ({
            file: f.file,
            type: f.bug_type.split(' | ')[0], // Extract type if you appended 'thought'
            line: f.line,
            msg: `[AI-AGENT] ${f.bug_type.split(' | ')[1] || 'Applying patch...'}`,
            status: f.status.toUpperCase(),
            color: getColor(f.bug_type.split(' | ')[0])
          }));
          setFixes(formattedFixes);
        }
      } catch (err) {
        console.error("Error fetching fixes:", err);
      }
    };

    // Initial fetch
    fetchFixes();
    
    // Poll for updates every 5 seconds while active
    const interval = setInterval(fetchFixes, 5000);
    return () => clearInterval(interval);
  }, [runId]);

  if (!runId) return (
    <div className="text-center py-10 font-mono text-[#4a7a8a] animate-pulse uppercase tracking-[0.2em]">
      Waiting for initialization...
    </div>
  );

  return (
    <div className="w-full">
      {/* 1. DESKTOP TABLE VIEW */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-6">
          <thead>
            <tr className="text-[14px] font-mono text-[#4a7a8a] uppercase tracking-[0.4em]">
              <th className="px-6 pb-4">File</th>
              <th className="px-6 pb-4">Bug Type</th>
              <th className="px-6 pb-4">Line</th>
              <th className="px-6 pb-4">Commit Message</th>
              <th className="px-6 pb-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="text-[15px] font-mono">
            {fixes.map((f, i) => (
              <tr key={i} className="group transition-all hover:bg-white/5 border-b border-white/5">
                <td className="py-6 px-6 text-[#c8e6f0]/80 font-medium">{f.file}</td>
                <td className="py-6 px-6">
                  <span 
                    className="px-5 py-2 rounded-full border-2 text-[12px] font-black tracking-widest uppercase"
                    style={{ borderColor: `${f.color}60`, color: f.color, backgroundColor: `${f.color}15` }}
                  >
                    {f.type}
                  </span>
                </td>
                <td className="py-6 px-6 text-[#38bdf8] font-black text-lg">{f.line}</td>
                <td className="py-6 px-6 max-w-[300px]">
                  <p className="text-[#00ffe1] font-black mb-1 text-[16px]">{f.msg.split(']')[0]}]</p>
                  <p className="text-[#4a7a8a] text-[13px] font-medium leading-relaxed">{f.msg.split(']')[1]}</p>
                </td>
                <td className="py-6 px-6 text-center">
                   <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl" style={{ color: f.status === "FIXED" ? "#00ffe1" : "#ff4d6d" }}>
                      {f.status === "FIXED" ? "✓" : "✕"}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: f.status === "FIXED" ? "#00ffe1" : "#ff4d6d" }}>{f.status}</span>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 2. MOBILE CARD VIEW */}
      <div className="md:hidden space-y-4">
        {fixes.map((f, i) => (
          <div key={i} className="bg-[#001312] border border-[#002a35] rounded-xl p-5 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
                 <span className="text-xl" style={{ color: f.status === "FIXED" ? "#00ffe1" : "#ff4d6d" }}>
                    {f.status === "FIXED" ? "✓" : "✕"}
                 </span>
            </div>

            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-mono text-[#4a7a8a] uppercase tracking-widest mb-1">File Path</p>
                <p className="text-sm font-bold text-[#c8e6f0]">{f.file}</p>
              </div>
              <div className="text-right mr-6">
                <p className="text-[10px] font-mono text-[#4a7a8a] uppercase tracking-widest mb-1">Line</p>
                <p className="text-sm font-bold text-[#38bdf8]">{f.line}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-mono text-[#4a7a8a] uppercase tracking-widest mb-2">Diagnosis</p>
              <span 
                className="px-3 py-1 rounded-full border text-[10px] font-black tracking-widest uppercase"
                style={{ borderColor: `${f.color}60`, color: f.color, backgroundColor: `${f.color}15` }}
              >
                {f.type}
              </span>
            </div>

            <div className="pt-2 border-t border-[#002a35]">
              <p className="text-[10px] font-mono text-[#4a7a8a] uppercase tracking-widest mb-1">Commit Fix</p>
              <p className="text-[13px] text-[#00ffe1] font-bold mb-1">{f.msg.split(']')[0]}]</p>
              <p className="text-[12px] text-[#4a7a8a] leading-tight font-medium">{f.msg.split(']')[1]}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FixesTable;