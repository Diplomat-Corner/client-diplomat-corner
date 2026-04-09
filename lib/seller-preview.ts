import User from "@/lib/models/user.model";

/** Public seller fields aligned with GET /api/users/[id]. */
export type SellerPreview = {
  firstName: string;
  lastName?: string;
  imageUrl: string;
  role: "customer" | "admin";
  /** Included when available (e.g. detail routes) for contact UI. */
  phoneNumber?: string;
};

export async function buildClerkIdToSellerMap(
  clerkIds: string[]
): Promise<Map<string, SellerPreview>> {
  const unique = [...new Set(clerkIds.filter(Boolean))];
  const map = new Map<string, SellerPreview>();
  if (unique.length === 0) return map;

  const users = await User.find({ clerkId: { $in: unique } })
    .select("clerkId firstName lastName imageUrl role phoneNumber")
    .lean<
      {
        clerkId: string;
        firstName: string;
        lastName?: string;
        imageUrl?: string;
        role: "customer" | "admin";
        phoneNumber?: string;
      }[]
    >();

  for (const u of users) {
    map.set(u.clerkId, {
      firstName: u.firstName,
      lastName: u.lastName,
      imageUrl: u.imageUrl ?? "",
      role: u.role,
      ...(u.phoneNumber ? { phoneNumber: u.phoneNumber } : {}),
    });
  }
  return map;
}

export function attachSellerToRecord<T extends { userId?: string }>(
  row: T,
  sellerMap: Map<string, SellerPreview>
): T & { seller?: SellerPreview } {
  const uid = row.userId;
  if (!uid || uid === "admin") {
    return { ...row, seller: undefined };
  }
  const seller = sellerMap.get(uid);
  return { ...row, ...(seller ? { seller } : {}) };
}
