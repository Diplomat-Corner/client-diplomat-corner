"use client";

import { motion } from "framer-motion";
import { Car, Home, Search, Filter, Loader2, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

type ListingSkeletonVariant = "house" | "car";

const copy: Record<
  ListingSkeletonVariant,
  {
    initial: string;
    mid: string;
    hero: string;
    loadingLabel: string;
  }
> = {
  house: {
    initial: "Searching for the perfect properties...",
    mid: "Preparing property information...",
    hero: "Finding Your Perfect Home",
    loadingLabel: "Loading properties...",
  },
  car: {
    initial: "Searching for the best cars...",
    mid: "Preparing vehicle information...",
    hero: "Finding Your Perfect Car",
    loadingLabel: "Loading cars...",
  },
};

export default function ListingPageSkeleton({
  variant,
}: {
  variant: ListingSkeletonVariant;
}) {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(copy[variant].initial);
  const c = copy[variant];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress < 30) {
      setLoadingText(c.initial);
    } else if (progress < 60) {
      setLoadingText(c.mid);
    } else if (progress < 90) {
      setLoadingText("Almost ready...");
    } else {
      setLoadingText("Finalizing results...");
    }
  }, [progress, c.initial, c.mid]);

  const skeletonItems = Array.from({ length: 6 }).map((_, index) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 * index }}
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
    >
      <div className="h-48 bg-gray-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer" />
      </div>
      <div className="p-4 space-y-3">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        <div className="flex justify-between items-center pt-2">
          <div className="h-5 bg-gray-200 rounded animate-pulse w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded-full animate-pulse w-1/4"></div>
        </div>
      </div>
    </motion.div>
  ));

  return (
    <div className="min-h-screen bg-gray-50 pt-5 pb-16">
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite ease-in-out;
        }
      `}</style>

      <div className="container mx-auto px-4 mb-8">
        <div className="relative min-h-96 bg-gradient-to-r from-primary/80 to-primary/40 rounded-xl overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 overflow-hidden">
            {variant === "house" ? (
              <>
                <div className="absolute bottom-0 left-0 right-0 h-20">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 1200 80"
                    preserveAspectRatio="none"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0,80 L0,50 L50,50 L60,30 L80,30 L90,50 L120,50 L120,40 L140,40 L140,20 L160,20 L160,40 L180,40 L180,50 L200,50 L200,30 L220,30 L220,40 L240,40 L240,20 L260,20 L260,40 L280,40 L280,30 L300,30 L300,50 L320,50 L320,40 L340,40 L340,20 L360,20 L360,30 L380,30 L380,50 L400,50 L400,40 L420,40 L420,20 L440,20 L440,30 L460,30 L460,50 L480,50 L480,30 L500,30 L500,40 L520,40 L520,20 L540,20 L540,40 L560,40 L560,50 L580,50 L580,30 L600,30 L600,50 L620,50 L620,40 L640,40 L640,20 L660,20 L660,40 L680,40 L680,30 L700,30 L700,50 L720,50 L720,40 L740,40 L740,20 L760,20 L760,30 L780,30 L780,50 L800,50 L800,40 L820,40 L820,20 L840,20 L840,30 L860,30 L860,50 L880,50 L880,30 L900,30 L900,40 L920,40 L920,20 L940,20 L940,40 L960,40 L960,50 L980,50 L980,30 L1000,30 L1000,50 L1020,50 L1020,40 L1040,40 L1040,20 L1060,20 L1060,40 L1080,40 L1080,30 L1100,30 L1100,50 L1120,50 L1120,40 L1140,40 L1140,20 L1160,20 L1160,30 L1180,30 L1180,50 L1200,50 L1200,80 Z"
                      fill="#1F2937"
                    />
                    {Array.from({ length: 30 }).map((_, i) => (
                      <rect
                        key={i}
                        x={40 + i * 40}
                        y={30}
                        width="2"
                        height="2"
                        fill="#FEFCE8"
                        opacity={i % 2 === 0 ? 0.6 : 0}
                      />
                    ))}
                  </svg>
                </div>
                <motion.div
                  className="absolute top-10 left-1/2 transform -translate-x-1/2"
                  animate={{
                    x: [-80, 80],
                    y: [0, -3, 0],
                  }}
                  transition={{
                    x: {
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "mirror",
                      duration: 4,
                      ease: "easeInOut",
                    },
                    y: {
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 1.5,
                      ease: "easeInOut",
                    },
                  }}
                >
                  <Home className="h-12 w-12 text-white" />
                </motion.div>
              </>
            ) : (
              <>
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gray-800">
                  <div className="absolute top-1/2 left-0 right-0 h-2 flex">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="h-full bg-white"
                        style={{
                          width: "40px",
                          marginRight: "40px",
                        }}
                        animate={{
                          x: [0, -80],
                        }}
                        transition={{
                          repeat: Number.POSITIVE_INFINITY,
                          duration: 1,
                          ease: "linear",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <motion.div
                  className="absolute top-10 left-1/2 transform -translate-x-1/2"
                  animate={{
                    x: [-80, 80],
                    y: [0, -3, 0],
                  }}
                  transition={{
                    x: {
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "mirror",
                      duration: 3,
                      ease: "easeInOut",
                    },
                    y: {
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 0.5,
                      ease: "easeInOut",
                    },
                  }}
                >
                  <Car className="h-12 w-12 text-white" />
                </motion.div>
              </>
            )}
          </div>

          <div className="relative z-10 text-center text-white px-4 max-w-3xl mt-8">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
            >
              {c.hero}
            </motion.h1>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-2 bg-white rounded-full mx-auto mb-4 max-w-md"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl"
            >
              {loadingText}
            </motion.p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative w-full md:w-auto flex-1 max-w-md">
              <div className="relative">
                <div className="w-full h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-gray-700 px-4 py-2 rounded-full border border-gray-200">
                <Filter size={16} />
                <span className="font-medium">Filters</span>
                <ChevronDown size={14} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mb-8 flex justify-center">
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <span className="text-gray-700 font-medium">{c.loadingLabel}</span>
          <span className="text-primary font-bold">{progress}%</span>
        </div>
      </div>

      {variant === "house" && (
        <div className="container mx-auto px-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-8 bg-gray-200 rounded-full animate-pulse w-24"
              ></div>
            ))}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skeletonItems}
        </div>
      </div>
    </div>
  );
}
