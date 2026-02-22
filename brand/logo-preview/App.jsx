import React, { useState } from 'react';
import { Copy, CheckCircle2, Moon, Sun, MonitorPlay, Image as ImageIcon, Code2, Download } from 'lucide-react';

// 全局动画样式
const SvgStyles = () => (
  <style>
    {`
      .rw-draw-path {
        stroke-dasharray: 300;
        stroke-dashoffset: 300;
        animation: rw-drawLine 3s ease-in-out infinite alternate;
      }
      @keyframes rw-drawLine {
        0% { stroke-dashoffset: 300; }
        100% { stroke-dashoffset: 0; }
      }
      .rw-pulse-node-dark {
        animation: rw-pulseNodeDark 1.5s ease-in-out infinite alternate;
      }
      @keyframes rw-pulseNodeDark {
        0% { transform: scale(0.8); fill: #38bdf8; opacity: 0.6; }
        100% { transform: scale(1.3); fill: #fff; opacity: 1; }
      }
      .rw-pulse-node-light {
        animation: rw-pulseNodeLight 1.5s ease-in-out infinite alternate;
      }
      @keyframes rw-pulseNodeLight {
        0% { transform: scale(0.8); fill: #0ea5e9; opacity: 0.6; }
        100% { transform: scale(1.3); fill: #0f172a; opacity: 1; }
      }
    `}
  </style>
);

export const RWLogo = ({ animated = true, theme = 'dark', className = "w-full h-full" }) => {
  const pathColor = theme === 'dark' ? '#38bdf8' : '#0284c7';
  const gridColor = theme === 'dark' ? '#475569' : '#cbd5e1';
  const nodeStartColor = theme === 'dark' ? '#38bdf8' : '#0ea5e9';
  const drawClass = animated ? 'rw-draw-path' : '';
  const pulseClass = animated ? (theme === 'dark' ? 'rw-pulse-node-dark' : 'rw-pulse-node-light') : '';

  return (
    <svg viewBox="0 0 130 130" className={className} xmlns="http://www.w3.org/2000/svg">
      <g fill={gridColor} opacity={theme === 'dark' ? "0.4" : "0.6"}>
        {[15, 35, 55, 75, 95, 115].map(x =>
          [15, 35, 55, 75, 95, 115].map(y =>
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" />
          )
        )}
      </g>
      <path d="M 25 105 V 35 H 55 A 15 15 0 0 1 55 65 H 25 M 40 65 L 60 105" fill="none" stroke={pathColor} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className={drawClass} />
      <path d="M 70 35 L 80 105 L 95 65 L 110 105 L 120 35" fill="none" stroke={pathColor} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className={drawClass} style={animated ? { animationDelay: "0.5s" } : { strokeDashoffset: 0, strokeDasharray: 'none' }} />
      <circle cx="25" cy="35" r="4" fill={animated ? nodeStartColor : (theme==='dark'?'#fff':'#0f172a')} className={pulseClass} style={{ transformOrigin: '25px 35px', animationDelay: '0.1s' }} />
      <circle cx="55" cy="50" r="4" fill={animated ? nodeStartColor : (theme==='dark'?'#fff':'#0f172a')} className={pulseClass} style={{ transformOrigin: '55px 50px', animationDelay: '0.4s' }} />
      <circle cx="60" cy="105" r="4" fill={animated ? nodeStartColor : (theme==='dark'?'#fff':'#0f172a')} className={pulseClass} style={{ transformOrigin: '60px 105px', animationDelay: '0.7s' }} />
      <circle cx="70" cy="35" r="4" fill={animated ? nodeStartColor : (theme==='dark'?'#fff':'#0f172a')} className={pulseClass} style={{ transformOrigin: '70px 35px', animationDelay: '0.9s' }} />
      <circle cx="95" cy="65" r="4" fill={animated ? nodeStartColor : (theme==='dark'?'#fff':'#0f172a')} className={pulseClass} style={{ transformOrigin: '95px 65px', animationDelay: '1.2s' }} />
      <circle cx="120" cy="35" r="4" fill={animated ? nodeStartColor : (theme==='dark'?'#fff':'#0f172a')} className={pulseClass} style={{ transformOrigin: '120px 35px', animationDelay: '1.5s' }} />
    </svg>
  );
};

export default function App() {
  // ... preview app (see brand/logo-preview/)
}
