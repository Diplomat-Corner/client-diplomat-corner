"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import {
  Bell,
  Car,
  Check,
  ChevronDown,
  Clock,
  Home,
  Info,
  MessageSquare,
  Settings,
  ShieldAlert,
  Trash2,
  User,
  Phone,
  Mail,
} from "lucide-react";
import {
  INotification,
  NotificationType,
  NotificationCategory,
} from "@/types/notifications";
import { useTabActive } from "@/hooks/use-tab-active";

interface FormattedMessageProps {
  message: string;
}

// Helper function to convert base64 to Uint8Array for Web Push
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const FormattedMessage: React.FC<FormattedMessageProps> = ({ message }) => {
  // Return null if message is empty or only whitespace
  if (!message || !message.trim()) {
    return null;
  }

  const lines = message.split("\n");

  // Check if this is an inquiry message
  const isInquiry = message.includes("has sent you an inquiry");

  if (isInquiry) {
    // Extract key information
    const firstLine = lines[0] || "";
    const nameMatch = firstLine.match(/^(.+?) has sent/);
    const name = nameMatch ? nameMatch[1] : "Unknown";
    const initial = name && name[0] ? name[0].toUpperCase() : "?";

    // Find product type
    const productTypeMatch = firstLine.match(/about your (.+?)\./);
    const productType = productTypeMatch ? productTypeMatch[1] : "listing";

    // Extract contact info and message content
    const phoneIndex = lines.findIndex((line) =>
      line.trim().startsWith("Phone:")
    );
    const emailIndex = lines.findIndex((line) =>
      line.trim().startsWith("Email:")
    );
    const messageIndex = lines.findIndex((line) => line.trim() === "Message:");

    const phone =
      phoneIndex >= 0 ? lines[phoneIndex].replace("Phone:", "").trim() : "";
    const email =
      emailIndex >= 0 ? lines[emailIndex].replace("Email:", "").trim() : "";

    // Get the actual message content
    let messageContent = "";
    if (messageIndex >= 0 && messageIndex < lines.length - 1) {
      const nextNonContentIndex =
        [phoneIndex, emailIndex].filter((i) => i > messageIndex).sort()[0] ||
        lines.length;
      messageContent = lines
        .slice(messageIndex + 1, nextNonContentIndex)
        .join("\n")
        .trim();
    }

    // Only render if we have meaningful content
    if (!name && !productType && !phone && !email && !messageContent) {
      return null;
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* Sender info with animation */}
        {name && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-3"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white shadow-sm"
            >
              {initial}
            </motion.div>
            <div>
              <div className="font-medium text-gray-900">{name}</div>
              {productType && (
                <div className="text-sm text-gray-500">
                  Inquiry about your{" "}
                  <span className="text-primary font-medium">
                    {productType}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Message content */}
        {messageContent && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-50 p-4 rounded-lg border border-gray-100"
          >
            <div className="text-gray-600 whitespace-pre-line">
              {messageContent}
            </div>
          </motion.div>
        )}

        {/* Contact buttons */}
        {(phone || email) && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2"
          >
            {phone && (
              <motion.a
                href={`tel:${phone}`}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-gray-700 hover:border-primary/30 hover:text-primary transition-colors shadow-sm"
              >
                <Phone className="w-4 h-4" />
                <span>{phone}</span>
              </motion.a>
            )}

            {email && (
              <motion.a
                href={`mailto:${email}`}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-gray-700 hover:border-primary/30 hover:text-primary transition-colors shadow-sm"
              >
                <Mail className="w-4 h-4" />
                <span className="truncate max-w-[200px]">{email}</span>
              </motion.a>
            )}
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Non-inquiry message formatting
  const formattedLines = lines
    .map((line, index) => {
      // Skip empty lines
      if (!line.trim()) return null;

      // Style phone number
      if (line.startsWith("Phone:")) {
        const [label, phone] = line.split(": ");
        return phone ? (
          <div
            key={index}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-3"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Phone className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-0.5">{label}</div>
              <div className="font-medium text-gray-900">{phone}</div>
            </div>
          </div>
        ) : null;
      }

      // Style email
      if (line.startsWith("Email:")) {
        const [label, email] = line.split(": ");
        return email ? (
          <div
            key={index}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-3"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-0.5">{label}</div>
              <div className="font-medium text-gray-900">{email}</div>
            </div>
          </div>
        ) : null;
      }

      // Style message content
      if (line.startsWith("Message:")) {
        const nextLine = lines[index + 1];
        return nextLine ? (
          <div key={index} className="mt-4">
            <div className="text-xs text-gray-500 mb-2">Message</div>
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
              <MessageSquare className="w-4 h-4 text-primary mb-2" />
              <div className="text-gray-700 whitespace-pre-wrap">
                {nextLine}
              </div>
            </div>
          </div>
        ) : null;
      }

      return (
        <div key={index} className="text-gray-600">
          {line}
        </div>
      );
    })
    .filter(Boolean);

  // Return null if no meaningful content
  if (formattedLines.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 animate-in fade-in duration-300">
      {formattedLines}
    </div>
  );
};

export default function Notifications() {
  const { user, isLoaded } = useUser();
  const isTabActive = useTabActive();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [expandedNotification, setExpandedNotification] = useState<
    string | null
  >(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  // Wrap subscribeToPushNotifications in useCallback
  const subscribeToPushNotifications = useCallback(async () => {
    if (!isLoaded || !user) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
        ),
      });

      // Store the subscription on the server
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          subscription,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to store subscription");
      }
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
    }
  }, [isLoaded, user]);

  // Initial subscription to push notifications
  useEffect(() => {
    if (isLoaded && user) {
      subscribeToPushNotifications();
    }
  }, [isLoaded, user, subscribeToPushNotifications]);

  // Wrap fetchNotifications in useCallback
  const fetchNotifications = useCallback(async () => {
    if (!isLoaded || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/notifications?userId=${user.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
      const data = await response.json();
      setNotifications(data);
      setUnreadCount(data.filter((n: INotification) => !n.isRead).length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, setNotifications, setLoading]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Refresh notifications only when the tab becomes active again.
  const prevTabActiveRef = useRef<boolean>(isTabActive);
  useEffect(() => {
    if (prevTabActiveRef.current === false && isTabActive === true) {
      fetchNotifications();
    }
    prevTabActiveRef.current = isTabActive;
  }, [isTabActive, fetchNotifications]);

  // Update the badge count when notifications change
  useEffect(() => {
    // Store unread count in localStorage when it changes
    const unreadCount = notifications.filter(
      (notification) => !notification.isRead
    ).length;

    if (typeof window !== "undefined") {
      // Update localStorage with current unread count
      localStorage.setItem("unreadNotificationsCount", unreadCount.toString());

      // Dispatch event to notify other components
      const event = new CustomEvent("unreadNotificationsUpdate", {
        detail: { count: unreadCount },
      });
      window.dispatchEvent(event);

      // Update document title to show notification count
      if (unreadCount > 0) {
        const originalTitle = document.title.replace(/^\(\d+\) /, "");
        document.title = `(${unreadCount}) ${originalTitle}`;
      } else {
        document.title = document.title.replace(/^\(\d+\) /, "");
      }
    }
  }, [notifications]);

  // Reset the badge when component unmounts (leaving the page)
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        // Don't reset localStorage - that should persist
        // But do update the document title
        document.title = document.title.replace(/^\(\d+\) /, "");
      }
    };
  }, []);

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return !notification.isRead;
    return notification.category === activeFilter;
  });

  // Mark notification as read
  const markAsRead = async (notification: INotification) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId: notification._id,
        }),
      });

      if (response.ok) {
        // Update the UI optimistically
        setNotifications(
          notifications.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
      } else {
        console.error("Failed to mark notification as read");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = filteredNotifications
        .filter((notification) => !notification.isRead)
        .map((notification) => notification._id);

      if (unreadIds.length === 0) return;

      // Use the regular notifications endpoint with a specific action
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "markAllRead",
          notificationIds: unreadIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to mark all notifications as read"
        );
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          unreadIds.includes(notification._id)
            ? { ...notification, isRead: true }
            : notification
        )
      );

      // The notifications state update will trigger the effect above
      // which will update localStorage and dispatch the event
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      alert("Failed to mark all notifications as read. Please try again.");
    }
  };

  // Delete notification
  const deleteNotification = async (notification: INotification) => {
    try {
      // Add ID to deletingIds to show loading state
      setDeletingIds((prev) => [...prev, notification._id]);

      const response = await fetch(
        `/api/notifications?id=${notification._id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Remove the notification from the UI
        setNotifications(
          notifications.filter((n) => n._id !== notification._id)
        );
        if (!notification.isRead) {
          setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
        }
      } else {
        console.error("Failed to delete notification");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    } finally {
      // Remove ID from deletingIds regardless of success/failure
      setDeletingIds((prev) => prev.filter((id) => id !== notification._id));
    }
  };

  // Toggle expanded notification
  const toggleExpanded = (id: string) => {
    if (expandedNotification === id) {
      setExpandedNotification(null);
    } else {
      setExpandedNotification(id);
      markAsRead(notifications.find((n) => n._id === id) as INotification);
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type: string, category?: string) => {
    switch (type) {
      case "message":
        return <MessageSquare size={20} />;
      case "alert":
        return category === "car" ? <Car size={20} /> : <Home size={20} />;
      case "update":
        return <Info size={20} />;
      case "system":
        return <Settings size={20} />;
      case "security":
        return <ShieldAlert size={20} />;
      case "request":
        return <Bell size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 pt-5 pb-16">
        <div className="container mx-auto px-2">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-gray-500">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-5 pb-16">
        <div className="container mx-auto px-2">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Please sign in to view notifications
              </h3>
              <p className="text-gray-500">
                You need to be signed in to access your notifications.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-5 pb-16">
      <div className="container mx-auto px-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Notifications
              </h1>
              <p className="text-gray-600">
                Stay updated with the latest activity and important alerts from
                Diplomat Corner.
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:text-primary hover:border-primary/50 transition-colors shadow-sm"
              >
                <Check size={16} />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === "all"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              All
              {activeFilter === "all" && notifications.length > 0 && (
                <span className="ml-2 bg-white text-primary rounded-full px-2 py-0.5 text-xs">
                  {notifications.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveFilter("unread")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === "unread"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    activeFilter === "unread"
                      ? "bg-white text-primary"
                      : "bg-primary text-white"
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveFilter("car")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === "car"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <span className="flex items-center">
                <Car size={16} className="mr-2" />
                Cars
              </span>
            </button>
            <button
              onClick={() => setActiveFilter("house")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === "house"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <span className="flex items-center">
                <Home size={16} className="mr-2" />
                Houses
              </span>
            </button>
            <button
              onClick={() => setActiveFilter("account")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === "account"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <span className="flex items-center">
                <User size={16} className="mr-2" />
                Account
              </span>
            </button>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-gray-500">Loading notifications...</p>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Bell size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                No notifications
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {activeFilter === "all"
                  ? "You don't have any notifications at the moment."
                  : `You don't have any ${
                      activeFilter === "unread" ? "unread" : activeFilter
                    } notifications at the moment.`}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <ul className="divide-y divide-gray-100">
                <AnimatePresence mode="popLayout">
                  {filteredNotifications.map((notification, index) => (
                    <motion.li
                      key={notification._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`${
                        expandedNotification === notification._id
                          ? "bg-gray-50"
                          : "bg-white"
                      } border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition-all duration-300 cursor-pointer ${
                        !notification.isRead
                          ? "border-l-4 border-l-primary"
                          : ""
                      }`}
                      onClick={() => {
                        if (expandedNotification === notification._id) {
                          setExpandedNotification(null);
                        } else {
                          setExpandedNotification(notification._id);
                          if (!notification.isRead) {
                            markAsRead(notification);
                          }
                        }
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-2 rounded-full ${
                            notification.isRead
                              ? "bg-gray-100"
                              : "bg-primary/10"
                          }`}
                        >
                          <span
                            className={
                              notification.isRead
                                ? "text-gray-500"
                                : "text-primary"
                            }
                          >
                            {getNotificationIcon(
                              notification.type,
                              notification.category
                            )}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h3
                              className={`text-sm font-medium ${
                                notification.isRead
                                  ? "text-gray-700"
                                  : "text-gray-900"
                              }`}
                            >
                              {notification.title}
                            </h3>
                            <div className="flex items-center ml-4">
                              <span className="text-xs text-gray-500 whitespace-nowrap flex items-center">
                                <Clock size={12} className="mr-1" />
                                {new Date(
                                  notification.createdAt
                                ).toLocaleDateString()}
                              </span>
                              <ChevronDown
                                size={16}
                                className={`ml-2 text-gray-400 transition-transform ${
                                  expandedNotification === notification._id
                                    ? "rotate-180"
                                    : ""
                                }`}
                              />
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                            {notification.message}
                          </p>
                        </div>
                      </div>

                      {/* Expanded content */}
                      <AnimatePresence>
                        {expandedNotification === notification._id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="px-6 pb-4 pt-0"
                          >
                            <div className="ml-12">
                              <div className="bg-gray-50 rounded-lg p-4">
                                <FormattedMessage
                                  message={notification.message}
                                />
                              </div>
                              <div className="flex items-center justify-between mt-4">
                                {notification.link && (
                                  <a
                                    href={notification.link}
                                    className="text-sm text-primary hover:text-primary/80 font-medium"
                                  >
                                    View Requested Product
                                  </a>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification);
                                  }}
                                  className="text-sm text-gray-500 hover:text-red-500 flex items-center"
                                  disabled={deletingIds.includes(
                                    notification._id
                                  )}
                                >
                                  {deletingIds.includes(notification._id) ? (
                                    <>
                                      <div className="w-4 h-4 mr-2 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
                                      Deleting...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 size={16} className="mr-1" />
                                      Delete
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
