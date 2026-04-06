"use client";

import type { ICar } from "@/lib/models/car.model";
import type { IHouse } from "@/lib/models/house.model";
import { getCarFilterOptions } from "@/lib/listings/car-filters";
import { HOUSE_FILTER_OPTIONS } from "@/lib/listings/house-filters";
import type { FilterOption } from "@/components/filter-section";
import { useAuth, useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";

export type ListingBrowseMode = "house" | "car";

const ITEMS_PER_PAGE = 20;

const SORT_OPTIONS_HOUSE = [
  { value: "Default", label: "Default" },
  { value: "Price Low to High", label: "Price: Low to High" },
  { value: "Price High to Low", label: "Price: High to Low" },
  { value: "Size Small to Large", label: "Size: Small to Large" },
  { value: "Size Large to Small", label: "Size: Large to Small" },
];

const SORT_OPTIONS_CAR = [
  { value: "Default", label: "Default" },
  { value: "Price Low to High", label: "Price: Low to High" },
  { value: "Price High to Low", label: "Price: High to Low" },
  { value: "Size Small to Large", label: "Mileage: Low to High" },
  { value: "Size Large to Small", label: "Mileage: High to Low" },
];

function normalizeHouse(h: Record<string, unknown>): IHouse {
  return {
    ...(h as IHouse),
    price: Number(h.price),
    bedroom: Number(h.bedroom),
    bathroom: Number(h.bathroom),
    size: Number(h.size),
    rating: Number(h.rating) || 0,
    likes: Number(h.likes) || 0,
  };
}

function normalizeCar(c: Record<string, unknown>): ICar {
  return {
    ...(c as ICar),
    price: Number(c.price),
    mileage: Number(c.mileage),
    year: Number(c.year),
    rating: Number(c.rating) || 0,
    likes: Number(c.likes) || 0,
  };
}

function applySortOrder(
  list: (IHouse | ICar)[],
  order: string,
  mode: ListingBrowseMode
): (IHouse | ICar)[] {
  const next = [...list];
  if (mode === "house") {
    const h = next as IHouse[];
    switch (order) {
      case "Price Low to High":
        h.sort((a, b) => a.price - b.price);
        break;
      case "Price High to Low":
        h.sort((a, b) => b.price - a.price);
        break;
      case "Size Small to Large":
        h.sort((a, b) => a.size - b.size);
        break;
      case "Size Large to Small":
        h.sort((a, b) => b.size - a.size);
        break;
      default:
        return list;
    }
    return h;
  }
  const c = next as ICar[];
  switch (order) {
    case "Price Low to High":
      c.sort((a, b) => a.price - b.price);
      break;
    case "Price High to Low":
      c.sort((a, b) => b.price - a.price);
      break;
    case "Size Small to Large":
      c.sort((a, b) => a.mileage - b.mileage);
      break;
    case "Size Large to Small":
      c.sort((a, b) => b.mileage - a.mileage);
      break;
    default:
      return list;
  }
  return c;
}

export function useListingBrowse(
  mode: ListingBrowseMode,
  advertisementType?: string
) {
  const { userId } = useAuth();
  const { user } = useUser();

  const [items, setItems] = useState<(IHouse | ICar)[]>([]);
  const [userItems, setUserItems] = useState<(IHouse | ICar)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sortOrder, setSortOrder] = useState("Default");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [fullItems, setFullItems] = useState<(IHouse | ICar)[]>([]);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"listings" | "your-listing">(
    "listings"
  );

  const filterOptions: FilterOption[] =
    mode === "house"
      ? HOUSE_FILTER_OPTIONS
      : getCarFilterOptions(advertisementType);

  const sortOptions =
    mode === "house" ? SORT_OPTIONS_HOUSE : SORT_OPTIONS_CAR;

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        setUserItems([]);
        return;
      }
      try {
        const base = mode === "house" ? "/api/house" : "/api/cars";
        const res = await fetch(
          `${base}?userId=${userId}${
            advertisementType ? `&advertisementType=${advertisementType}` : ""
          }`
        );
        const data = await res.json();
        const key = mode === "house" ? "houses" : "cars";
        if (data.success && Array.isArray(data[key])) {
          const formatted = data[key].map((row: Record<string, unknown>) =>
            mode === "house" ? normalizeHouse(row) : normalizeCar(row)
          );
          setUserItems(formatted);
        }
      } catch (e) {
        console.error(e);
        setUserItems([]);
      }
    };
    fetchUser();
  }, [userId, advertisementType, mode]);

  useEffect(() => {
    const fetchList = async () => {
      try {
        setLoading(true);
        setError(null);

        if (mode === "house") {
          const response = await fetch(
            `/api/house?page=${currentPage}&limit=${ITEMS_PER_PAGE}&excludeUserId=${
              userId || ""
            }${
              advertisementType ? `&advertisementType=${advertisementType}` : ""
            }`
          );
          const data = await response.json();
          if (data.success && Array.isArray(data.houses)) {
            const formatted = data.houses.map((h: Record<string, unknown>) =>
              normalizeHouse(h)
            );
            setItems((prev) =>
              currentPage === 1 ? formatted : [...prev, ...formatted]
            );
            setFullItems(formatted);
            setHasMore(data.pagination.hasMore);
          } else {
            setError("Failed to fetch houses");
          }
        } else {
          const response = await fetch(
            `/api/cars?${
              advertisementType === "Rent" ? "" : `page=${currentPage}&`
            }limit=${
              advertisementType === "Rent" ? "10000" : ITEMS_PER_PAGE
            }&excludeUserId=${userId || ""}${
              advertisementType ? `&advertisementType=${advertisementType}` : ""
            }`
          );
          const data = await response.json();
          if (data.success && Array.isArray(data.cars)) {
            const formatted = data.cars.map((c: Record<string, unknown>) =>
              normalizeCar(c)
            );
            if (advertisementType === "Rent") {
              setItems(formatted);
              setFullItems(formatted);
              setHasMore(false);
            } else {
              setItems((prev) =>
                currentPage === 1 ? formatted : [...prev, ...formatted]
              );
              setFullItems(formatted);
              setHasMore(data.pagination.hasMore);
            }
          } else {
            setError("Failed to fetch cars");
          }
        }
      } catch (err) {
        setError(mode === "house" ? "Error fetching houses" : "Error fetching cars");
        console.error(err);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    };
    fetchList();
  }, [currentPage, userId, advertisementType, mode]);

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

  const getCurrentSortLabel = useCallback(() => {
    const option = sortOptions.find((o) => o.value === sortOrder);
    return option ? option.label : "Sort By";
  }, [sortOptions, sortOrder]);

  const handleSortChange = useCallback(
    (value: string) => {
      setSortOrder(value);
      if (value === "Default") {
        setItems([...fullItems]);
        return;
      }
      setItems((prev) => applySortOrder(prev, value, mode));
    },
    [fullItems, mode]
  );

  const handleFilterChange = useCallback(
    (filters: string[]) => {
      setActiveFilters(filters);
      if (filters.length === 0) {
        setItems(
          sortOrder === "Default"
            ? [...fullItems]
            : applySortOrder([...fullItems], sortOrder, mode)
        );
        return;
      }

      const grouped = filters.reduce(
        (acc, filter) => {
          const option = filterOptions.find((opt) => opt.value === filter);
          if (option) {
            if (!acc[option.category]) acc[option.category] = [];
            acc[option.category].push(filter);
          }
          return acc;
        },
        {} as Record<string, string[]>
      );

      if (mode === "house") {
        const filtered = (fullItems as IHouse[]).filter((house) => {
          return Object.entries(grouped).every(([category, values]) => {
            if (values.length === 0) return true;
            return values.some((value) => {
              switch (category) {
                case "houseType":
                  return house.houseType === value;
                case "bedroom":
                  if (value === "4+") return house.bedroom >= 4;
                  return house.bedroom === parseInt(value, 10);
                case "bathroom":
                  if (value === "3+") return house.bathroom >= 3;
                  return house.bathroom === parseInt(value, 10);
                case "size": {
                  const [minSize, maxSize] = value.split("-").map(Number);
                  return (
                    house.size >= minSize &&
                    (maxSize ? house.size <= maxSize : true)
                  );
                }
                case "price": {
                  const [minPrice, maxPrice] = value.split("-").map(Number);
                  return (
                    house.price >= minPrice &&
                    (maxPrice ? house.price <= maxPrice : true)
                  );
                }
                case "essentials":
                  return house.essentials?.includes(value);
                default:
                  return false;
              }
            });
          });
        });
        setItems(
          sortOrder === "Default"
            ? filtered
            : applySortOrder(filtered, sortOrder, mode)
        );
      } else {
        const filtered = (fullItems as ICar[]).filter((car) => {
          return Object.entries(grouped).every(([category, values]) => {
            if (values.length === 0) return true;
            return values.some((value) => {
              switch (category) {
                case "advertisementType":
                  return (
                    car.advertisementType ===
                    (value === "For Rent" ? "Rent" : "Sale")
                  );
                case "bodyType":
                  return car.bodyType === value;
                case "fuel":
                  return car.fuel === value;
                case "transmission":
                  return car.transmission === value;
                default:
                  return false;
              }
            });
          });
        });
        setItems(
          sortOrder === "Default"
            ? filtered
            : applySortOrder(filtered, sortOrder, mode)
        );
      }
    },
    [fullItems, filterOptions, mode, sortOrder]
  );

  const handleSearchResultSelect = useCallback(
    (result: { id: string; name: string; type: string }) => {
      if (mode === "house" && result.type === "house") {
        window.location.href = `/house/${result.id}`;
      }
      if (mode === "car" && result.type === "car") {
        window.location.href = `/car/${result.id}`;
      }
    },
    [mode]
  );

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      setCurrentPage((p) => p + 1);
    }
  }, [isLoadingMore, hasMore]);

  const bannerTitle =
    mode === "house"
      ? advertisementType === "Sale"
        ? "Houses for Sale"
        : "Houses for Rent"
      : advertisementType === "Rent"
        ? "Cars for Rent"
        : "Cars for Sale";

  const listingsHeading =
    mode === "car"
      ? advertisementType === "Rent"
        ? "All Cars for Rent"
        : advertisementType === "Sale"
          ? "Cars for Sale"
          : "Listings"
      : "Listings";

  const showLoadMore =
    mode === "house"
      ? hasMore
      : hasMore && advertisementType !== "Rent";

  const countLabel =
    mode === "house"
      ? `${items.length} ${items.length === 1 ? "house" : "houses"} found`
      : `${items.length} ${items.length === 1 ? "car" : "cars"} found${
          advertisementType
            ? ` for ${advertisementType.toLowerCase()}`
            : ""
        }`;

  return {
    mode,
    advertisementType,
    userId,
    user,
    items,
    userItems,
    loading,
    error,
    filterOpen,
    setFilterOpen,
    sortOrder,
    activeFilters,
    fullItems,
    isSelectOpen,
    setIsSelectOpen,
    selectRef,
    activeTab,
    setActiveTab,
    filterOptions,
    sortOptions,
    getCurrentSortLabel,
    handleSortChange,
    handleFilterChange,
    handleSearchResultSelect,
    loadMore,
    bannerTitle,
    listingsHeading,
    showLoadMore,
    countLabel,
    isLoadingMore,
    currentPage,
  };
}

export type ListingBrowseContext = ReturnType<typeof useListingBrowse>;
