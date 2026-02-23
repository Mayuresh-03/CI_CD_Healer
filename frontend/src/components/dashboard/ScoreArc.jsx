import React, { useState, useEffect } from "react";

const ScoreArc = ({ score = 110 }) => {
  const r = 75, circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);

  useEffect(() => {
    // Score relative to a 130 max
    setOffset(circ * (1 - score / 130));
  }, [score, circ]);

  return (
    /* Reduced container size for mobile (120px) to fit side-by-side */
    <div className="relative w-[120px] h-[120px] md:w-[180px] md:h-[180px] flex items-center justify-center shrink-0">
      {/* Background Glow */}
      <div className="absolute inset-2 rounded-full bg-[#00ffe105] blur-xl" />
      
      <svg 
        viewBox="0 0 200 200" 
        className="rotate-[-90deg] w-full h-full overflow-visible"
      >
        {/* Track */}
        <circle cx="100" cy="100" r={r} fill="none" stroke="#001a22" strokeWidth="8" />
        
        {/* Progress Arc */}
        <circle 
          cx="100" cy="100" r={r} fill="none" 
          stroke="#00ffe1" strokeWidth="10"
          strokeDasharray={circ} 
          style={{ 
            strokeDashoffset: offset, 
            transition: "stroke-dashoffset 2.5s cubic-bezier(0.4, 0, 0.2, 1)",
            filter: "drop-shadow(0 0 8px #00ffe180)"
          }} 
          strokeLinecap="round" 
        />
      </svg>
      
      {/* Central Number */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl md:text-5xl font-bold font-['Rajdhani'] text-white">
          {score}
        </span>
        <span className="text-[7px] md:text-[8px] font-mono text-[#00ffe180] tracking-[0.3em] uppercase">
          Total
        </span>
      </div>
    </div>
  );
};

export default ScoreArc;