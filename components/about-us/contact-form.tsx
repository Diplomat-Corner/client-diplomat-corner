"use client";

import type React from "react";
import { useState, useTransition, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  MapPin,
  Twitter,
  Instagram,
  Github,
  CheckCircle,
  Circle,
  Send,
  Loader2,
  Facebook,
} from "lucide-react";
import Link from "next/link";
import { MessageSubject } from "@/lib/models/message.model";
import { useAuth } from "@clerk/nextjs";
import { RiTelegram2Line } from "react-icons/ri";
import { FaWhatsapp } from "react-icons/fa6";

const ContactForm: React.FC = () => {
  const { userId } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "General Inquiry" as MessageSubject,
    message: "",
  });
  const [wordCount, setWordCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    errors?: Record<string, string>[];
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Add a window resize listener to check for mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on initial load
    checkIsMobile();

    // Add event listener for resize
    window.addEventListener("resize", checkIsMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "message") {
      const words = value.trim() ? value.trim().split(/\s+/) : [];
      const wordCount = words.length;
      setWordCount(wordCount);

      // If word count exceeds 300, truncate the message
      if (wordCount > 300) {
        const truncatedMessage = words.slice(0, 300).join(" ");
        setFormData((prev) => ({ ...prev, message: truncatedMessage }));
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const originalMessage = formData.message;
    startTransition(async () => {
      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        setSubmitResult(result);

        if (result.success) {
          setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            subject: "General Inquiry",
            message: "",
          });
          setWordCount(0);

          if (userId) {
            try {
              const notificationPayload = {
                userId,
                title: "Message Sent Successfully",
                message: `Your message regarding "${formData.subject}" has been received:\n\n"${originalMessage}"`,
                type: "message" as const,
                category: "system" as const,
                link: "/notifications",
              };

              const notificationResponse = await fetch("/api/notifications", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(notificationPayload),
              });

              if (!notificationResponse.ok) {
                console.warn("Failed to create notification record in DB.");
              } else {
                const notificationData = await notificationResponse.json();

                const subscriptionResponse = await fetch(
                  `/api/notifications?userId=${userId}`
                );
                if (subscriptionResponse.ok) {
                  const subscriptionData = await subscriptionResponse.json();

                  if (subscriptionData?.pushSubscription) {
                    try {
                      await fetch(subscriptionData.pushSubscription.endpoint, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `vapid ${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}`,
                        },
                        body: JSON.stringify({
                          title: "Message Sent Successfully",
                          body: `Your message has been received.`,
                          icon: "/icon.png",
                          badge: "/badge.png",
                          data: {
                            url: "/notifications",
                            notificationId: notificationData._id,
                          },
                        }),
                      });
                    } catch (pushError) {
                      console.error(
                        "Failed to send push notification:",
                        pushError
                      );
                    }
                  }
                } else {
                  console.warn("Failed to fetch user subscription details.");
                }
              }
            } catch (notificationError) {
              console.error("Error handling notification:", notificationError);
            }
          }
        }
      } catch (error) {
        setSubmitResult({
          success: false,
          message: "An unexpected error occurred. Please try again.",
        });
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl bg-white shadow-md border border-gray-100"
    >
      <div className={`flex flex-wrap ${isMobile ? "flex-col-reverse" : ""}`}>
        <div
          className={`relative ${
            isMobile
              ? "w-full p-6"
              : "w-full bg-primary p-6 text-white md:w-2/5 lg:p-8"
          }`}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={isMobile ? "mt-8 border-t border-gray-200 pt-8" : ""}
          >
            <h2
              className={`mb-4 text-xl font-bold ${
                isMobile ? "text-gray-900" : "text-white"
              }`}
            >
              Contact Information
            </h2>
            <p
              className={`mb-8 ${
                isMobile ? "text-gray-600" : "text-white/80"
              } text-sm`}
            >
              Have questions or feedback? We&apos;re here to help!
            </p>

            <ul className="space-y-5">
              <li className="flex items-center">
                <div
                  className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full ${
                    isMobile ? "bg-primary/10 text-primary" : "bg-white/10"
                  }`}
                >
                  <Phone className="h-4 w-4" />
                </div>
                <span
                  className={`text-sm ${
                    isMobile ? "text-gray-700" : "text-white"
                  }`}
                >
                  +251 911 10 8874
                </span>
              </li>
              <li className="flex items-center">
                <div
                  className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full ${
                    isMobile ? "bg-primary/10 text-primary" : "bg-white/10"
                  }`}
                >
                  <Mail className="h-4 w-4" />
                </div>
                <span
                  className={`text-sm ${
                    isMobile ? "text-gray-700" : "text-white"
                  }`}
                >
                  contact@diplomatcorner.net
                </span>
              </li>
              <li className="flex items-center">
                <div
                  className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full ${
                    isMobile ? "bg-primary/10 text-primary" : "bg-white/10"
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                </div>
                <span
                  className={`text-sm ${
                    isMobile ? "text-gray-700" : "text-white"
                  }`}
                >
                  Addis Ababa, Jemo, Express Plaza
                </span>
              </li>
            </ul>

            <div
              className={`${
                isMobile ? "mt-6 flex" : "absolute bottom-6 left-6 flex"
              } space-x-3`}
            >
              <Link
                href="https://web.facebook.com/groups/136633776901724"
                target="_blank"
                className={`rounded-full ${
                  isMobile
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "bg-white/10 hover:bg-white/20"
                } p-2 transition-colors`}
              >
                <Facebook className="h-4 w-4" />
              </Link>
              <Link
                href="https://t.me/DiplomatCorner"
                target="_blank"
                className={`rounded-full ${
                  isMobile
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "bg-white/10 hover:bg-white/20"
                } p-2 transition-colors`}
              >
                <RiTelegram2Line className="h-4 w-4" />
              </Link>
              <Link
                href="tel:+251945331111"
                target="_blank"
                className={`rounded-full ${
                  isMobile
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "bg-white/10 hover:bg-white/20"
                } p-2 transition-colors`}
              >
                <FaWhatsapp className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          {/* Decorative elements - only show on non-mobile */}
          {!isMobile && (
            <>
              <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full border border-white/10 opacity-20"></div>
              <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full border border-white/10 opacity-20"></div>
            </>
          )}
        </div>

        <div className={`w-full p-6 ${!isMobile ? "md:w-3/5 lg:p-8" : ""}`}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {submitResult && submitResult.success ? (
              <div className="flex h-full flex-col items-center justify-center py-8">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900">
                  Message Sent!
                </h3>
                <p className="mb-6 text-center text-gray-600 text-sm">
                  {submitResult.message}
                </p>
                <button
                  onClick={() => setSubmitResult(null)}
                  className="rounded-lg bg-primary px-5 py-2 text-sm text-white transition-colors hover:bg-primary/90"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-1 block text-xs font-medium text-gray-700"
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      required
                      className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      onChange={handleChange}
                      value={formData.firstName}
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="mb-1 block text-xs font-medium text-gray-700"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      required
                      className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      onChange={handleChange}
                      value={formData.lastName}
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1 block text-xs font-medium text-gray-700"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      onChange={handleChange}
                      value={formData.email}
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-1 block text-xs font-medium text-gray-700"
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      required
                      className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      onChange={handleChange}
                      value={formData.phone}
                      disabled={isPending}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Select Subject
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        "General Inquiry",
                        "To promote Ads",
                        "Want admin",
                        "Technical support",
                        "Customer Support",
                      ] as const
                    ).map((option) => (
                      <button
                        key={option}
                        type="button"
                        disabled={isPending}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors mb-1 ${
                          formData.subject === option
                            ? "bg-primary text-white"
                            : "border border-gray-200 bg-white text-gray-700 hover:border-primary/50 hover:bg-gray-50"
                        }`}
                        onClick={() =>
                          setFormData({ ...formData, subject: option })
                        }
                      >
                        {formData.subject === option ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Circle className="h-3 w-3" />
                        )}
                        <span>{option}</span>
                      </button>
                    ))}
                  </div>
                  <input
                    type="hidden"
                    name="subject"
                    value={formData.subject}
                  />
                </div>

                <div className="mb-5">
                  <label
                    htmlFor="message"
                    className="mb-1 block text-xs font-medium text-gray-700"
                  >
                    Message
                  </label>
                  <div className="relative">
                    <textarea
                      name="message"
                      id="message"
                      rows={4}
                      required
                      className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      onChange={handleChange}
                      value={formData.message}
                      disabled={isPending}
                      maxLength={5000} // Safety character limit
                    />
                    <div
                      className={`absolute bottom-2 right-2 text-xs font-medium rounded-md px-1.5 py-0.5 ${
                        wordCount > 290
                          ? wordCount >= 300
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {wordCount}/300 words
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-70"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>

                  {submitResult && !submitResult.success && (
                    <div className="mt-3">
                      <p className="text-xs text-red-600">
                        {submitResult.message}
                      </p>
                      {submitResult.errors && (
                        <ul className="mt-1 list-disc pl-5 text-xs text-red-600">
                          {submitResult.errors.map((error, index) => (
                            <li key={index}>
                              {typeof error === "object" &&
                              error !== null &&
                              "message" in error
                                ? String(error.message)
                                : "Unknown error"}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ContactForm;
