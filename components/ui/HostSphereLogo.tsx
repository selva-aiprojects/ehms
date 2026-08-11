"use client";

import Image from "next/image";

interface HostSphereLogoProps {
  variant?: "full" | "icon" | "image" | "stacked";
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

export function HostSphereLogo({ variant = "full", size = "md", className = "" }: HostSphereLogoProps) {
  const dimensions = {
    sm: { width: 160, height: 44, iconSize: 32, fontTitle: "text-lg", fontSub: "text-[10px]" },
    md: { width: 220, height: 58, iconSize: 42, fontTitle: "text-2xl", fontSub: "text-xs" },
    lg: { width: 280, height: 74, iconSize: 52, fontTitle: "text-3xl", fontSub: "text-sm" },
    xl: { width: 340, height: 90, iconSize: 64, fontTitle: "text-4xl", fontSub: "text-base" },
    "2xl": { width: 440, height: 116, iconSize: 80, fontTitle: "text-5xl", fontSub: "text-lg" },
  }[size];

  if (variant === "image") {
    return (
      <div className={`relative inline-flex items-center shrink-0 ${className}`}>
        <Image
          src="/hostsphere-grand-logo-new.png"
          alt="HostSphere Luxury Hospitality"
          width={dimensions.width}
          height={dimensions.height}
          className="object-contain filter drop-shadow-[0_0_16px_rgba(0,240,255,0.6)] transition-all duration-300 hover:scale-[1.02]"
          priority
          unoptimized
        />
      </div>
    );
  }

  const iconSvg = (
    <div className="relative flex items-center justify-center shrink-0">
      {/* Ultra Luminous Cyan Glow Aura */}
      <div
        className="absolute inset-0 rounded-full bg-[#00f0ff]/50 blur-lg group-hover:bg-[#00f0ff]/80 transition-all duration-300 animate-pulse-glow"
      />
      <div
        className="relative flex items-center justify-center"
        style={{ width: dimensions.iconSize + 4, height: dimensions.iconSize + 4 }}
      >
        <svg
          viewBox="0 0 50 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full filter drop-shadow-[0_0_16px_rgba(0,240,255,1)]"
        >
          <defs>
            <linearGradient id="hostBrightCyanRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <radialGradient id="hostBrightCyanCore" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#00f0ff" />
              <stop offset="85%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0c081d" />
            </radialGradient>
          </defs>

          {/* 3D Intersecting Atomic Orbital Rings */}
          <ellipse cx="25" cy="25" rx="20" ry="8" stroke="url(#hostBrightCyanRing)" strokeWidth="2.8" transform="rotate(-35 25 25)" />
          <ellipse cx="25" cy="25" rx="20" ry="8" stroke="url(#hostBrightCyanRing)" strokeWidth="2.8" transform="rotate(35 25 25)" />
          <ellipse cx="25" cy="25" rx="20" ry="8" stroke="#00f0ff" strokeWidth="2.2" transform="rotate(85 25 25)" opacity="0.95" />

          {/* Luminous Central Core Orb */}
          <circle cx="25" cy="25" r="7" fill="url(#hostBrightCyanCore)" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="23" cy="23" r="2" fill="#ffffff" fillOpacity="0.98" />
        </svg>
      </div>
    </div>
  );

  if (variant === "icon") {
    return iconSvg;
  }

  if (variant === "stacked") {
    return (
      <div className={`inline-flex flex-col items-center text-center select-none cursor-pointer group ${className}`}>
        {iconSvg}
        <div className="mt-2.5 flex flex-col items-center leading-none">
          <span className={`brand-title ${dimensions.fontTitle} font-black text-white tracking-tight drop-shadow-[0_2px_12px_rgba(255,255,255,0.5)]`}>
            HostSphere
          </span>
          <span className={`brand-tagline ${dimensions.fontSub} font-extrabold text-[#00f0ff] uppercase tracking-widest mt-1.5 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]`}>
            Luxury Hospitality
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3.5 select-none cursor-pointer group ${className}`}>
      {iconSvg}
      <div className="flex flex-col text-left leading-none">
        <span className={`brand-title ${dimensions.fontTitle} font-black text-white tracking-tight drop-shadow-[0_2px_12px_rgba(255,255,255,0.5)]`}>
          HostSphere
        </span>
        <span className={`brand-tagline ${dimensions.fontSub} font-extrabold text-[#00f0ff] uppercase tracking-widest mt-1.5 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]`}>
          Luxury Hospitality
        </span>
      </div>
    </div>
  );
}
