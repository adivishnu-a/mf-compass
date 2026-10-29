"use client";
import { useEffect } from "react";

/**
 * What a phone needs to animate the screen as one piece (globals.css, "Phone transitions").
 *
 * React leaves the root out of a view transition (it names it "none") when no <ViewTransition> on the page
 * changed, and on a phone none do (Page.tsx), so the old screen would just vanish. React keeps out only when
 * the root has no name of its own, so on a phone we give it one.
 *
 * Browser back and forward (including the iPhone edge swipe) need nothing: React applies them at once, with no
 * view transition, and Safari's own slide is the only animation. Our back button is the exception: see goBack.
 */
export function Transitions() {
  useEffect(() => {
    const phone = matchMedia("(max-width: 767px)");
    const root = document.documentElement;
    const name = () =>
      (root.style.viewTransitionName = phone.matches ? "root" : "");
    name();
    phone.addEventListener("change", name);
    return () => phone.removeEventListener("change", name);
  }, []);
  return null;
}

type Start = (arg: {
  update: () => Promise<void>;
  types?: string[];
}) => ViewTransition;

/**
 * Our back button: history back, played as the reverse of a forward push. React applies back navigations
 * instantly, so the transition is started here, holding the old screen until the previous page has rendered.
 */
export function goBack(back: () => void) {
  if (!("startViewTransition" in document)) return back();
  (document.startViewTransition as unknown as Start).call(document, {
    types: ["nav-back"],
    update: () =>
      new Promise<void>((resolve) => {
        // React renders the previous page inside the popstate event; two frames later it is on screen,
        // scroll restored. Never hold the screen frozen for long, whatever happens.
        addEventListener(
          "popstate",
          () =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          { once: true },
        );
        setTimeout(resolve, 800);
        back();
      }),
  });
}
