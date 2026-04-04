"use client";

import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

export default function MaintenancePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  const iconVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.8,
      },
    },
  };

  return (
    <div className="relative min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-3xl mx-auto">
        <motion.div
          className="text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="flex items-center justify-center mb-8"
            variants={iconVariants}
          >
            <div className="relative">
              <div className="text-[10rem] md:text-[12rem] font-bold text-gray-100 leading-none select-none">
                !
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-[5rem] md:text-[6rem] font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text leading-none">
                  !
                </div>
              </div>
            </div>
          </motion.div>

          <motion.h1
            className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
            variants={itemVariants}
          >
            Under maintenance
          </motion.h1>

          <motion.p
            className="text-gray-600 mb-8 max-w-md mx-auto"
            variants={itemVariants}
          >
            We&apos;re improving things behind the scenes. Please check back
            shortly we&apos;ll be up and running again soon.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            variants={itemVariants}
          >
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors shadow-sm hover:shadow-md"
            >
              <RefreshCw className="w-5 h-5" aria-hidden />
              <span>Try again</span>
            </button>
          </motion.div>
        </motion.div>

        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-[-1]">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
}
