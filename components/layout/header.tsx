"use client";

import { Bell, Search, ChevronDown, Menu, LogOut, User, Shield, LayoutDashboard, Hotel, Building2, Home, Briefcase } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABELS } from "@/lib/role-access";
import { useJourney } from "@/components/providers/JourneyProvider";
import { useProperties } from "@/lib/hooks";

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, signOut } = useAuth();
  const { activeJourney, selectedPropertyId, setSelectedPropertyId } = useJourney();
  const { properties = [] } = useProperties();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user
    ? (user.first_name?.charAt(0)?.toUpperCase() || "") +
      (user.last_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase())
    : "?";

  const displayName = user
    ? `${user.first_name} ${user.last_name || ""}`.trim()
    : "User";

  const roleLabel = user ? (ROLE_LABELS[user.role_name] || user.role_name) : "";

  const isGlobalAdmin = user && (user.role_name === "super_admin" || user.role_name === "executive");

  const filteredProperties = properties.filter((p: any) => {
    if (activeJourney === "all") return true;
    if (activeJourney === "hotels") return p.vertical_type === "hotel";
    if (activeJourney === "apartments") return p.vertical_type === "service_apartment";
    if (activeJourney === "rental") return p.vertical_type === "rental_apartment";
    if (activeJourney === "workplace") return p.vertical_type === "workplace";
    return true;
  });

  return (
    <header
      className="h-16 flex items-center justify-between px-6 shrink-0 gap-4"
      style={{ background: "#FFFFFF", borderBottom: "1px solid #E2E8F0" }}
    >
      <button
        onClick={onMenuClick}
        className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors shrink-0"
        style={{ color: "#1A3C5E" }}
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-3 ml-auto shrink-0 flex-wrap">
        {user && (
          <span className="text-sm hidden md:inline animate-fade-in" style={{ color: "#64748B" }}>
            Welcome, <span className="font-semibold" style={{ color: "#1A2E44" }}>{user.first_name || user.email.split('@')[0]}</span>!
          </span>
        )}
        <div className="h-4 w-px bg-slate-200 hidden md:block" />
        
        {isGlobalAdmin && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-60" style={{ color: "#64748B" }}>Active Property:</span>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="px-2 py-1 text-xs font-semibold rounded bg-white outline-none cursor-pointer border border-slate-200 hover:border-slate-300 transition-colors"
              style={{ color: "#1A3C5E" }}
            >
              <option value="">All Workspaces</option>
              {filteredProperties.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0"
          style={{ 
            background: "#F5F7FA",
            border: "1px solid #E2E8F0",
            color: "#1A2E44"
          }}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Vertical:</span>
          {activeJourney === "all" && (
            <>
              <LayoutDashboard className="w-3.5 h-3.5" style={{ color: "#2BAE8E" }} />
              <span className="font-semibold">All</span>
            </>
          )}
          {activeJourney === "hotels" && (
            <>
              <Hotel className="w-3.5 h-3.5" style={{ color: "#2BAE8E" }} />
              <span className="font-semibold">Hotels & Resorts</span>
            </>
          )}
          {activeJourney === "apartments" && (
            <>
              <Building2 className="w-3.5 h-3.5" style={{ color: "#2BAE8E" }} />
              <span className="font-semibold">Serviced Apartments</span>
            </>
          )}
          {activeJourney === "rental" && (
            <>
              <Home className="w-3.5 h-3.5" style={{ color: "#2BAE8E" }} />
              <span className="font-semibold">Apartment Rental</span>
            </>
          )}
          {activeJourney === "workplace" && (
            <>
              <Briefcase className="w-3.5 h-3.5" style={{ color: "#2BAE8E" }} />
              <span className="font-semibold">Workplace Management</span>
            </>
          )}
        </div>
      </div>

      <div className="relative w-64 hidden lg:block shrink-0">
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

      <div className="flex items-center gap-3 shrink-0">
        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#F5F7FA" }}>
          <Bell className="w-4 h-4" style={{ color: "#1A3C5E" }} />
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
            style={{ background: "#E53E3E" }}
          >
            1
          </span>
        </button>

        <div className="relative" ref={dropdownRef}>
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{
                background: "linear-gradient(135deg, #1A3C5E 0%, #2BAE8E 100%)",
                boxShadow: "0 0 0 2px #fff, 0 0 0 3px #2BAE8E",
              }}
            >
              {initials}
            </div>
            <div className="text-sm hidden sm:block">
              <div className="font-semibold leading-tight" style={{ color: "#1A2E44" }}>{displayName}</div>
              <div className="text-xs leading-tight" style={{ color: "#64748B" }}>{roleLabel}</div>
            </div>
            <ChevronDown className="w-4 h-4 hidden sm:block" style={{ color: "#64748B" }} />
          </div>

          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg z-50 overflow-hidden"
              style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}
            >
              <div className="px-4 py-3" style={{ borderBottom: "1px solid #E2E8F0" }}>
                <div className="font-semibold text-sm" style={{ color: "#1A2E44" }}>{displayName}</div>
                <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>{user?.email}</div>
                {roleLabel && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <Shield className="w-3 h-3" style={{ color: "#2BAE8E" }} />
                    <span className="text-xs font-medium" style={{ color: "#2BAE8E" }}>{roleLabel}</span>
                  </div>
                )}
              </div>
              <div className="py-1">
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all hover:opacity-80"
                  style={{ color: "#64748B" }}
                  onClick={() => setDropdownOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Profile Settings
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all hover:opacity-80"
                  style={{ color: "#E53E3E" }}
                  onClick={() => { setDropdownOpen(false); signOut(); }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
