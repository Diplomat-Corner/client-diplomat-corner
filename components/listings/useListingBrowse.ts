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
  { value: "Default", label: "Latest first" },
  { value: "Price Low to High", label: "Price: Low to High" },
  { value: "Price High to Low", label: "Price: High to Low" },
  { value: "Size Small to Large", label: "Size: Small to Large" },
  { value: "Size Large to Small", label: "Size: Large to Small" },
];

const SORT_OPTIONS_CAR = [
  { value: "Default", label: "Latest first" },
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

function listingRecencyMs(item: IHouse | ICar): number {
  const r = item as unknown as Record<string, unknown>;
  const tryParse = (v: unknown): number => {
    if (v == null) return 0;
    if (typeof v === "string" && v.trim() !== "") {
      const t = Date.parse(v);
      return Number.isNaN(t) ? 0 : t;
    }
    if (v instanceof Date) return v.getTime();
    if (typeof v === "number" && Number.isFinite(v)) return v;
    return 0;
  };
  const created = tryParse(r.createdAt);
  const updated = tryParse(r.updatedAt);
  const stamp = tryParse(r.timestamp);
  const idHex = typeof r._id === "string" ? r._id : "";
  let idTime = 0;
  if (idHex.length === 24 && /^[0-9a-fA-F]+$/.test(idHex)) {
    idTime = parseInt(idHex.slice(0, 8), 16) * 1000;
  }
  return Math.max(created, updated, stamp, idTime);
}

function sortListingsLatestFirst(list: (IHouse | ICar)[]): (IHouse | ICar)[] {
  return [...list].sort((a, b) => listingRecencyMs(b) - listingRecencyMs(a));
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
        return sortListingsLatestFirst(list);
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
      return sortListingsLatestFirst(list);
  }
  return c;
}

function groupActiveFilters(
  filters: string[],
  filterOptions: FilterOption[]
): Record<string, string[]> {
  return filters.reduce(
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
}

function filterListingsByGroups(
  fullItems: (IHouse | ICar)[],
  grouped: Record<string, string[]>,
  mode: ListingBrowseMode
): (IHouse | ICar)[] {
  if (mode === "house") {
    return (fullItems as IHouse[]).filter((house) => {
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
    }) as (IHouse | ICar)[];
  }
  return (fullItems as ICar[]).filter((car) => {
    return Object.entries(grouped).every(([category, values]) => {
      if (values.length === 0) return true;
      return values.some((value) => {
        switch (category) {
          case "advertisementType":
            return (
              car.advertisementType === (value === "For Rent" ? "Rent" : "Sale")
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
  }) as (IHouse | ICar)[];
}

function itemsForBrowseState(
  browseFlat: (IHouse | ICar)[],
  activeFilters: string[],
  sortOrder: string,
  mode: ListingBrowseMode,
  filterOptions: FilterOption[]
): (IHouse | ICar)[] {
  const base = sortListingsLatestFirst(browseFlat);
  if (activeFilters.length === 0) {
    return sortOrder === "Default"
      ? base
      : applySortOrder(base, sortOrder, mode);
  }
  const grouped = groupActiveFilters(activeFilters, filterOptions);
  const filtered = filterListingsByGroups(base, grouped, mode);
  return sortOrder === "Default"
    ? filtered
    : applySortOrder(filtered, sortOrder, mode);
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

  const filterOptions: FilterOption[] = useMemo(
    () =>
      mode === "house"
        ? HOUSE_FILTER_OPTIONS
        : getCarFilterOptions(advertisementType),
    [mode, advertisementType]
  );

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
    select: (data) => sortListingsLatestFirst(data),
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

  const carBrowseInfinite = useInfiniteQuery({
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
    enabled: isLoaded && mode === "car" && !!advertisementType,
    staleTime: 60_000,
  });

  const browseFlat = useMemo(() => {
    if (mode === "house") {
      const pages = houseInfinite.data?.pages;
      if (!pages?.length) return [];
      const flat = pages.flatMap((p) =>
        (p.houses ?? []).map((h) => normalizeHouse(h as Record<string, unknown>))
      ) as IHouse[];
      return sortListingsLatestFirst(flat);
    }
    if (mode === "car") {
      const pages = carBrowseInfinite.data?.pages;
      if (!pages?.length) return [];
      const flat = pages.flatMap((p) =>
        (p.cars ?? []).map((c) => normalizeCar(c as Record<string, unknown>))
      ) as ICar[];
      return sortListingsLatestFirst(flat);
    }
    return [];
  }, [
    mode,
    advertisementType,
    houseInfinite.data?.pages,
    carBrowseInfinite.data?.pages,
  ]);

  useEffect(() => {
    const err =
      mode === "house" ? houseInfinite.error : carBrowseInfinite.error;
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
    carBrowseInfinite.error,
  ]);

  useEffect(() => {
    setFullItems(browseFlat);
    setItems(
      itemsForBrowseState(
        browseFlat as (IHouse | ICar)[],
        activeFilters,
        sortOrder,
        mode,
        filterOptions
      )
    );
  }, [
    browseFlat,
    activeFilters,
    sortOrder,
    mode,
    filterOptions,
  ]);

  const loading =
    !isLoaded ||
    (mode === "house"
      ? houseInfinite.isPending
      : carBrowseInfinite.isPending);

  const isLoadingMore =
    mode === "house"
      ? houseInfinite.isFetchingNextPage
      : carBrowseInfinite.isFetchingNextPage;

  const hasMore =
    mode === "house"
      ? houseInfinite.hasNextPage ?? false
      : carBrowseInfinite.hasNextPage ?? false;

  const currentPage =
    mode === "house"
      ? houseInfinite.data?.pages?.length ?? 1
      : carBrowseInfinite.data?.pages?.length ?? 1;

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
        setItems(sortListingsLatestFirst([...fullItems]));
        return;
      }
      setItems((prev) => applySortOrder(prev, value, mode));
    },
    [fullItems, mode]
  );

  const handleFilterChange = useCallback(
    (filters: string[]) => {
      setActiveFilters(filters);
      setItems(
        itemsForBrowseState(
          fullItems,
          filters,
          sortOrder,
          mode,
          filterOptions
        )
      );
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
    } else {
      void carBrowseInfinite.fetchNextPage();
    }
  }, [
    mode,
    isLoadingMore,
    hasMore,
    houseInfinite.fetchNextPage,
    carBrowseInfinite.fetchNextPage,
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

  const showLoadMore = hasMore;

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
