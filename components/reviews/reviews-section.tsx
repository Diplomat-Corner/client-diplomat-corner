"use client";

import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { motion } from "framer-motion";
import { MessageSquare, AlertCircle } from "lucide-react";
import ReviewCard from "./review-card";
import ReviewForm from "./review-form";
import Link from "next/link";
import { Star } from "lucide-react";

interface Review {
  _id: string;
  userId: string;
  userName: string;
  userImage?: string;
  targetUserId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  productId: string;
  likes: string[];
}

/** Loose row from GET /api/reviews */
interface ReviewApiRow {
  _id?: unknown;
  userId?: string;
  userName?: string;
  user?: { firstName?: string; lastName?: string };
  userImage?: string;
  targetUserId?: string;
  rating?: unknown;
  comment?: unknown;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  productId?: string;
  likes?: unknown;
}

interface ReviewsSectionProps {
  productId: string;
  productType: "car" | "house";
  sellerId?: string;
}

function normalizeMongoId(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (
    raw &&
    typeof raw === "object" &&
    "$oid" in raw &&
    typeof (raw as { $oid: string }).$oid === "string"
  ) {
    return (raw as { $oid: string }).$oid;
  }
  return raw == null ? "" : String(raw);
}

function normalizeLikes(raw: unknown): string[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

export default function ReviewsSection({
  productId,
  productType,
  sellerId,
}: ReviewsSectionProps) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [likingReviewId, setLikingReviewId] = useState<string | null>(null);
  const userId = user?.id;

  const {
    data: reviews = [],
    isLoading: loading,
    isError,
  } = useQuery({
    queryKey: queryKeys.reviews(productId, productType),
    enabled: Boolean(productId?.trim()),
    queryFn: async () => {
      const q = encodeURIComponent(productId);
      const response = await fetch(`/api/reviews?productId=${q}`);
      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }
      const data = await response.json();
      const list: ReviewApiRow[] = Array.isArray(data)
        ? data
        : data &&
            typeof data === "object" &&
            Array.isArray((data as { reviews?: unknown }).reviews)
          ? ((data as { reviews: ReviewApiRow[] }).reviews ?? [])
          : [];
      return list.map((review): Review => {
        const u = review.user;
        const fromUser =
          u && `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
        const userName =
          (typeof review.userName === "string" && review.userName.trim()) ||
          fromUser ||
          "Anonymous User";
        const n = Number(review.rating);
        const rating = Number.isFinite(n) ? n : 0;
        const createdRaw = review.createdAt;
        const createdAt =
          createdRaw instanceof Date
            ? createdRaw
            : new Date(
                typeof createdRaw === "string" || typeof createdRaw === "number"
                  ? createdRaw
                  : ""
              );
        const updatedRaw = review.updatedAt;
        const updatedAtParsed =
          updatedRaw instanceof Date
            ? updatedRaw
            : new Date(
                typeof updatedRaw === "string" ? updatedRaw : ""
              );
        const updatedAt = Number.isFinite(updatedAtParsed.getTime())
          ? updatedAtParsed
          : createdAt;
        return {
          ...review,
          _id: normalizeMongoId(review._id),
          userId: typeof review.userId === "string" ? review.userId : "",
          targetUserId:
            typeof review.targetUserId === "string" ? review.targetUserId : "",
          productId: typeof review.productId === "string" ? review.productId : "",
          likes: normalizeLikes(review.likes),
          userName,
          rating,
          comment: typeof review.comment === "string" ? review.comment : "",
          createdAt: Number.isFinite(createdAt.getTime())
            ? createdAt
            : new Date(),
          updatedAt,
        } as Review;
      });
    },
  });

  const error = isError ? "Failed to load reviews" : "";

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const rated = reviews.filter((r) => Number.isFinite(r.rating) && r.rating > 0);
    if (rated.length === 0) return 0;
    const total = rated.reduce((sum, r) => sum + r.rating, 0);
    return Number.parseFloat((total / rated.length).toFixed(1));
  }, [reviews]);

  const hasUserReviewed = useMemo(() => {
    if (!user) return false;
    return reviews.some((r) => r.userId === user.id);
  }, [reviews, user]);

  const handleSubmitReview = async (reviewData: {
    rating: number;
    comment: string;
    productId: string;
  }) => {
    if (!user) return;

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...reviewData,
          userId: user.id,
          targetUserId: sellerId || "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      await response.json();

      // Recalculate average rating
      void queryClient.invalidateQueries({
        queryKey: queryKeys.reviews(productId, productType),
      });
    } catch (err) {
      console.error("Error submitting review:", err);
      throw err;
    }
  };

  const handleLikeReview = async (reviewId: string) => {
    if (!userId) return; // Don't proceed if no user is logged in

    try {
      // Set the liking status
      setLikingReviewId(reviewId);

      const response = await fetch(`/api/reviews/${reviewId}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to like review");
      }

      void queryClient.invalidateQueries({
        queryKey: queryKeys.reviews(productId, productType),
      });
    } catch (err) {
      console.error("Error liking review:", err);
    } finally {
      // Clear the liking status
      setLikingReviewId(null);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      // Set the deleting status
      setDeletingReviewId(reviewId);

      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete review");
      }

      void queryClient.invalidateQueries({
        queryKey: queryKeys.reviews(productId, productType),
      });
    } catch (err) {
      console.error("Error deleting review:", err);
    } finally {
      // Clear the deleting status
      setDeletingReviewId(null);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <section className="mt-12 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Reviews & Ratings
      </h2>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg flex items-center text-red-700 mb-6">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center">
              <div className="flex-1">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">
                    {averageRating}
                  </span>
                  <span className="text-lg text-gray-500 ml-2">/ 5</span>
                </div>
                <div className="flex items-center mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star}>
                      <svg
                        className={`w-5 h-5 ${
                          star <= Math.round(averageRating)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </span>
                  ))}
                  <span className="ml-2 text-sm text-gray-500">
                    Based on {reviews.length} review
                    {reviews.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="mt-4 md:mt-0">
                <div className="flex flex-col space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews.filter(
                      (review) => review.rating === star
                    ).length;
                    const percentage =
                      reviews.length > 0 ? (count / reviews.length) * 100 : 0;

                    return (
                      <div key={star} className="flex items-center">
                        <span className="text-xs text-gray-600 w-6">
                          {star}
                        </span>
                        <div className="w-32 h-2 mx-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {!user ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="my-5 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-100 mt-8"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Share Your Experience
                  </h3>
                  <p className="text-gray-600">
                    Your review helps others make better decisions. Sign in to
                    leave a review for this {productType}.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Sign In to Review
                    </motion.div>
                  </Link>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Your review will be public</span>
                </div>

                <div className="flex items-center">
                  <div className="text-sm text-gray-500 mr-2">
                    Preview rating:
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.div
                        key={star}
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Star className="w-5 h-5 text-gray-300 cursor-not-allowed" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <></>
          )}

          {user && !hasUserReviewed && (
            <ReviewForm
              productId={productId}
              productType={productType}
              onSubmit={handleSubmitReview}
            />
          )}

          {reviews.length > 0 ? (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {reviews.map((review) => (
                <ReviewCard
                  key={review._id}
                  review={{
                    ...review,
                    isOwn: user?.id === review.userId,
                  }}
                  onLike={handleLikeReview}
                  onDelete={
                    user?.id === review.userId ? handleDeleteReview : undefined
                  }
                  currentUserId={userId}
                  isDeleting={deletingReviewId === review._id}
                  isLiking={likingReviewId === review._id}
                />
              ))}
            </motion.div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <MessageSquare size={40} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                No Reviews Yet
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Be the first to review this {productType}! Share your experience
                to help others make informed decisions.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
