"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Check,
  ChevronDown,
  Search,
  SlidersHorizontal,
  X,
  Filter,
  ArrowUpDown,
  Sparkles,
  Star,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// Define the type for search results based on API response
interface SearchResult {
  id: string;
  name: string;
  type: "car" | "house";
}

export interface FilterOption {
  value: string;
  label: string;
  category: string;
}

export interface FilterSectionProps {
  sortOrder: string;
  onSortChange: (value: string) => void;
  filterOptions: FilterOption[]; // Options for filter chips and/or sorting options
  activeFilters: string[];
  onFilterChange: (filters: string[]) => void;
  onSearchResultSelect: (result: {
    id: string;
    name: string;
    type: string;
  }) => void;
  showSearchResults?: boolean; // Flag to control if search results should be shown
  modelType: "car" | "house"; // Optional model type to filter search results
}

const FilterSection: React.FC<FilterSectionProps> = ({
  sortOrder,
  onSortChange,
  filterOptions,
  activeFilters,
  onFilterChange,
  onSearchResultSelect,
  showSearchResults = false,
  modelType,
}) => {
  // Local state for search input and UI states
  const [searchQuery, setSearchQuery] = useState("");
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<"sort" | "filter">("filter");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Group filter options by category
  const groupedFilters = filterOptions.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {} as Record<string, FilterOption[]>);

  // Close the select dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsSelectOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Effect to handle clicks outside the search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsDropdownVisible(false); // Hide dropdown if clicked outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced search function
  const fetchSearchResults = useCallback(
    async (query: string) => {
      if (!query) {
        setSearchResults([]);
        setIsSearchLoading(false);
        return;
      }
      setIsSearchLoading(true);
      setIsDropdownVisible(true); // Show dropdown immediately when typing starts

      try {
        // Add model type to query params if provided
        const categoryParam = modelType ? `&category=${modelType}s` : "";
        const response = await fetch(
          `/api/search?query=${encodeURIComponent(query)}${categoryParam}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data: SearchResult[] = await response.json();
        // Filter results by model type if provided
        const filteredResults = modelType
          ? data.filter((result) => result.type === modelType)
          : data;
        setSearchResults(filteredResults);
      } catch (error) {
        console.error("Failed to fetch search results:", error);
        setSearchResults([]); // Clear results on error
      } finally {
        setIsSearchLoading(false);
      }
    },
    [modelType]
  );

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

  // Handle search result click
  const handleResultClick = (result: SearchResult) => {
    setIsDropdownVisible(false);
    setSearchQuery("");
    if (onSearchResultSelect) {
      onSearchResultSelect(result);
    }
  };

  // Handle input focus to show dropdown
  const handleInputFocus = () => {
    if (searchResults.length > 0 || isSearchLoading) {
      setIsDropdownVisible(true);
    }
  };

  // Handle filter chip toggling
  const handleFilterToggle = (value: string) => {
    const newFilters = activeFilters.includes(value)
      ? activeFilters.filter((f) => f !== value)
      : [...activeFilters, value];
    onFilterChange(newFilters);
  };

  // Get current sort option label from sort options (or fallback)
  const getCurrentSortLabel = useCallback(() => {
    const option = filterOptions.find((option) => option.value === sortOrder);
    return option ? option.label : "Sort By";
  }, [filterOptions, sortOrder]);

  // Clear search input
  const clearSearch = () => {
    setSearchQuery("");
    if (searchRef.current) {
      searchRef.current.focus();
    }
  };

  return (
    <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100/80 mb-8 backdrop-blur-sm">
      {/* Glass morphism effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/60 to-white/40 backdrop-blur-md"></div>

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute right-1/4 bottom-0 w-20 h-20 bg-purple-500/5 rounded-full blur-2xl" />
        <div className="absolute left-1/3 top-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl" />

        {/* Decorative lines */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.03]"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <line
            x1="0"
            y1="0"
            x2="100"
            y2="100"
            stroke="currentColor"
            strokeWidth="0.5"
          />
          <line
            x1="100"
            y1="0"
            x2="0"
            y2="100"
            stroke="currentColor"
            strokeWidth="0.5"
          />
        </svg>
      </div>

      {/* Main content */}
      <div className="relative p-6 z-10">
        {/* Tabs for mobile view */}
        <div className="flex mb-5 md:hidden">
          <button
            onClick={() => setActiveTab("filter")}
            className={`flex-1 py-2.5 text-sm font-medium transition-all duration-300 rounded-l-lg flex items-center justify-center gap-2 ${
              activeTab === "filter"
                ? "bg-gradient-to-r from-primary  to-secondary text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-700 hover:border-green-300"
            }`}
          >
            <Filter
              size={16}
              className={
                activeTab === "filter" ? "text-white" : "text-gray-500"
              }
            />
            Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
          </button>
          <button
            onClick={() => setActiveTab("sort")}
            className={`flex-1 py-2.5 text-sm font-medium transition-all duration-300 rounded-r-lg flex items-center justify-center gap-2 ${
              activeTab === "sort"
                ? "bg-gradient-to-r from-primary  to-secondary text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-700 hover:border-green-300"
            }`}
          >
            <ArrowUpDown
              size={16}
              className={activeTab === "sort" ? "text-white" : "text-gray-500"}
            />
            Sort
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {/* Search and Sort Row */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Search Input with animation */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{
                width: "100%",
                boxShadow: isSearchFocused
                  ? "0 0 0 2px rgba(34, 197, 94, 0.2)"
                  : "none",
              }}
              className="relative w-full md:w-auto md:flex-1 max-w-md"
              ref={searchRef}
            >
              <div
                className={`relative flex items-center transition-all duration-300 rounded-full ${
                  isSearchFocused
                    ? "bg-white border-green-500 shadow-sm ring-2 ring-green-500/10"
                    : "bg-white/80 border-gray-200 hover:border-gray-300"
                } border`}
              >
                <Search
                  className={`absolute left-3.5 w-4 h-4 transition-colors duration-300 ${
                    isSearchFocused ? "text-green-500" : "text-gray-400"
                  }`}
                />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder={`Search ${modelType}s...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    setIsSearchFocused(true);
                    handleInputFocus();
                  }}
                  onBlur={() => setIsSearchFocused(false)}
                  className="w-full pl-10 pr-10 py-3 bg-transparent rounded-full focus:outline-none transition-all duration-200 text-gray-800 placeholder-gray-400"
                />
                <span className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {isSearchLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : searchQuery ? (
                    <X
                      className="w-4 h-4 cursor-pointer hover:text-gray-600"
                      onClick={clearSearch}
                    />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </span>
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && isDropdownVisible && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                  {isSearchLoading && searchResults.length === 0 ? (
                    <div className="p-2 text-center text-gray-500 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Searching...
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
                            onClick={() => handleResultClick(result)}
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
            </motion.div>

            {/* Sort Dropdown - Desktop */}
            <div className="hidden md:block relative z-20" ref={selectRef}>
              {/*<motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsSelectOpen(!isSelectOpen)}
                className="flex items-center justify-between gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 hover:border-green-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 group min-w-[180px]"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal
                    size={16}
                    className="text-gray-500 group-hover:text-green-500 transition-colors"
                  />
                  <span className="font-medium">{getCurrentSortLabel()}</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-gray-500 transition-transform duration-300 ${
                    isSelectOpen ? "rotate-180" : ""
                  }`}
                />
              </motion.button> */}

              {/* <AnimatePresence>
                {isSelectOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
                    style={{
                      minWidth: "220px",
                      maxHeight: "300px",
                      overflowY: "auto",
                    }}
                  >
                    <div className="py-1">
                      {filterOptions.map((option) => (
                        <motion.button
                          key={option.value}
                          whileHover={{
                            x: 4,
                            backgroundColor: "rgba(34, 197, 94, 0.05)",
                          }}
                          onClick={() => {
                            onSortChange(option.value);
                            setIsSelectOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 flex items-center justify-between ${
                            sortOrder === option.value
                              ? "bg-green-50 text-green-600"
                              : "text-gray-700"
                          }`}
                        >
                          <span>{option.label}</span>
                          {sortOrder === option.value && (
                            <motion.div
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                              }}
                              className="bg-green-100 rounded-full p-0.5"
                            >
                              <Check size={14} className="text-green-600" />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>*/}
            </div>

            {/* Sort Dropdown - Mobile */}
            <AnimatePresence>
              {activeTab === "sort" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="md:hidden w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden z-50"
                >
                  <div className="max-h-60 overflow-y-auto">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onSortChange(option.value);
                        }}
                        className={`w-full text-left px-4 py-3.5 flex items-center justify-between transition-colors ${
                          sortOrder === option.value
                            ? "bg-gradient-to-r from-green-50 to-white text-green-600 border-l-4 border-green-500"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span>{option.label}</span>
                        {sortOrder === option.value && (
                          <div className="bg-green-100 rounded-full p-0.5">
                            <Check size={14} className="text-green-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Filter Chips Row */}
          <AnimatePresence>
            {(activeTab === "filter" || !activeTab) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-wrap gap-2.5"
              >
                {filterOptions.map((option, index) => (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { delay: index * 0.05 },
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleFilterToggle(option.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      activeFilters.includes(option.value)
                        ? "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md"
                        : "bg-white border border-gray-200 text-gray-700 hover:border-green-300 hover:shadow-sm"
                    }`}
                  >
                    {activeFilters.includes(option.value) && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                        className="w-2 h-2 rounded-full bg-white"
                      />
                    )}
                    {option.label}
                    {activeFilters.includes(option.value) && (
                      <motion.div
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <X size={14} className="text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}

                {activeFilters.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onFilterChange([])}
                    className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200 flex items-center gap-2 shadow-sm"
                  >
                    <X size={14} className="text-gray-500" />
                    Clear All
                  </motion.button>
                )}

                {activeFilters.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ml-2 flex items-center text-sm text-green-600 font-medium"
                  >
                    <Sparkles size={14} className="mr-1.5 text-green-500" />
                    {activeFilters.length} active
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active filters summary - only visible when filters are active */}
          {activeFilters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 pt-1 text-sm text-gray-500"
            >
              <Star size={14} className="text-amber-400" />
              <span>Showing results for: </span>
              <span className="font-medium text-gray-700">
                {activeFilters.map((filter, i) => {
                  const option = filterOptions.find(
                    (opt) => opt.value === filter
                  );
                  return option
                    ? i === 0
                      ? option.label
                      : `, ${option.label}`
                    : "";
                })}
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterSection;
