"use client";

import { useEffect, useState } from "react";

type Phase = "idle" | "ringing" | "waiting" | "dialing" | "connected";

const STATUS: Record<Phase, string> = {
  idle: "Start the demo to see what a Talk call does.",
  ringing: "Twilio is calling your phone. Pretend you answered.",
  waiting: "A voice says: press any key to connect. Go ahead, press one.",
  dialing: "Key pressed. Only now does Twilio dial the other person.",
  connected: "You're talking. They see your Twilio number, and both legs are billing.",
};

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

function Leg({ name, state, live }: { name: string; state: string; live: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line py-2.5 text-[0.9375rem] leading-snug">
      <span className="font-semibold">{name}</span>
      <span className={live ? "text-right font-semibold text-mint-text" : "text-right text-ink-soft"}>{state}</span>
    </div>
  );
}

/** A simulation only. It runs entirely in the browser and places no call. */
export function TalkDemo() {
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    if (phase !== "ringing" && phase !== "dialing") return;
    const next = phase === "ringing" ? "waiting" : "connected";
    const timer = setTimeout(() => setPhase(next), 1800);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "waiting") return;
    const onKey = (event: KeyboardEvent) => {
      if (KEYS.includes(event.key)) setPhase("dialing");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const firstLeg = phase === "idle" ? "Not started" : phase === "ringing" ? "Ringing your phone" : "Connected, billing";
  const secondLeg = phase === "connected" ? "Connected, billing" : phase === "dialing" ? "Ringing them" : "Not dialed";

  return (
    <div className="rounded-xl bg-surface p-5 shadow-[inset_0_0_0_1px_var(--line)] sm:p-7">
      <p aria-live="polite" className="min-h-[5.25rem] font-display text-xl font-semibold leading-snug sm:min-h-[4.5rem]">
        {STATUS[phase]}
      </p>

      <div className="mt-4">
        <Leg name="Leg 1: Twilio to you" state={firstLeg} live={phase !== "idle" && phase !== "ringing"} />
        <Leg name="Leg 2: Twilio to them" state={secondLeg} live={phase === "connected"} />
      </div>

      <div className="mx-auto mt-5 grid max-w-60 grid-cols-3 gap-2.5">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            disabled={phase !== "waiting"}
            onClick={() => setPhase("dialing")}
            aria-label={`Press ${key}`}
            className={`key text-2xl ${
              phase === "waiting" ? "ring-pulse cursor-pointer bg-mint-strong text-white hover:bg-mint-strong-hover" : "opacity-60"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setPhase(phase === "idle" ? "ringing" : "idle")}
          className={`btn btn-sm cursor-pointer ${phase === "idle" ? "btn-mint" : "btn-ghost"}`}
        >
          {phase === "idle" ? "Start the demo call" : "Start over"}
        </button>
        <p className="text-[0.9375rem] text-ink-soft">A simulation. Nothing is dialed.</p>
      </div>
    </div>
  );
}
