"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const CommandMenu = dynamic(
  () => import("@/components/CommandMenu").then((mod) => mod.CommandMenu),
  { ssr: false },
);

/**
 * Keeps the search menu out of the initial bundle. The first Cmd/Ctrl+K or
 * "mfc-open-search" event loads it already open; after that the menu's own
 * listeners handle toggling.
 */
export function CommandMenuLoader() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    const open = () => setLoaded(true);
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mfc-open-search", open);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mfc-open-search", open);
    };
  }, [loaded]);

  return loaded ? <CommandMenu defaultOpen /> : null;
}
