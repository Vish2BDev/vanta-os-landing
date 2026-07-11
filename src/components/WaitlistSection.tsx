"use client";

import { useRef, useState, type FormEvent } from "react";
import { useInView } from "@/hooks/useInView";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WaitlistSection() {
  const ref = useRef<HTMLElement>(null);
  const revealed = useInView(ref, { threshold: 0.25 });
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  const valid = EMAIL_RE.test(email);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid || status !== "idle") return;
    setStatus("loading");
    setTimeout(() => setStatus("done"), 900);
  };

  return (
    <section
      ref={ref}
      id="waitlist"
      data-revealed={revealed}
      className="wf-section relative flex min-h-screen w-full flex-col items-center justify-between overflow-hidden bg-[#060606] px-6 pb-12 pt-28 text-center"
    >
      <div className="wf-haze pointer-events-none absolute inset-0" aria-hidden="true">
        <span className="wf-haze-blob wf-haze-a" />
        <span className="wf-haze-blob wf-haze-b" />
      </div>
      <div className="wf-vignette pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="wf-grain pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-black to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center">
        <div className="wf-rise wf-rise-4 flex w-full flex-col items-center">
          <h3 className="font-aeonik text-3xl font-medium tracking-tight text-white/90 md:text-5xl">
            Join the waitlist
          </h3>
          <p className="mt-4 max-w-md font-aeonik text-sm tracking-[0.02em] text-white/40 md:text-base">
            Be one of the first to experience Vanta OS.
          </p>
          <form className="mt-14 w-full max-w-md" onSubmit={onSubmit}>
            <div className="wf-pill" data-active={email.length > 0}>
              <input
                type="email"
                placeholder="your email"
                aria-label="Email address"
                className="wf-pill-input font-aeonik"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "done"}
              />
              <button
                type="submit"
                disabled={!valid || status !== "idle"}
                className="wf-pill-btn font-aeonik"
              >
                {status === "loading" ? <span className="wf-spinner" /> : status === "done" ? "Joined" : "Join"}
              </button>
            </div>
          </form>
          <p
            className={`mt-3 min-h-[1.1rem] font-aeonik text-xs tracking-[0.04em] transition-colors duration-300 ${
              status === "done" ? "text-[#ff5c2a]" : "text-white/0"
            }`}
            aria-live="polite"
          >
            {status === "done" ? "You're on the list. We'll be in touch." : " "}
          </p>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <p className="wf-rise wf-eyebrow font-aeonik text-[11px] font-normal uppercase tracking-[0.4em] text-white/40">
          from the world of
        </p>
        <h2 className="wf-monument font-organetto" aria-label="Vanta">
          VANTA
        </h2>
      </div>
    </section>
  );
}
