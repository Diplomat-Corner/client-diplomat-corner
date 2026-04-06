"use client";

import { sendNotification } from "@/lib/actions/notification.actions";
import React, { FormEvent, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  X,
  Phone,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { EmailAddress } from "@clerk/nextjs/server";

interface ContactSellerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productType?: "car" | "house" | "item";
  sellerName?: string;
}

const ContactSellerDialog: React.FC<ContactSellerDialogProps> = ({
  isOpen,
  onClose,
  productType = "item",
  sellerName = "the seller",
}) => {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { userId } = useAuth();
  const { user } = useUser();
  const params = useParams();
  const productId = params.id as string;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPhoneNumber("");
      setDescription("");
      setIsSubmitted(false);
      setError(null);
    }
  }, [isOpen]);

  // Phone number validation
  const validatePhoneNumber = (phone: string): boolean => {
    // Basic international phone number regex
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(phone);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Client-side validation
    if (!userId) {
      setError("You must be logged in to contact sellers");
      return;
    }

    if (!productId) {
      setError("Invalid product ID");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError("Please enter a valid phone number (minimum 10 digits)");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a message");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Fetch product details to get seller's user ID
      const productResponse = await fetch(
        `/api/${productType === "car" ? "cars" : "house"}/${productId}`
      );

      if (!productResponse.ok) {
        throw new Error(
          `Failed to fetch product details: ${productResponse.status}`
        );
      }

      const productData = await productResponse.json();
      const toUserId = productData.userId;

      if (!toUserId) {
        throw new Error("Seller information not found");
      }

      // Create a new request
      const requestResponse = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromUserId: userId,
          toUserId,
          productId,
          itemType: productType,
          phoneNumber,
          message: description,
        }),
      });

      if (!requestResponse.ok) {
        throw new Error(`Failed to create request: ${requestResponse.status}`);
      }

      // Send notifications using direct API route
      if (productType === "car" || productType === "house") {
        // Get seller's push subscription
        const sellerSubscriptionResponse = await fetch(
          `/api/notifications?userId=${toUserId}`
        );
        const sellerSubscription = await sellerSubscriptionResponse.json();

        // Send notification to seller
        const sellerNotificationResponse = await fetch("/api/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: toUserId,
            title: "New Inquiry",
            message: `${
              user?.firstName || "A user"
            } has sent you an inquiry about your ${productType}.\n\nPhone: ${phoneNumber}\n\nMessage:\n${description}\n\nEmail: ${
              user?.emailAddresses
            }`,
            type: "request",
            category: productType,
            link: `/${productType}/${productId}`,
          }),
        });

        if (!sellerNotificationResponse.ok) {
          console.warn("Failed to send notification to seller");
        } else {
          // Get the created notification data
          const notificationData = await sellerNotificationResponse.json();

          // Only send push notification if we have a subscription
          if (sellerSubscription?.pushSubscription) {
            try {
              await fetch(sellerSubscription.pushSubscription.endpoint, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `vapid ${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}`,
                },
                body: JSON.stringify({
                  title: "New Inquiry",
                  body: `${
                    user?.firstName || "A user"
                  } has sent you an inquiry about your ${productType}`,
                  icon: "/icon.png",
                  badge: "/badge.png",
                  data: {
                    url: `/${productType}/${productId}`,
                    notificationId: notificationData._id,
                  },
                }),
              });
            } catch (error) {
              console.error(
                "Failed to send push notification to seller:",
                error
              );
            }
          }
        }

        // Get buyer's push subscription
        const buyerSubscriptionResponse = await fetch(
          `/api/notifications?userId=${userId}`
        );
        const buyerSubscription = await buyerSubscriptionResponse.json();

        // Send notification to buyer
        const buyerNotificationResponse = await fetch("/api/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            title: "Inquiry Sent",
            message: `Your inquiry about the ${productType} has been sent successfully.\n\nYour Message:\n${description}`,
            type: "request",
            category: productType,
            link: `/${productType}/${productId}`,
          }),
        });

        if (!buyerNotificationResponse.ok) {
          console.warn("Failed to send notification to buyer");
        } else {
          // Get the created notification data
          const notificationData = await buyerNotificationResponse.json();

          // Only send push notification if we have a subscription
          if (buyerSubscription?.pushSubscription) {
            try {
              await fetch(buyerSubscription.pushSubscription.endpoint, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `vapid ${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}`,
                },
                body: JSON.stringify({
                  title: "Inquiry Sent",
                  body: `Your inquiry about the ${productType} has been sent successfully`,
                  icon: "/icon.png",
                  badge: "/badge.png",
                  data: {
                    url: `/${productType}/${productId}`,
                    notificationId: notificationData._id,
                  },
                }),
              });
            } catch (error) {
              console.error(
                "Failed to send push notification to buyer:",
                error
              );
            }
          }
        }
      }

      setIsSubmitted(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 3000);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send your message. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Product type specific details
  const getProductDetails = () => {
    switch (productType) {
      case "car":
        return {
          title: "Contact About This Vehicle",
          icon: "🚗",
        };
      case "house":
        return {
          title: "Contact About This Property",
          icon: "🏠",
        };
      default:
        return {
          title: "Contact Seller",
          icon: "📦",
        };
    }
  };

  const details = getProductDetails();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
            role="dialog"
            aria-labelledby="dialog-title"
            aria-modal="true"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            <div className="p-6">
              {isSubmitted ? (
                /* Success state */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center text-center py-6"
                >
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3
                    id="dialog-title"
                    className="text-xl font-bold text-gray-900 mb-2"
                  >
                    Message Sent!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Your message has been sent to {sellerName}. They will
                    contact you soon at the phone number provided.
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Close
                  </button>
                </motion.div>
              ) : (
                /* Form state */
                <>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-3">
                      <span className="text-2xl">{details.icon}</span>
                    </div>
                    <h3
                      id="dialog-title"
                      className="text-xl font-bold text-gray-900"
                    >
                      {details.title}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Send your contact information to {sellerName}
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Your Phone Number
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            id="phone"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50"
                            placeholder="+251 (911) 123-4567"
                            disabled={isSubmitting}
                            required
                            aria-describedby={error ? "phone-error" : undefined}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="description"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Message
                        </label>
                        <div className="relative">
                          <div className="absolute top-3 left-3 pointer-events-none">
                            <MessageSquare className="h-5 w-5 text-gray-400" />
                          </div>
                          <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50"
                            placeholder={`I'm interested in this ${productType}. Please contact me.`}
                            rows={4}
                            disabled={isSubmitting}
                            required
                            aria-describedby={
                              error ? "description-error" : undefined
                            }
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-5 w-5" />
                            Send Message
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  <p className="text-xs text-gray-500 mt-4 text-center">
                    By sending this message, you agree to share your contact
                    information with the seller.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContactSellerDialog;
