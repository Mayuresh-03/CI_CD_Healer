import React from "react";
import { motion } from "framer-motion";

const CITimeline = () => {
  const events = [
    { s: "FAILED", t: "10:02:14", n: "Initial scan — 6 critical failures", run: "run 1/5", color: "#ff4d6d", active: false },
    { s: "FAILED", t: "10:07:31", n: "Linting & syntax patched — 2 remain", run: "run 2/5", color: "#ff4d6d", active: false },
    { s: "PASSED", t: "10:11:58", n: "All tests green — pipeline clear ✓", run: "run 3/5", color: "#00ffe1", active: false },
    { s: "PASSED", t: "10:11:58", n: "All tests green — pipeline clear ✓", run: "run 3/5", color: "#00ffe1", active: false },
    { s: "FAILED", t: "10:07:31", n: "Linting & syntax patched — 2 remain", run: "run 2/5", color: "#ff4d6d", active: false },
    { s: "PASSED", t: "10:11:58", n: "All tests green — pipeline clear ✓", run: "run 3/5", color: "#00ffe1", active: false },
    { s: "PASSED", t: "10:11:58", n: "All tests green — pipeline clear ✓", run: "run 3/5", color: "#00ffe1", active: true }
  ];

  return (
    <div className="relative w-full overflow-hidden">
      <style>{`
        @keyframes scan-horizontal {
          0% { transform: translateX(-100%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(350%); opacity: 0; }
        }

        /* Increased Scrollbar Size and Visibility */
        .cyber-scroll::-webkit-scrollbar {
          height: 10px;
        }
        .cyber-scroll::-webkit-scrollbar-track {
          background: rgba(0, 255, 225, 0.05);
          border-radius: 10px;
          margin: 0 20px;
        }
        .cyber-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(to right, rgba(0, 255, 225, 0.1), rgba(0, 255, 225, 0.3), rgba(0, 255, 225, 0.1));
          border-radius: 10px;
          border: 1px solid rgba(0, 255, 225, 0.2);
        }
        .cyber-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 225, 0.4);
        }
      `}</style>

      <div className="cyber-scroll overflow-x-auto overflow-y-hidden pt-16 pb-12 px-4 mx-auto max-w-[800px]">
        <div 
          className="relative flex items-start transition-all duration-500" 
          style={{ width: `${events.length * 220}px` }}
        >
          
          {/* 1. Track & Scan Line Wrapper */}
          <div className="absolute top-[14px] left-[110px] right-[110px] h-[2px] pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-[#ff4d6d] via-[#ff4d6d] to-[#00ffe1] opacity-20" />
            
            {/* End Cap */}
            <div className="absolute right-0 top-[-8px] bottom-[-8px] w-[3px] bg-[#00ffe1] shadow-[0_0_15px_#00ffe1]" />
            
            {/* Scanning Glow */}
            <div className="absolute inset-0 overflow-hidden">
                <div 
                className="absolute top-0 h-full w-[300px] bg-gradient-to-r from-transparent via-[#00ffe170] to-transparent"
                style={{ 
                    animation: 'scan-horizontal 4s linear infinite',
                    filter: 'blur(8px)' 
                }}
                />
            </div>
          </div>

          {/* 2. Events List */}
          <div className="flex justify-between items-start relative z-10 w-full">
            {events.map((e, i) => (
              <div 
                key={i} 
                className="flex flex-col items-center group shrink-0" 
                style={{ width: '220px' }}
              >
                {/* Status Node */}
                <div 
                  className="relative w-[32px] h-[32px] rounded-full border-[6px] border-[#000507] z-20 transition-all duration-500 mb-10"
                  style={{ 
                    backgroundColor: e.color, 
                    boxShadow: e.active 
                      ? `0 0 40px ${e.color}, 0 0 20px ${e.color}` 
                      : `0 0 15px ${e.color}30` 
                  }}
                >
                  {e.active && (
                    <div className="absolute inset-[-14px] rounded-full border-2 border-[#00ffe140] animate-ping" />
                  )}
                </div>
                
                {/* Event Details */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-center space-y-4 px-4"
                >
                  <div className="flex flex-col items-center gap-2">
                    {/* Increased Heading Size for the Status Badge */}
                    <span 
                      className="px-5 py-2 rounded-lg text-[14px] font-black tracking-[0.25em] border-2 uppercase transition-all"
                      style={{ 
                        borderColor: `${e.color}40`, 
                        color: e.color, 
                        backgroundColor: `${e.color}15` 
                      }}
                    >
                      {e.s}
                    </span>
                    {/* Timestamp slightly decreased */}
                    <span className="text-[12px] font-mono text-[#4a7a8a] font-bold tracking-wider">{e.t}</span>
                  </div>
                  
                  {/* Description slightly decreased for cleaner UI */}
                  <p className="text-[14px] text-white/90 font-medium leading-relaxed h-[44px] overflow-hidden group-hover:text-[#00ffe1] transition-colors">
                    {e.n}
                  </p>
                  
                  {/* Run Info slightly decreased */}
                  <div className="text-[10px] font-mono text-[#4a7a8a]/50 uppercase tracking-[0.3em] font-black">
                    {e.run}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CITimeline;