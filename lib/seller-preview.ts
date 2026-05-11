/** Public seller fields aligned with GET /api/users/[id]. */
export type SellerPreview = {
  firstName: string;
  lastName?: string;
  email?: string;
  imageUrl: string;
  role: "customer" | "admin";
  phoneNumber?: string;
};
