"use client";

import type React from "react";

import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "./ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import MaxWidthWrapper from "./max-width-wrapper";
import { Bell, Loader2, Menu, Search } from "lucide-react";
import { useTabActive } from "@/hooks/use-tab-active";

// Define the type for search results based on your API response
interface SearchResult {
  id: string;
  name: string;
  type: "car" | "house";
}

interface NavItem {
  label: string;
  href: string;
  children?: NavItem[]; // Optional nested items
  isAdmin?: boolean; // Optional flag for admin-only items
  isAuth?: boolean;
  name: string;
  type: "car" | "house";
}

const NavBar: React.FC = () => {
  const { user, isLoaded } = useUser();
  const isTabActive = useTabActive();
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notificationCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const lastCheckTime = useRef<Date>(new Date());

  // Set up notification checking when user data loads
  useEffect(() => {
    if (!isLoaded) return;

    if (typeof window !== "undefined") {
      const storedCount = localStorage.getItem("unreadNotificationsCount");
      if (storedCount) {
        setUnreadNotifications(Number.parseInt(storedCount));
      }
    }

    const handleNotificationUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ count: number }>;
      if (customEvent.detail && typeof customEvent.detail.count === "number") {
        setUnreadNotifications(customEvent.detail.count);
      }
    };

    window.addEventListener("unreadNotificationsUpdate", handleNotificationUpdate);

    return () => {
      window.removeEventListener("unreadNotificationsUpdate", handleNotificationUpdate);
    };
  }, [isLoaded, user]);

  // Reset notification count when user visits notifications page
  useEffect(() => {
    const handleRouteChange = () => {
      if (user && window.location.pathname === "/notifications") {
        // Reset the counter after a small delay (to allow for page transition)
        setTimeout(() => {
          setUnreadNotifications(0);
          // Update localStorage
          localStorage.setItem("unreadNotificationsCount", "0");
          lastCheckTime.current = new Date();
        }, 500);
      }
    };

    // Listen for route changes and check initial route
    if (typeof window !== "undefined") {
      window.addEventListener("popstate", handleRouteChange);
      // Check the current route when the component mounts
      handleRouteChange();

      // Cleanup listener on unmount
      return () => {
        window.removeEventListener("popstate", handleRouteChange);
      };
    }

    return undefined; // Explicit return for the effect cleanup function
  }, [user]);

  // Debounced search function
  const fetchSearchResults = useCallback(async (query: string) => {
    if (!query) {
      setSearchResults([]);
      setIsSearchLoading(false);
      return;
    }
    setIsSearchLoading(true);
    setIsDropdownVisible(true); // Show dropdown immediately when typing starts

    try {
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data: SearchResult[] = await response.json();
      setSearchResults(data);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsSearchLoading(false);
    }
  }, []);

  // Effect for debounced search
  useEffect(() => {
    // Clear the previous timeout if it exists
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      setIsSearchLoading(true); // Show loading indicator while waiting for debounce
      setIsDropdownVisible(true);
      // Set a new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        fetchSearchResults(searchQuery.trim());
      }, 300); // 300ms debounce time
    } else {
      setSearchResults([]);
      setIsSearchLoading(false);
      setIsDropdownVisible(false);
    }

    // Cleanup function to clear timeout if component unmounts or query changes
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, fetchSearchResults]);

  // Effect for scroll handling - updated to close mobile menu on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Close mobile menu when scrolling
      if (isMobileMenuOpen && Math.abs(currentScrollY - lastScrollY) > 10) {
        setIsMobileMenuOpen(false);
      }

      // Handle navbar visibility
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isMobileMenuOpen]);

  // Effect to add body class when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isMobileMenuOpen]);

  // Effect to handle clicks outside the search component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest("[data-dropdown-trigger]")
      ) {
        setActiveDropdown(null);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputFocus = () => {
    if (searchResults.length > 0 || isSearchLoading) {
      setIsDropdownVisible(true);
    }
  };

  // Function to handle mobile menu collapse
  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  // Update handleResultClick to also close mobile menu
  const handleResultClick = () => {
    setIsDropdownVisible(false);
    setSearchQuery("");
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  // Define navigation items with conditional visibility
  const navItems: NavItem[] = [
    {
      label: "House For Rent",
      href: "/house-for-rent",
      name: "",
      type: "house",
    },
    {
      label: "Car For Sale",
      href: "/car-for-sale",
      name: "",
      type: "car",
    },
    {
      label: "Car For Rent",
      href: "/car-for-rent",
      name: "",
      type: "car",
    },
    {
      label: "About Us",
      href: "/about-us",
      name: "",
      type: "car",
    },
    {
      label: "Contact Us",
      href: "/contact-us",
      name: "",
      type: "car",
    },
  ];

  // Effect to setup notification polling and WebSocket connection
  useEffect(() => {
    // Define checkNewNotifications function inside useEffect
    if (!isLoaded || !user || !isTabActive) return;

    let wsConnected = false;
    let wsOpenTimeout: NodeJS.Timeout | null = null;

    const checkNewNotifications = async () => {
      try {
        const response = await fetch(
          `/api/notifications/check-new?lastCheck=${lastCheckTime.current.toISOString()}`,
          { credentials: "same-origin" }
        );

        if (!response.ok) return;

        const data = await response.json();
        if (data.count > 0) {
          setUnreadNotifications(
            (prev) => Number.parseInt(prev.toString()) + data.count
          );

          const event = new CustomEvent("unreadNotificationsUpdate", {
            detail: { count: data.count },
          });
          window.dispatchEvent(event);

          lastCheckTime.current = new Date();
        }
      } catch {
        // Silently fail for notification checks
      }
    };

    const handleNotificationUpdate = (event: {
      detail?: { count: number };
    }) => {
      if (event.detail && typeof event.detail.count === "number") {
        setUnreadNotifications(event.detail.count);
      }
    };

    const stopPolling = () => {
      if (notificationCheckInterval.current) {
        clearInterval(notificationCheckInterval.current);
        notificationCheckInterval.current = null;
      }
    };

    const startPolling = () => {
      if (notificationCheckInterval.current) return;

      // Do one immediate check so badge is updated quickly.
      checkNewNotifications();
      notificationCheckInterval.current = setInterval(() => {
        checkNewNotifications();
      }, 30000);
    };

    // Connect to WebSocket for real-time notification updates.
    // If WS doesn't connect quickly (or disconnects), start polling as fallback.
    const socket = new WebSocket(
      `${window.location.protocol === "https:" ? "wss" : "ws"}://${
        window.location.host
      }/api/ws`
    );

    socket.onopen = () => {
      wsConnected = true;
      if (wsOpenTimeout) clearTimeout(wsOpenTimeout);
      stopPolling();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (
          data.type === "notification" &&
          user &&
          data.userId === user.id
        ) {
          handleNotificationUpdate(data);
        }
      } catch {
        // Ignore malformed WS payloads
      }
    };

    const onWsFailure = () => {
      if (wsOpenTimeout) clearTimeout(wsOpenTimeout);
      if (!wsConnected) startPolling();
    };

    socket.onerror = onWsFailure;
    socket.onclose = onWsFailure;

    // Fallback timer: if WS fails to connect, don't wait forever.
    wsOpenTimeout = setTimeout(() => {
      if (!wsConnected) startPolling();
    }, 5000);

    return () => {
      stopPolling();
      if (wsOpenTimeout) clearTimeout(wsOpenTimeout);
      socket.close();
    };
  }, [isLoaded, user, isTabActive]);

  const handleDropdownClick = (label: string) => {
    setActiveDropdown(activeDropdown === label ? null : label);
  };

  return (
    <>
      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[45]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <nav
        className={`bg-gradient-to-r from-[#5B8F2D]/95 to-[#5B8F2D]/90 backdrop-filter backdrop-blur-sm border-b border-[#4a7825]/40 px-4 sm:px-6 py-3 w-full z-50 shadow-sm m-0 transition-all duration-700 ease-out ${
          isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        <section className="w-full">
          <MaxWidthWrapper>
            <div className="flex items-center justify-between flex-wrap min-w-0">
              {/* Left Section: Brand Logo */}
              <div className="flex items-center flex-shrink-0">
                <Link href="/" onClick={handleMobileMenuClose}>
                  <span className="text-white font-semibold text-sm">
                    <div className="flex flex-col pl-2">
                      <h3 className="tracking-wide">Diplomat</h3>
                      <span className="mt-[-5px] text-white/80 font-bold">
                        Corner
                      </span>
                    </div>
                  </span>
                </Link>
              </div>

              {/* Hamburger Menu Button for Mobile */}
              <div className="lg:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-white p-1 rounded-md hover:bg-[#4a7825] transition-colors"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>

              {/* Middle Section: Navigation Links - Desktop */}
              <div className="hidden lg:flex flex-1 justify-center gap-4 xl:gap-6 text-base text-white font-medium px-4 xl:px-6 min-w-0">
                {navItems
                  .filter((item) => !item.isAuth || (item.isAuth && user))
                  .map((item) => (
                    <div key={item.label} className="relative group">
                      {item.children ? (
                        <>
                          <button
                            data-dropdown-trigger
                            onClick={() => handleDropdownClick(item.label)}
                            className="hover:text-white/80 transition whitespace-nowrap relative group py-1 flex items-center gap-1"
                          >
                            {item.label}
                            <svg
                              className={`w-4 h-4 transition-transform ${
                                activeDropdown === item.label
                                  ? "rotate-180"
                                  : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                          </button>
                          {activeDropdown === item.label && (
                            <div
                              ref={dropdownRef}
                              className="absolute top-full left-0 mt-1 py-2 bg-white rounded-lg shadow-lg w-48 z-50"
                            >
                              {item.children.map((child) => (
                                <Link
                                  key={child.label}
                                  href={child.href}
                                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-[#5B8F2D] transition-colors"
                                  onClick={() => {
                                    handleMobileMenuClose();
                                    setActiveDropdown(null);
                                  }}
                                >
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <Link
                          href={item.href}
                          className="hover:text-white/80 transition whitespace-nowrap relative group py-1"
                          onClick={handleMobileMenuClose}
                        >
                          {item.label}
                          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                      )}
                    </div>
                  ))}
              </div>

              {/* Right Section: Search, Notifications, and Authentication */}
              <div className="hidden lg:flex items-center gap-3 xl:gap-6 flex-shrink-0 min-w-0">
                {/* Search Component */}
                <div className="relative" ref={searchRef}>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={handleInputFocus}
                      className="border border-[#4a7825]/40 bg-white/90 rounded-full px-4 py-1 text-sm outline-none focus:ring-2 focus:ring-white/30 w-40 xl:w-56 pr-8"
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600">
                      {isSearchLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Search className="w-5 h-5" />
                      )}
                    </span>
                  </div>
                  {/* Dropdown */}
                  {isDropdownVisible && (
                    <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                      {isSearchLoading && searchResults.length === 0 ? (
                        <div className="p-2 text-center text-gray-500">
                          Loading...
                        </div>
                      ) : searchResults.length > 0 ? (
                        <ul>
                          {searchResults.map((result) => (
                            <li
                              key={`${result.type}-${result.id}`}
                              className="border-b last:border-b-0"
                            >
                              <Link
                                href={`/${result.type}/${result.id}`}
                                onClick={handleResultClick}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                {result.name}{" "}
                                <span className="text-xs text-gray-400">
                                  ({result.type})
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        !isSearchLoading &&
                        searchQuery && (
                          <div className="p-2 text-center text-gray-500">
                            No results found.
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Authentication Buttons */}
                <div className="flex items-center gap-3 xl:gap-6">
                  {!user ? (
                    <Link href="/sign-up" onClick={handleMobileMenuClose}>
                      <Button className="bg-white text-[#5B8F2D] hover:bg-white/90 font-medium px-4 xl:px-6 py-2 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg border border-[#4a7825]/40">
                        Get Started
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <div className="relative group">
                        <UserButton
                          afterSignOutUrl="/"
                          appearance={{
                            elements: {
                              rootBox:
                                "transform hover:scale-110 transition-transform duration-200",
                            },
                          }}
                        />
                      </div>
                      <Link
                        href="/notifications"
                        onClick={handleMobileMenuClose}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="relative bg-white/15 hover:bg-white/25 p-2 rounded-full border border-white/20 hover:border-white/40 hover:shadow-md transition-all duration-300"
                        >
                          <Bell className="h-5 w-5 text-white group-hover:text-white/80 transition-colors" />
                          {unreadNotifications > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-[#5B8F2D] rounded-full text-[10px] flex items-center justify-center animate-pulse">
                              {unreadNotifications > 99
                                ? "99+"
                                : unreadNotifications}
                            </span>
                          )}
                          <span className="sr-only">Notifications</span>
                        </Button>
                      </Link>
                      <Link
                        href="/manage-product/house"
                        onClick={handleMobileMenuClose}
                        className="relative overflow-hidden px-3 xl:px-4 py-2 rounded-lg bg-white/15 border border-white/20 text-white hover:bg-white/25 hover:border-white/40 transition-all duration-300 group"
                      >
                        <span className="relative z-10">List Here</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </MaxWidthWrapper>
        </section>
      </nav>

      {/* Mobile Menu - Moved outside nav element */}
      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 top-[3.5rem] bottom-0 bg-gray z-[55] overflow-y-auto">
          {/* Close Button */}
          <div className="sticky top-0 right-0 p-4 flex justify-end bg-gray z-[56]">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-4 text-lg text-white font-normal p-4">
            {/* Navigation Links */}
            {navItems
              .filter((item) => !item.isAuth || (item.isAuth && user))
              .map((item) => (
                <div key={item.label}>
                  {item.children ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleDropdownClick(item.label)}
                        className="flex items-center justify-between w-full hover:text-white/80 transition"
                      >
                        <span>{item.label}</span>
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            activeDropdown === item.label ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {activeDropdown === item.label && (
                        <div className="pl-4 space-y-2 border-l border-white/30">
                          {item.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className="block hover:text-white/80 transition py-1"
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                setActiveDropdown(null);
                              }}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className="hover:text-white/80 transition flex items-center py-1"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveDropdown(null);
                      }}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}

            {/* Search Component for Mobile */}
            <div
              className="relative mt-4"
              ref={searchRef}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleInputFocus}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full border border-gray-300 bg-white rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary pr-8 text-gray-900 placeholder-gray-500"
                />
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                  {isSearchLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </span>
              </div>
              {/* Search Dropdown */}
              {isDropdownVisible && (
                <div
                  className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto z-[60]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isSearchLoading && searchResults.length === 0 ? (
                    <div className="p-2 text-center text-gray-500">
                      Loading...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <ul>
                      {searchResults.map((result) => (
                        <li
                          key={`${result.type}-${result.id}`}
                          className="border-b last:border-b-0"
                        >
                          <Link
                            href={`/${result.type}/${result.id}`}
                            onClick={handleResultClick}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {result.name}{" "}
                            <span className="text-xs text-gray-400">
                              ({result.type})
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    !isSearchLoading &&
                    searchQuery && (
                      <div className="p-2 text-center text-gray-500">
                        No results found.
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Authentication Buttons for Mobile */}
            <div className="flex flex-col gap-4 mt-4">
              {!user ? (
                <Link href="/sign-up" onClick={handleMobileMenuClose}>
                  <Button className="w-full bg-gradient-to-r from-primary to-white-600 hover:from-white-600 hover:to-primary text-white font-medium py-2 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
                    Get Started
                  </Button>
                </Link>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <UserButton
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          rootBox: "w-full",
                        },
                      }}
                    />
                    <Link
                      href="/notifications"
                      onClick={handleMobileMenuClose}
                      className="flex-1"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-full relative bg-gradient-to-r from-gray-50 to-white p-2 rounded-full border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-300"
                      >
                        <Bell className="h-5 w-5 text-gray-700 group-hover:text-primary transition-colors" />
                        {unreadNotifications > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] text-white flex items-center justify-center animate-pulse">
                            {unreadNotifications > 99
                              ? "99+"
                              : unreadNotifications}
                          </span>
                        )}
                        <span className="sr-only">Notifications</span>
                      </Button>
                    </Link>
                  </div>
                  <Link
                    href="/manage-product/house"
                    onClick={handleMobileMenuClose}
                    className="w-full text-center relative overflow-hidden px-4 hover:border-primary py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:text-primary transition-all duration-300 group"
                  >
                    <span className="relative z-10">List Here</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  </Link>
                </>
              )}
            </div>

            {/* Blurry Background Close Area */}
            <div
              className="fixed inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-900/80 to-transparent backdrop-blur-sm z-[56] cursor-pointer"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 text-sm">
                Tap to close
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavBar;
