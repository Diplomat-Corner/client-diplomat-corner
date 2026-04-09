"use client";

import type { ICar } from "@/lib/models/car.model";
import type { IHouse } from "@/lib/models/house.model";
import { getCarFilterOptions } from "@/lib/listings/car-filters";
import { HOUSE_FILTER_OPTIONS } from "@/lib/listings/house-filters";
import type { FilterOption } from "@/components/filter-section";
import { useAuth, useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { SellerPreview } from "@/lib/seller-preview";

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

function normalizeHouse(
  h: Record<string, unknown>
): IHouse & { seller?: SellerPreview } {
  const seller = h.seller as SellerPreview | undefined;
  return {
    ...(h as unknown as IHouse),
    price: Number(h.price),
    bedroom: Number(h.bedroom),
    bathroom: Number(h.bathroom),
    size: Number(h.size),
    ...(seller ? { seller } : {}),
  } as IHouse & { seller?: SellerPreview };
}

function normalizeCar(
  c: Record<string, unknown>
): ICar & { seller?: SellerPreview } {
  const seller = c.seller as SellerPreview | undefined;
  return {
    ...(c as unknown as ICar),
    price: Number(c.price),
    mileage: Number(c.mileage),
    year: Number(c.year),
    rating: Number(c.rating) || 0,
    likes: Number(c.likes) || 0,
    ...(seller ? { seller } : {}),
  } as ICar & { seller?: SellerPreview };
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

type PagePayload = {
  success: boolean;
  cars?: Record<string, unknown>[];
  houses?: Record<string, unknown>[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  error?: string;
};

export function useListingBrowse(
  mode: ListingBrowseMode,
  advertisementType?: string
) {
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();

  const [items, setItems] = useState<(IHouse | ICar)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
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

  const mineQuery = useQuery({
    queryKey:
      mode === "house"
        ? queryKeys.houses.mine(userId ?? undefined, advertisementType)
        : queryKeys.cars.mine(userId ?? undefined, advertisementType),
    queryFn: async () => {
      const base = mode === "house" ? "/api/house" : "/api/cars";
      const res = await fetch(
        `${base}?userId=${userId}${
          advertisementType ? `&advertisementType=${advertisementType}` : ""
        }`
      );
      const data = await res.json();
      const key = mode === "house" ? "houses" : "cars";
      if (!data.success || !Array.isArray(data[key])) {
        throw new Error("Failed to load your listings");
      }
      return (data[key] as Record<string, unknown>[]).map((row) =>
        mode === "house" ? normalizeHouse(row) : normalizeCar(row)
      ) as (IHouse | ICar)[];
    },
    enabled: isLoaded && !!userId,
    staleTime: 60_000,
  });

  const userItems = useMemo(
    () => (mineQuery.data as (IHouse | ICar)[]) ?? [],
    [mineQuery.data]
  );

  const houseInfinite = useInfiniteQuery({
    queryKey: queryKeys.houses.browse("infinite", {
      excludeUserId: userId ?? "",
      advertisementType: advertisementType ?? "",
      includeSeller: true,
    }),
    queryFn: async ({ pageParam }): Promise<PagePayload> => {
      const page = pageParam as number;
      const url = `/api/house?page=${page}&limit=${ITEMS_PER_PAGE}&excludeUserId=${
        userId || ""
      }${
        advertisementType ? `&advertisementType=${advertisementType}` : ""
      }&includeSeller=1`;
      const res = await fetch(url);
      const data = (await res.json()) as PagePayload;
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch houses");
      }
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination?.hasMore ? last.pagination.page + 1 : undefined,
    enabled: isLoaded && mode === "house",
    staleTime: 60_000,
  });

  const carRentQuery = useQuery({
    queryKey: queryKeys.cars.browse("page", {
      page: 1,
      excludeUserId: userId ?? "",
      advertisementType: "Rent",
      includeSeller: true,
      limit: 10000,
    }),
    queryFn: async (): Promise<PagePayload> => {
      const url = `/api/cars?limit=10000&excludeUserId=${userId || ""}${
        advertisementType ? `&advertisementType=${advertisementType}` : ""
      }&includeSeller=1`;
      const res = await fetch(url);
      const data = (await res.json()) as PagePayload;
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch cars");
      }
      return data;
    },
    enabled: isLoaded && mode === "car" && advertisementType === "Rent",
    staleTime: 60_000,
  });

  const carSaleInfinite = useInfiniteQuery({
    queryKey: queryKeys.cars.browse("infinite", {
      excludeUserId: userId ?? "",
      advertisementType: advertisementType ?? "",
      includeSeller: true,
      limit: ITEMS_PER_PAGE,
    }),
    queryFn: async ({ pageParam }): Promise<PagePayload> => {
      const page = pageParam as number;
      const url = `/api/cars?page=${page}&limit=${ITEMS_PER_PAGE}&excludeUserId=${
        userId || ""
      }${
        advertisementType ? `&advertisementType=${advertisementType}` : ""
      }&includeSeller=1`;
      const res = await fetch(url);
      const data = (await res.json()) as PagePayload;
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch cars");
      }
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination?.hasMore ? last.pagination.page + 1 : undefined,
    enabled:
      isLoaded && mode === "car" && advertisementType !== "Rent",
    staleTime: 60_000,
  });

  const browseFlat = useMemo(() => {
    if (mode === "house") {
      const pages = houseInfinite.data?.pages;
      if (!pages?.length) return [];
      return pages.flatMap((p) =>
        (p.houses ?? []).map((h) => normalizeHouse(h as Record<string, unknown>))
      ) as IHouse[];
    }
    if (advertisementType === "Rent") {
      const raw = carRentQuery.data?.cars ?? [];
      return raw.map((c) =>
        normalizeCar(c as Record<string, unknown>)
      ) as ICar[];
    }
    const pages = carSaleInfinite.data?.pages;
    if (!pages?.length) return [];
    return pages.flatMap((p) =>
      (p.cars ?? []).map((c) => normalizeCar(c as Record<string, unknown>))
    ) as ICar[];
  }, [
    mode,
    advertisementType,
    houseInfinite.data?.pages,
    carRentQuery.data?.cars,
    carSaleInfinite.data?.pages,
  ]);

  useEffect(() => {
    const err =
      mode === "house"
        ? houseInfinite.error
        : advertisementType === "Rent"
          ? carRentQuery.error
          : carSaleInfinite.error;
    if (err) {
      setError(
        mode === "house"
          ? "Error fetching houses"
          : "Error fetching cars"
      );
    } else {
      setError(null);
    }
  }, [
    mode,
    advertisementType,
    houseInfinite.error,
    carRentQuery.error,
    carSaleInfinite.error,
  ]);

  useEffect(() => {
    setFullItems(browseFlat);
    setItems(browseFlat as (IHouse | ICar)[]);
  }, [browseFlat]);

  const loading =
    !isLoaded ||
    (mode === "house"
      ? houseInfinite.isPending
      : advertisementType === "Rent"
        ? carRentQuery.isPending
        : carSaleInfinite.isPending);

  const isLoadingMore =
    mode === "house"
      ? houseInfinite.isFetchingNextPage
      : advertisementType === "Rent"
        ? false
        : carSaleInfinite.isFetchingNextPage;

  const hasMore =
    mode === "house"
      ? houseInfinite.hasNextPage ?? false
      : advertisementType === "Rent"
        ? false
        : carSaleInfinite.hasNextPage ?? false;

  const currentPage =
    mode === "house"
      ? houseInfinite.data?.pages?.length ?? 1
      : advertisementType === "Rent"
        ? 1
        : carSaleInfinite.data?.pages?.length ?? 1;

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
    if (isLoadingMore || !hasMore) return;
    if (mode === "house") {
      void houseInfinite.fetchNextPage();
    } else if (mode === "car" && advertisementType !== "Rent") {
      void carSaleInfinite.fetchNextPage();
    }
  }, [
    mode,
    advertisementType,
    isLoadingMore,
    hasMore,
    houseInfinite.fetchNextPage,
    carSaleInfinite.fetchNextPage,
  ]);

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
