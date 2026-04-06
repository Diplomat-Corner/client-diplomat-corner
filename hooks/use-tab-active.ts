"use client";

import { useEffect, useState } from "react";

export function useTabActive(): boolean {
  const [isActive, setIsActive] = useState<boolean>(() => {
    if (typeof document === "undefined") return true;
    return document.visibilityState === "visible";
  });

  useEffect(() => {
    if (typeof document === "undefined") return;

    const computeActive = () => {
      const visible = document.visibilityState === "visible";
      const focused =
        typeof document.hasFocus === "function" ? document.hasFocus() : true;
      setIsActive(visible && focused);
    };

    computeActive();

    document.addEventListener("visibilitychange", computeActive);
    window.addEventListener("focus", computeActive);
    window.addEventListener("blur", computeActive);

    return () => {
      document.removeEventListener("visibilitychange", computeActive);
      window.removeEventListener("focus", computeActive);
      window.removeEventListener("blur", computeActive);
    };
  }, []);

  return isActive;
}

