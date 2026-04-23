"use client";

import { useEffect, useState } from "react";

export default function LogoALoader({ complete }: { complete: boolean }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M50 10 L85 90 L70 90 L62 70 L38 70 L30 90 L15 90 Z M42 58 L58 58 L50 35 Z"
        fill="none"
        stroke="rgba(201,168,76,0.15)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M50 10 L85 90 L70 90 L62 70 L38 70 L30 90 L15 90 Z M42 58 L58 58 L50 35 Z"
        fill="none"
        stroke="#C9A84C"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{
          filter: "drop-shadow(0 0 4px #C9A84C) drop-shadow(0 0 8px rgba(201,168,76,0.6))",
          strokeDasharray: complete ? "1000" : "300 700",
          strokeDashoffset: complete ? "0" : "1000",
          animation: !isMounted || complete ? "none" : "trace-a 2s linear infinite",
        }}
      />
      <style>{`
        @keyframes trace-a {
          0% { stroke-dashoffset: 1000; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  );
}
