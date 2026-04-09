import type { SellerPreview } from "@/lib/seller-preview";

export type CardUserInfo = {
  name: string;
  imageUrl: string;
  role: "admin" | "customer";
};

/** Maps API seller preview to card "listed by" display (matches fetch /api/users/[id] behavior). */
export function sellerPreviewToCardUserInfo(s: SellerPreview): CardUserInfo {
  if (s.role === "admin") {
    return {
      name: "Administrator",
      imageUrl: s.imageUrl || "",
      role: "admin",
    };
  }
  const name = [s.firstName, s.lastName].filter(Boolean).join(" ").trim();
  return {
    name: name || "Anonymous",
    imageUrl: s.imageUrl || "",
    role: "customer",
  };
}
