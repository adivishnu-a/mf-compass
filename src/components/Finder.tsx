"use client";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { AmcLogo } from "@/components/AmcLogo";
import { KindIcon } from "@/components/KindIcon";
import { BackIcon } from "@/components/icons";
import { useLookup } from "@/components/useLookup";
import { categoryBySlug } from "@/lib/categories";
import { cn } from "@/lib/utils";

type Answer = { label: string; line: string };
/** Each answer as part of one sentence for the results. */
const SAID = [
  ["grow your money", "grow it with smaller falls", "keep it fairly steady"],
  [
    "need it within 3 years",
    "can leave it 3 to 5 years",
    "can leave it 5 to 7 years",
    "can leave it 7 years or more",
  ],
  [
    "would sell in a big fall",
    "would hold on through a fall, though worried",
    "would hold on calmly through a fall",
  ],
];
const QUESTIONS: {
  title: string;
  help: string;
  short: (a: number) => string;
  options: Answer[];
  skip: number;
}[] = [
  {
    title: "What do you want this money to do?",
    help: "There's no wrong answer. It only changes which kinds of fund we point to.",
    short: (a) =>
      ["grow my money", "grow, with smaller falls", "stay fairly steady"][a],
    options: [
      {
        label: "Grow my money",
        line: "The most growth over the years, with ups and downs.",
      },
      {
        label: "Grow, with smaller falls",
        line: "Growth matters, but the bad years should hurt less.",
      },
      {
        label: "Stay fairly steady",
        line: "I'd rather earn a bit less than see big drops.",
      },
    ],
    skip: 1,
  },
  {
    title: "How long can you leave this money alone?",
    help: "Shares can fall a lot in a bad year. Time is what lets them recover.",
    short: (a) =>
      ["under 3 years", "3 to 5 years", "5 to 7 years", "7 years or more"][a],
    options: [
      {
        label: "Under 3 years",
        line: "Equity funds are a poor fit for this. We will say so honestly.",
      },
      {
        label: "3 to 5 years",
        line: "Hybrid funds that hold some bonds can soften the ride.",
      },
      {
        label: "5 to 7 years",
        line: "Large, flexi and multi cap funds start to make sense.",
      },
      {
        label: "7 years or more",
        line: "Room for mid and small caps, which swing the most.",
      },
    ],
    skip: 2,
  },
  {
    title: "Your ₹1 lakh drops to ₹70,000 in a bad year. What do you do?",
    help: "Falls like this come every few years. Be honest; this matters most.",
    short: (a) => ["sell", "wait, worried", "wait calmly"][a],
    options: [
      {
        label: "Sell, to stop it falling further",
        line: "Big swings would keep me up at night.",
      },
      {
        label: "Wait, but I'd be worried",
        line: "I'd hold on, and check it more than I should.",
      },
      {
        label: "Wait calmly, maybe add more",
        line: "Falls are when funds go on sale.",
      },
    ],
    skip: 1,
  },
];

const LADDER = [
  "balanced-advantage",
  "multi-asset",
  "aggressive-hybrid",
  "large-cap",
  "flexi-cap",
  "multi-cap",
  "large-and-mid-cap",
  "mid-cap",
  "small-cap",
];

/** Three neighbouring kinds of fund on a ladder from steadiest to biggest swings. */
function suggest([goal, horizon, nerve]: number[]) {
  if (horizon === 0) return null;
  const start = [0, 0, 2, 4][horizon] + [0, -1, -2][goal] + [-2, 0, 2][nerve];
  const from = Math.max(0, Math.min(start, LADDER.length - 3));
  return LADDER.slice(from, from + 3).filter(
    (s) => s !== "small-cap" || (horizon === 3 && nerve === 2),
  );
}

const slide = {
  enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
};

/** Fund finder (mock: PhoneFinder). Questions slide forward and back; the needle swings on each. */
export function Finder() {
  const [answers, setAnswers] = useState<number[]>([]);
  const [choice, setChoice] = useState<number | null>(null);
  const [dir, setDir] = useState(1);
  const step = answers.length;
  const done = step === QUESTIONS.length;
  const { funds } = useLookup(done);
  const q = QUESTIONS[Math.min(step, QUESTIONS.length - 1)];

  const back = () => {
    setDir(-1);
    setChoice(answers.at(-1) ?? null);
    setAnswers(answers.slice(0, -1));
  };
  const answer = (a: number) => {
    setDir(1);
    setAnswers([...answers, a]);
    setChoice(null);
  };
  const picks = done ? suggest(answers) : null;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-80px)] max-w-[560px] flex-col md:min-h-0">
      <header className="flex items-center gap-2 px-2 pt-[calc(8px+env(safe-area-inset-top))] md:px-0 md:pt-0">
        {step === 0 ? (
          <Link
            href="/"
            transitionTypes={["nav-back"]}
            aria-label="Back"
            className="grid size-11 place-items-center rounded-xl text-ink hover:text-ink"
          >
            <BackIcon />
          </Link>
        ) : (
          <button
            type="button"
            onClick={back}
            aria-label="Previous question"
            className="grid size-11 place-items-center rounded-xl text-ink"
          >
            <BackIcon />
          </button>
        )}
        <div
          role="progressbar"
          aria-label={
            done ? "Finished" : `Question ${step + 1} of ${QUESTIONS.length}`
          }
          aria-valuemin={1}
          aria-valuemax={QUESTIONS.length}
          aria-valuenow={Math.min(step + 1, QUESTIONS.length)}
          className="grid flex-1 grid-cols-3 gap-1.5"
        >
          {QUESTIONS.map((_, i) => (
            <span
              key={i}
              className="h-1.5 overflow-hidden rounded-[3px] bg-border"
            >
              <motion.span
                className={cn(
                  "block h-full rounded-[3px]",
                  i === step && !done ? "bg-marigold" : "bg-brand",
                )}
                initial={false}
                animate={{
                  width: i < step || done || i === step ? "100%" : "0%",
                }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </span>
          ))}
        </div>
        {!done ? (
          <button
            type="button"
            onClick={() => answer(q.skip)}
            className="grid h-11 min-w-11 place-items-center px-2 text-[15px] font-semibold text-brand"
          >
            Skip
          </button>
        ) : (
          <span className="w-11" />
        )}
      </header>

      <div className="relative flex-1 overflow-hidden px-5 pt-4 md:px-0 md:pt-8">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={done ? "done" : step}
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {!done ? (
              <>
                <div className="flex items-center gap-3.5">
                  <svg
                    width="56"
                    height="56"
                    viewBox="0 0 56 56"
                    aria-hidden="true"
                    className="shrink-0"
                  >
                    <circle cx="28" cy="28" r="27" fill="var(--brand-soft)" />
                    <motion.g
                      style={{ transformOrigin: "28px 28px" }}
                      initial={{ rotate: -60 }}
                      animate={{
                        rotate:
                          [0, -20, 15, -6][step + (choice !== null ? 1 : 0)] ??
                          0,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 120,
                        damping: 9,
                      }}
                    >
                      <polygon
                        points="40,16 31.5,31.5 24.5,24.5"
                        fill="#F0A202"
                      />
                      <polygon
                        points="16,40 24.5,24.5 31.5,31.5"
                        fill="var(--brand)"
                      />
                    </motion.g>
                  </svg>
                  <p className="text-sm text-text-2">
                    Question {step + 1} of {QUESTIONS.length}
                    {step > 0 && (
                      <>
                        {" "}
                        · You chose{" "}
                        <strong className="text-ink">
                          {QUESTIONS[step - 1].short(answers[step - 1])}
                        </strong>
                      </>
                    )}
                  </p>
                </div>
                <h1
                  id="question"
                  className="mt-[18px] text-[28px] leading-[1.15] font-bold tracking-[-0.015em]"
                >
                  {q.title}
                </h1>
                <p className="mt-2 text-[15px] text-text-2">{q.help}</p>
                <div
                  role="radiogroup"
                  aria-labelledby="question"
                  className="mt-5 flex flex-col gap-2.5"
                >
                  {q.options.map((o, i) => {
                    const on = choice === i;
                    return (
                      <button
                        key={o.label}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setChoice(i)}
                        className={cn(
                          "block w-full rounded-2xl border-2 bg-surface px-4 py-3.5 text-left text-ink",
                          on
                            ? "border-brand shadow-[0_6px_16px_rgba(10,88,120,0.12)]"
                            : "border-border hover:border-border-hover",
                        )}
                      >
                        <span className="flex items-center justify-between gap-2.5">
                          <span className="text-[17px] font-bold">
                            {o.label}
                          </span>
                          <span
                            aria-hidden="true"
                            className={cn(
                              "size-[22px] flex-none rounded-full transition-all duration-200",
                              on ? "bg-marigold" : "border-2 border-[#A3B2B9]",
                            )}
                            style={
                              on
                                ? {
                                    boxShadow:
                                      "0 0 0 2px var(--surface), 0 0 0 4px var(--brand)",
                                  }
                                : undefined
                            }
                          />
                        </span>
                        <span className="mt-0.5 block text-sm text-text-2">
                          {o.line}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : picks === null ? (
              <>
                <h1 className="text-[28px] leading-[1.15] font-bold tracking-[-0.015em]">
                  For money you need within 3 years, equity funds are a poor fit
                </h1>
                <p className="mt-3 text-[15px] text-text-2">
                  Shares can fall 30% or more in a year and take years to
                  recover, so they can let you down just when you need the
                  money. Bank deposits or debt funds usually suit short goals
                  better. MF Compass doesn't cover those yet.
                </p>
                <p className="mt-3 text-[15px] text-text-2">
                  If part of the money can wait longer, answer again for that
                  part.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-[28px] leading-[1.15] font-bold tracking-[-0.015em]">
                  Kinds of fund that may fit
                </h1>
                <p className="mt-2 text-[15px] text-text-2">
                  You want to {SAID[0][answers[0]]}, {SAID[1][answers[1]]}, and{" "}
                  {SAID[2][answers[2]]}. Start with these kinds, then compare
                  the funds inside each.
                </p>
                <ul className="mt-5 grid gap-3">
                  {picks.map((slug, k) => {
                    const info = categoryBySlug(slug)!;
                    const best = funds
                      ?.filter(
                        (f) => f.category === info.name && f.score !== null,
                      )
                      .sort((a, b) => b.score! - a.score!)
                      .slice(0, 3);
                    return (
                      <motion.li
                        key={slug}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.08 * k,
                          duration: 0.3,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="rounded-2xl border border-border bg-surface p-4"
                      >
                        <Link
                          href={`/funds/${slug}`}
                          transitionTypes={["nav-forward"]}
                          className="flex items-center gap-3 text-lg font-bold text-ink hover:text-brand"
                        >
                          <KindIcon
                            slug={slug}
                            size={32}
                            className="shrink-0"
                          />
                          {info.label}
                        </Link>
                        <p className="text-[15px] text-text-2">{info.line}</p>
                        <ul className="mt-3 grid gap-0.5 border-t border-hairline pt-2">
                          {(best ?? [0, 1, 2]).map((f) =>
                            typeof f === "number" ? (
                              <li key={f} className="mfc-skeleton my-1 h-7" />
                            ) : (
                              <li key={f.code}>
                                <Link
                                  href={`/fund/${encodeURIComponent(f.code)}`}
                                  transitionTypes={["nav-forward"]}
                                  className="flex items-center gap-3 rounded-lg py-1.5 text-ink hover:text-brand"
                                >
                                  <AmcLogo
                                    houseCode={f.houseCode}
                                    house={f.house}
                                    size={28}
                                  />
                                  <span className="min-w-0 flex-1 truncate">
                                    {f.name}
                                  </span>
                                  <strong>{f.score!.toFixed(1)}</strong>
                                </Link>
                              </li>
                            ),
                          )}
                        </ul>
                      </motion.li>
                    );
                  })}
                </ul>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="sticky bottom-0 bg-bg px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] md:static md:mt-8 md:px-0">
        {!done ? (
          <button
            type="button"
            onClick={() => choice !== null && answer(choice)}
            disabled={choice === null}
            className="press h-[52px] w-full rounded-[14px] bg-brand text-[17px] font-bold text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-track disabled:text-text-3"
          >
            {step === QUESTIONS.length - 1 ? "See what fits" : "Next question"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDir(-1);
              setAnswers([]);
              setChoice(null);
            }}
            className="h-[52px] w-full rounded-[14px] border border-border-strong bg-surface text-[17px] font-semibold text-ink"
          >
            Start again
          </button>
        )}
        <p className="mt-2.5 text-center text-xs text-text-3">
          This points you to kinds of funds. It isn't advice.
        </p>
      </div>
    </div>
  );
}
