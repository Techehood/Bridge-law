"use client";

import { useEffect } from "react";

// Hides the global "Get Support" button on demo pages only.
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const hide = () =>
      window.dispatchEvent(new CustomEvent("bridge-flow-visibility", { detail: { mode: "hidden" } }));
    hide();
    const timers = [200, 600, 1500].map((ms) => setTimeout(hide, ms));
    return () => timers.forEach(clearTimeout);
  }, []);
  return <>{children}</>;
}
