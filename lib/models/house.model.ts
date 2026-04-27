/** Client-side house shape (Mongo document over the wire). */
export interface IHouse {
  _id: string;
  name: string;
  userId: string;
  description: string;
  advertisementType: "Rent" | "Sale";
  price: number;
  paymentMethod: "Monthly" | "Quarterly" | "Annual";
  bedroom: number;
  parkingSpace: number;
  bathroom: number;
  size: number;
  houseType: "House" | "Apartment" | "Guest House";
  condition: string;
  maintenance: string;
  essentials: string[];
  currency: string;
  imageUrl?: string;
  imageUrls?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  paymentId: string;
  visiblity: "Private" | "Public";
  status: "Pending" | "Active";
  seller?: import("@/lib/seller-preview").SellerPreview;
}
