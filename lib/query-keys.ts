/** Central query key factories for TanStack Query — keeps keys consistent and type-safe. */

export const queryKeys = {
  cars: {
    all: ["cars"] as const,
    mine: (userId: string | undefined, advertisementType?: string) =>
      ["cars", "mine", userId ?? "", advertisementType ?? ""] as const,
    browse: (
      mode: "page" | "infinite",
      params: {
        page?: number;
        excludeUserId?: string;
        advertisementType?: string;
        includeSeller?: boolean;
        limit?: number;
      }
    ) => ["cars", "browse", mode, params] as const,
  },
  houses: {
    all: ["houses"] as const,
    mine: (userId: string | undefined, advertisementType?: string) =>
      ["houses", "mine", userId ?? "", advertisementType ?? ""] as const,
    browse: (
      mode: "page" | "infinite",
      params: {
        page?: number;
        excludeUserId?: string;
        advertisementType?: string;
        includeSeller?: boolean;
      }
    ) => ["houses", "browse", mode, params] as const,
  },
  featuredProducts: () => ["featured-products"] as const,
  currentUserByClerk: (clerkId: string | undefined) =>
    ["users", "byClerk", clerkId ?? ""] as const,
  carById: (id: string, opts?: { includeSeller?: boolean }) =>
    ["cars", "detail", id, opts?.includeSeller ? "seller" : "plain"] as const,
  houseById: (id: string, opts?: { includeSeller?: boolean }) =>
    ["houses", "detail", id, opts?.includeSeller ? "seller" : "plain"] as const,
  notifications: (userId: string | undefined) =>
    ["notifications", userId ?? ""] as const,
  filterOptions: (mode: "car" | "house", advertisementType?: string) =>
    ["filter-options", mode, advertisementType ?? ""] as const,
  reviews: (productId: string, productType: string) =>
    ["reviews", productId, productType] as const,
  advertisements: () => ["advertisements"] as const,
} as const;
