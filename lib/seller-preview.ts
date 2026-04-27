/** Public seller fields aligned with GET /api/users/[id]. */
export type SellerPreview = {
  firstName: string;
  lastName?: string;
  imageUrl: string;
  role: "customer" | "admin";
  phoneNumber?: string;
};
