"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "@/hooks/useInView";

type Prompt = {
  q: string;
  answer: string;
  sources: string;
  cta: string;
};

const PROMPTS: Prompt[] = [
  {
    q: "My labs just came back, what stands out?",
    answer:
      "Most of your panel is clean. The one to act on is homocysteine at 14, with B12 and folate low-normal underneath it. Your diet runs light on leafy greens and you're not supplementing, so a methylated B-complex brings it back down by your next draw.",
    sources: "Report · Nov · Food log · Supplements",
    cta: "Adjust my plan",
  },
  {
    q: "Should I train hard today?",
    answer:
      "Hold off. Recovery's at 39% and resting heart rate is up 7 this morning, you flagged heavy legs, and your last panel had magnesium low, which slows muscle repair. Do Zone 2 for 30 minutes, take magnesium tonight, and go heavy tomorrow.",
    sources: "Watch · Report · Nov · Supplements",
    cta: "Swap to Zone 2",
  },
  {
    q: "How do I beat jet lag in Tokyo?",
    answer:
      "Tokyo's eight hours ahead. Your sleep already runs late, so start now, bed 30 minutes earlier each night, melatonin 0.5mg two hours before, and skip the in-flight alcohol, it ruins the first night. You'll adjust by day two, not day five.",
    sources: "Watch · Supplements · Food log",
    cta: "Add the shift plan",
  },
  {
    q: "How do I train for Hyrox in 3 months?",
    answer:
      "You're 12 weeks out and your engine is ready, VO2 sits top quartile. Grip and lactate clearance are the gaps. Build base now, sharpen from week 9.",
    sources: "Training log · Watch · Report · Nov",
    cta: "View suggested protocol",
  },
];

const REVEAL = "transition-all duration-700 ease-out";

export function PhiSection() {
  const ref = useRef<HTMLElement>(null);
  const revealed = useInView(ref, { threshold: 0.3 });
  const [active, setActive] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"typing" | "done">("typing");

  const shown = (delay: number, base = "") =>
    `${base} ${REVEAL} ${revealed ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`;

  // typing effect + auto-cycle
  useEffect(() => {
    if (!revealed) return;
    const prompt = PROMPTS[active];
    setTyped("");
    setPhase("typing");
    let i = 0;
    const type = setInterval(() => {
      i += 2;
      setTyped(prompt.answer.slice(0, i));
      if (i >= prompt.answer.length) {
        clearInterval(type);
        setPhase("done");
      }
    }, 18);
    return () => clearInterval(type);
  }, [active, revealed]);

  useEffect(() => {
    if (!revealed || phase !== "done") return;
    const t = setTimeout(() => setActive((a) => (a + 1) % PROMPTS.length), 3600);
    return () => clearTimeout(t);
  }, [phase, revealed]);

  const prompt = PROMPTS[active];

  return (
    <section
      ref={ref}
      className="phi-section relative flex min-h-screen flex-col justify-center bg-black px-6 py-24 md:px-12 lg:px-20"
    >
      <div className="phi-aura" aria-hidden="true">
        <span className="phi-aura-a" />
      </div>

      <div className="relative z-10 flex w-full flex-col gap-12 md:flex-row md:items-center md:justify-between">
        {/* left column */}
        <div className="md:w-[36%]">
          <h2
            style={{ transitionDelay: "0ms" }}
            className={shown(0, "font-aeonik text-2xl font-medium leading-[1.1] tracking-tight text-white md:text-4xl")}
          >
            Your personal health OS.
          </h2>
          <p
            style={{ transitionDelay: "100ms" }}
            className={shown(0, "mt-3 max-w-md font-aeonik text-sm font-light text-white/45 md:text-base")}
          >
            It reads your bloodwork, wearables, diet and symptoms together, and tells you what they mean.
          </p>

          <nav className="mt-14 flex flex-col gap-1.5 md:mt-20">
            {PROMPTS.map((p, i) => {
              const on = i === active;
              return (
                <div key={p.q} style={{ transitionDelay: `${400 + i * 90}ms` }} className={shown(0)}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setActive(i)}
                    className={`group flex w-full origin-left items-center gap-3 py-2 text-left font-aeonik text-[14px] transition-all duration-300 ease-out md:text-base ${
                      on ? "text-white md:scale-[1.07] md:font-medium" : "text-white/40 hover:text-white/75"
                    }`}
                  >
                    <span
                      className={`h-px w-6 origin-left shrink-0 transition-all duration-300 ${
                        on ? "scale-x-100 bg-[#ff5c2a]" : "scale-x-[0.667] bg-white/20 group-hover:bg-white/40"
                      }`}
                    />
                    {p.q}
                  </button>
                </div>
              );
            })}
          </nav>
        </div>

        {/* console */}
        <div
          style={{ transitionDelay: "240ms" }}
          className={shown(0, "phi-stage w-full md:w-[56%] md:max-w-[740px]")}
        >
          <div className="phi-console-deck" style={{ ["--px" as string]: 0, ["--py" as string]: 0, ["--glow" as string]: 0.6 }}>
            <div className="phi-console-glow" aria-hidden="true" />
            <div className="phi-console px-5 py-6 md:px-7 md:py-7">
              {/* user bubble */}
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-white/10 px-4 py-2.5 font-aeonik text-sm text-white/90 md:text-[15px]">
                  {prompt.q}
                </div>
              </div>

              {/* assistant */}
              <div className="mt-6">
                <p className="font-organetto text-[11px] uppercase tracking-[0.32em] text-[#ff5c2a]">Vanta</p>
                <p className="mt-3 min-h-[7rem] font-aeonik text-[15px] font-light leading-relaxed text-white/85 md:text-base">
                  {typed}
                  {phase === "typing" && <span className="phi-caret" style={{ opacity: 1 }} />}
                </p>

                <div
                  className={`transition-opacity duration-500 ${phase === "done" ? "opacity-100" : "opacity-0"}`}
                >
                  <p className="mt-5 font-aeonik text-[11px] uppercase tracking-[0.2em] text-white/35">
                    read across{" "}
                    <span className="text-white/55">{prompt.sources}</span>
                  </p>
                  <button
                    type="button"
                    className="mt-5 rounded-full border border-white/15 bg-white/5 px-4 py-2 font-aeonik text-[13px] font-medium text-white/90 transition-colors hover:border-white/30 hover:bg-white/10"
                  >
                    {prompt.cta}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
