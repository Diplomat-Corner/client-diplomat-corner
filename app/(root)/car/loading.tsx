"use client";

import { motion } from "framer-motion";
import { Car, Search, Filter, Loader2, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

export default function LoadingSkeleton() {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(
    "Searching for the best cars..."
  );

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
      setLoadingText("Searching for the best cars...");
    } else if (progress < 60) {
      setLoadingText("Preparing vehicle information...");
    } else if (progress < 90) {
      setLoadingText("Almost ready...");
    } else {
      setLoadingText("Finalizing results...");
    }
  }, [progress]);

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
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite ease-in-out;
        }
      `}</style>

      <div className="container mx-auto px-4 mb-8">
        <div className="relative min-h-96 bg-gradient-to-r from-primary/80 to-primary/40 rounded-xl overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 overflow-hidden">
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
          </div>

          <div className="relative z-10 text-center text-white px-4 max-w-3xl mt-8">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
            >
              Finding Your Perfect Car
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
          <span className="text-gray-700 font-medium">Loading cars...</span>
          <span className="text-primary font-bold">{progress}%</span>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skeletonItems}
        </div>
      </div>
    </div>
  );
}
