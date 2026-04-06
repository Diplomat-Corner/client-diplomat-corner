"use client";

import { motion } from "framer-motion";
import {
  Car,
  ArrowLeft,
  User,
  Calendar,
  Gauge,
  Fuel,
  Settings,
  DollarSign,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CarDetailLoadingSkeleton() {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Loading vehicle details...");

  // Simulate loading progress
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

  // Update loading text based on progress
  useEffect(() => {
    if (progress < 30) {
      setLoadingText("Loading vehicle details...");
    } else if (progress < 60) {
      setLoadingText("Fetching specifications...");
    } else if (progress < 90) {
      setLoadingText("Preparing images...");
    } else {
      setLoadingText("Almost ready...");
    }
  }, [progress]);

  return (
    <div className="min-h-screen bg-gray-50 pt-5 pb-16">
      <div className="container mx-auto px-4">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/car-for-sale"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to listings</span>
          </Link>
        </div>

        {/* Loading indicator */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <span className="text-gray-700 font-medium">{loadingText}</span>
            <span className="text-primary font-bold">{progress}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Images */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Main image skeleton */}
              <div className="relative h-80 bg-gray-200 animate-pulse overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 1.5,
                    ease: "linear",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Car className="h-20 w-20 text-gray-300" />
                </div>
              </div>

              {/* Thumbnail skeletons */}
              <div className="p-4 grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 bg-gray-200 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            </div>

            {/* Description skeleton */}
            <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
              <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            </div>
          </div>

          {/* Right column - Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Title and price skeletons */}
              <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2 mb-6"></div>

              {/* Specs skeletons */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-300" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-gray-300" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-1/3"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Gauge className="h-5 w-5 text-gray-300" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-2/5"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Fuel className="h-5 w-5 text-gray-300" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-1/4"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Settings className="h-5 w-5 text-gray-300" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-2/5"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-gray-300" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-1/3"></div>
                </div>
              </div>

              {/* Contact button skeleton */}
              <div className="h-12 bg-gray-200 rounded-lg animate-pulse w-full mb-4"></div>

              {/* Share button skeleton */}
              <div className="h-12 bg-gray-200 rounded-lg animate-pulse w-full"></div>
            </div>
          </div>
        </div>

        {/* Car animation */}
        <div className="fixed bottom-10 right-10">
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 1.5,
              ease: "easeInOut",
            }}
          >
            <div className="relative">
              <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl"></div>
              <div className="relative bg-white p-4 rounded-full shadow-lg">
                <Car className="h-8 w-8 text-primary" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
