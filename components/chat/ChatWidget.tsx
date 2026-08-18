"use client";

import { useEffect, useRef, useState } from "react";
import { useJourney } from "@/components/providers/JourneyProvider";

interface ChatChip {
  intentId: string;
  label: string;
}

interface ChatMessage {
  role: "user" | "bot";
  content: string;
  error?: boolean;
  denied?: boolean;
  confirmationRequired?: boolean;
  confirmToken?: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chips, setChips] = useState<ChatChip[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<{ text: string; token: string } | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const { activeJourney, selectedPropertyId } = useJourney();

  useEffect(() => {
    fetch("/api/chat/chips")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setChips(d?.chips || []))
      .catch(() => setChips([]));
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  async function send(text: string, confirmToken?: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);
    setPendingConfirm(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          confirmToken,
          journey: activeJourney,
          property_id: selectedPropertyId || undefined,
        }),
      });
      const data = await res.json();
      const bot: ChatMessage = {
        role: "bot",
        content: data.content || data.error || "Something went wrong.",
        error: !!data.error,
        denied: !!data.denied,
        confirmationRequired: !!data.confirmationRequired,
        confirmToken: data.confirmToken,
      };
      setMessages((m) => [...m, bot]);
      if (data.confirmationRequired && data.confirmToken) {
        setPendingConfirm({ text: trimmed, token: data.confirmToken });
      }
    } catch {
      setMessages((m) => [...m, { role: "bot", content: "Network error. Please try again.", error: true }]);
    } finally {
      setLoading(false);
    }
  }

  function onConfirm() {
    if (!pendingConfirm) return;
    const { text, token } = pendingConfirm;
    setPendingConfirm(null);
    send(text, token);
  }

  return (
    <div
      className="fixed z-50 flex flex-col items-end"
      style={{ bottom: "6rem", right: "1rem" }}
    >
      {open && (
        <div
          className="flex flex-col w-80 md:w-96 h-[480px] max-h-[70vh] rounded-xl shadow-2xl overflow-hidden mb-3"
          style={{ background: "var(--hs-surface-white)", border: "1px solid var(--hs-gold)" }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ background: "var(--hs-navy)" }}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--hs-gold)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--color-on-dark)" }}>
                HostSphere AI Co-Pilot
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-lg leading-none"
              style={{ color: "var(--color-on-dark)", opacity: 0.8 }}
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ background: "var(--hs-bg-cream)" }}>
            {messages.length === 0 && (
              <div className="text-xs space-y-2">
                <p className="text-sm" style={{ color: "var(--hs-text-muted)" }}>
                  Hi! I&apos;m your AI Co-Pilot. Ask about occupancy, arrivals, folio balances, tickets, or tell me to
                  book/raise tickets.
                </p>
                {chips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {chips.map((c) => (
                      <button
                        key={c.intentId}
                        onClick={() => send(c.label)}
                        className="px-2 py-1 rounded-full text-[11px] transition-all cursor-pointer"
                        style={{ background: "var(--hs-surface-white)", border: "1px solid var(--hs-gold)", color: "var(--hs-navy)" }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-xs whitespace-pre-wrap ${
                    m.role === "user" ? "rounded-br-none" : "rounded-bl-none"
                  }`}
                  style={{
                    background: m.role === "user" ? "var(--hs-navy)" : "var(--hs-surface-white)",
                    color: m.role === "user" ? "var(--color-on-dark)" : "var(--hs-text)",
                    border: m.role === "user" ? "none" : "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {pendingConfirm && (
              <div className="flex justify-start">
                <div
                  className="max-w-[85%] rounded-lg px-3 py-2 text-xs rounded-bl-none"
                  style={{ background: "var(--hs-gold)", color: "var(--hs-navy)" }}
                >
                  <p className="font-semibold mb-1">This action changes data. Confirm?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={onConfirm}
                      className="px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer"
                      style={{ background: "var(--hs-navy)", color: "var(--color-on-dark)" }}
                    >
                      Yes, proceed
                    </button>
                    <button
                      onClick={() => setPendingConfirm(null)}
                      className="px-2 py-0.5 rounded text-[11px] cursor-pointer"
                      style={{ border: "1px solid var(--hs-navy)", color: "var(--hs-navy)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-lg text-xs rounded-bl-none" style={{ background: "var(--hs-surface-white)" }}>
                  <span className="inline-flex gap-1">
                    <span className="animate-pulse">●</span>
                    <span className="animate-pulse" style={{ animationDelay: "150ms" }}>●</span>
                    <span className="animate-pulse" style={{ animationDelay: "300ms" }}>●</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="px-3 py-2 flex items-center gap-2 border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send(input);
              }}
              placeholder="Ask or type a command…"
              className="flex-1 min-w-0 px-3 py-1.5 text-sm rounded-lg outline-none"
              style={{ background: "var(--hs-bg-cream)", color: "var(--hs-text)" }}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-50"
              style={{ background: "var(--hs-gold)", color: "var(--hs-navy)" }}
            >
              →
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle AI Co-Pilot"
        className="flex items-center justify-center rounded-full shadow-xl cursor-pointer"
        style={{
          width: "3.25rem",
          height: "3.25rem",
          background: "var(--hs-navy)",
          color: "var(--color-on-dark)",
        }}
      >
        {open ? (
          <span className="text-2xl leading-none">×</span>
        ) : (
          <span className="text-2xl leading-none">✨</span>
        )}
      </button>
    </div>
  );
}
