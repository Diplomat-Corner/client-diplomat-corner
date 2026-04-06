"use client";

import { useState, Fragment, useEffect, useRef } from "react";
import {
  Star,
  ThumbsUp,
  MoreHorizontal,
  Trash2,
  Flag,
  Clock,
  AlertCircle,
  X,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { ReportType } from "@/lib/models/report.model";

interface ReviewCardProps {
  review: {
    _id: string;
    userId: string;
    userName: string;
    userImage?: string;
    rating: number;
    comment: string;
    createdAt: Date;
    likes: string[];
    isOwn?: boolean;
  };
  onLike: (id: string) => void;
  onDelete?: (id: string) => void;
  currentUserId?: string;
  isDeleting?: boolean;
  isLiking?: boolean;
}

type ReportOption = {
  value: ReportType;
  label: string;
  description: string;
};

export default function ReviewCard({
  review,
  onLike,
  onDelete,
  currentUserId,
  isDeleting = false,
  isLiking = false,
}: ReviewCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [liked, setLiked] = useState(
    currentUserId ? review.likes.includes(currentUserId) : false
  );
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [reportDescription, setReportDescription] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const likesCount =
    review.likes.length +
    (liked && !review.likes.includes(currentUserId || "") ? 1 : 0);

  const handleLike = () => {
    if (!liked && currentUserId && !isLiking) {
      setLiked(true);
      onLike(review._id);
    }
  };

  const reportOptions: ReportOption[] = [
    {
      value: "spam",
      label: "Spam",
      description: "Irrelevant or promotional content",
    },
    {
      value: "harassment",
      label: "Harassment or Bullying",
      description: "Content that is offensive or threatening",
    },
    {
      value: "inappropriate",
      label: "Inappropriate Content",
      description: "Obscene or offensive material",
    },
    {
      value: "misinformation",
      label: "Misinformation",
      description: "False or misleading information",
    },
    {
      value: "other",
      label: "Other",
      description: "Something else",
    },
  ];

  const handleOpenReportModal = () => {
    setShowOptions(false);
    setShowReportModal(true);
    setReportSuccess(false);
    setReportError("");
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setReportType(null);
    setReportDescription("");
    setReportError("");
  };

  const handleSubmitReport = async () => {
    if (!currentUserId) return;
    if (!reportType) {
      setReportError("Please select a reason for reporting");
      return;
    }

    try {
      setIsSubmittingReport(true);

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityType: "review",
          entityId: review._id,
          reportType,
          description: reportDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit report");
      }

      setReportSuccess(true);
      setReportType(null);
      setReportDescription("");

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        handleCloseReportModal();
      }, 3000);
    } catch (error) {
      setReportError(
        error instanceof Error ? error.message : "Failed to submit report"
      );
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(review.createdAt), {
    addSuffix: true,
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-4 hover:shadow-md transition-shadow relative ${
          isDeleting ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        {isDeleting && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm rounded-lg z-10">
            <div className="w-8 h-8 border-3 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
          </div>
        )}
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-green-100 to-green-300 flex items-center justify-center text-green-700 font-medium">
              {review.userImage ? (
                <Image
                  src={review.userImage || "/placeholder.svg"}
                  alt={review.userName}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                review.userName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="ml-3">
              <h4 className="font-medium text-gray-900">{review.userName}</h4>
              <div className="flex items-center mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={`${
                      i < review.rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-xs text-gray-500 ml-2 flex items-center">
                  <Clock size={12} className="mr-1" />
                  {timeAgo}
                </span>
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              disabled={isDeleting}
            >
              <MoreHorizontal size={18} className="text-gray-500" />
            </button>

            {showOptions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 top-8 bg-white shadow-lg rounded-lg py-2 w-36 z-10 border border-gray-100"
              >
                {review.isOwn && onDelete && (
                  <button
                    onClick={() => {
                      onDelete(review._id);
                      setShowOptions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center"
                    disabled={isDeleting}
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete
                  </button>
                )}
                {!review.isOwn && currentUserId && (
                  <button
                    onClick={handleOpenReportModal}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    disabled={isDeleting}
                  >
                    <Flag size={14} className="mr-2" />
                    Report
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>

        <p className="text-gray-700 my-3 text-sm leading-relaxed">
          {review.comment}
        </p>

        <div className="flex items-center justify-end">
          <button
            onClick={handleLike}
            disabled={!currentUserId || liked || isDeleting || isLiking}
            className={`flex items-center text-sm ${
              liked ? "text-green-600" : "text-gray-500 hover:text-green-600"
            } transition-colors ${
              !currentUserId || liked || isDeleting || isLiking
                ? "cursor-default"
                : "cursor-pointer"
            }`}
          >
            {isLiking ? (
              <div className="w-3 h-3 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin mr-2"></div>
            ) : (
              <ThumbsUp size={14} className="mr-1" />
            )}
            <span>{likesCount}</span>
          </button>
        </div>
      </motion.div>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 relative"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Report Review
                </h3>
                <button
                  onClick={handleCloseReportModal}
                  className="p-1 rounded-full hover:bg-gray-100"
                  disabled={isSubmittingReport}
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              {reportSuccess ? (
                <div className="flex flex-col items-center p-4 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <Check size={24} className="text-green-600" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-1">
                    Report Submitted
                  </h4>
                  <p className="text-sm text-gray-600 text-center">
                    Thank you for helping keep our community safe. We&apos;ll
                    review this content shortly.
                  </p>
                </div>
              ) : (
                <Fragment>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Please select a reason for reporting this review. Reports
                      are confidential.
                    </p>

                    {reportError && (
                      <div className="bg-red-50 p-3 rounded-md flex items-center text-red-700 mb-4">
                        <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                        <span className="text-sm">{reportError}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      {reportOptions.map((option) => (
                        <div
                          key={option.value}
                          onClick={() => setReportType(option.value)}
                          className={`cursor-pointer p-3 rounded-md border transition-colors ${
                            reportType === option.value
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-4 h-4 rounded-full border mr-2 flex items-center justify-center ${
                                reportType === option.value
                                  ? "border-primary"
                                  : "border-gray-400"
                              }`}
                            >
                              {reportType === option.value && (
                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                              )}
                            </div>
                            <span className="font-medium text-gray-800">
                              {option.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 ml-6">
                            {option.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {reportType === "other" && (
                    <div className="mb-4">
                      <label
                        htmlFor="report-description"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Additional details (optional)
                      </label>
                      <textarea
                        id="report-description"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="Please provide more details about your report..."
                        disabled={isSubmittingReport}
                      ></textarea>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={handleCloseReportModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                      disabled={isSubmittingReport}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitReport}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md flex items-center"
                      disabled={isSubmittingReport}
                    >
                      {isSubmittingReport ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        "Submit Report"
                      )}
                    </button>
                  </div>
                </Fragment>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
