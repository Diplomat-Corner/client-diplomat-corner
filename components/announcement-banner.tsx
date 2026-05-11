"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const DATA_RECOVERY_NOTICE_KEY = "diplomat_data_recovery_notice_dismissed";

export function AnnouncementBanner() {
  const [showDataRecoveryNotice, setShowDataRecoveryNotice] = useState(true);

  useEffect(() => {
    try {
      setShowDataRecoveryNotice(
        localStorage.getItem(DATA_RECOVERY_NOTICE_KEY) !== "1"
      );
    } catch {
      setShowDataRecoveryNotice(true);
    }
  }, []);

  const dismissDataRecoveryNotice = () => {
    try {
      localStorage.setItem(DATA_RECOVERY_NOTICE_KEY, "1");
    } catch {
      /* ignore */
    }
    setShowDataRecoveryNotice(false);
  };

  if (showDataRecoveryNotice) {
    return (
      <div className="relative bg-red-50 border-b border-red-200/90 text-red-950 py-2.5 sm:py-3 pl-3 pr-11 sm:pr-12 text-center text-sm sm:text-base shadow-sm">
        <p className="max-w-4xl mx-auto leading-snug font-medium">
          Due to the ongoing war, both our clusters are hit in UAE-Central and
          Bharine-South. You can add your listing as normal; we will try to get
          our data back in the meantime.
        </p>
        <button
          type="button"
          onClick={dismissDataRecoveryNotice}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-red-800/80 hover:text-red-950 hover:bg-red-100/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1"
          aria-label="Dismiss notice"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-white/90 to-white text-primary py-2 text-center italic font-medium relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer" />
      <div className="relative z-10">The #1 Diplomatic Portal in Ethiopia!</div>
    </div>
  );
}
