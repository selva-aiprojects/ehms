"use client";

import { Bell, Search, ChevronDown, Menu } from "lucide-react";

export default function Header() {
  return (
    <header
      className="h-16 flex items-center justify-between px-6 shrink-0 gap-4"
      style={{ background: "#FFFFFF", borderBottom: "1px solid #E2E8F0" }}
    >
      {/* Left: hamburger */}
      <button
        className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors shrink-0"
        style={{ color: "#1A3C5E" }}
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Centre: Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#64748B" }} />
        <input
          type="text"
          placeholder="Search"
          className="w-full pl-9 pr-4 py-2 rounded-full text-sm outline-none transition-colors"
          style={{
            background: "#F5F7FA",
            border: "1px solid #E2E8F0",
            color: "#1A2E44",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#2BAE8E")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
        />
      </div>

      {/* Right: bell + user */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Bell */}
        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#F5F7FA" }}>
          <Bell className="w-4 h-4" style={{ color: "#1A3C5E" }} />
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
            style={{ background: "#E53E3E" }}
          >
            1
          </span>
        </button>

        {/* User — circular photo avatar matching reference */}
        <div className="flex items-center gap-2 cursor-pointer">
          {/* Circular avatar with initials (photo-style) */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{
              background: "linear-gradient(135deg, #1A3C5E 0%, #2BAE8E 100%)",
              boxShadow: "0 0 0 2px #fff, 0 0 0 3px #2BAE8E",
            }}
          >
            JS
          </div>
          <div className="text-sm hidden sm:block">
            <div className="font-semibold leading-tight" style={{ color: "#1A2E44" }}>Joan Smith</div>
            <div className="text-xs leading-tight" style={{ color: "#64748B" }}>User Manager</div>
          </div>
          <ChevronDown className="w-4 h-4 hidden sm:block" style={{ color: "#64748B" }} />
        </div>
      </div>
    </header>
  );
}
