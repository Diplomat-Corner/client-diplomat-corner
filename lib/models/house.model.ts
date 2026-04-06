import mongoose, { Schema } from "mongoose";

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
}

const houseSchema = new Schema(
  {
    name: { type: String, required: true },
    userId: { type: String, required: true },
    description: { type: String, required: true },
    advertisementType: { type: String, required: true, enum: ["Rent", "Sale"] },
    price: { type: Number, required: true },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["Monthly", "Quarterly", "Annual"],
    },
    bedroom: { type: Number, required: true },
    parkingSpace: { type: Number, required: true },
    bathroom: { type: Number, required: true },
    size: { type: Number, required: true },
    houseType: {
      type: String,
      required: true,
      enum: ["House", "Apartment", "Guest House"],
    },
    condition: { type: String },
    maintenance: { type: String },
    essentials: [{ type: String }],
    currency: { type: String, default: "USD" },
    imageUrl: { type: String },
    imageUrls: [{ type: String }],
    paymentId: {
      type: String,
      required: true,
    },
    visiblity: {
      type: String,
      required: true,
      enum: ["Private", "Public"],
    },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Active"],
    },
  },
  { timestamps: true }
);
houseSchema.index({ name: "text", description: "text" });

export default mongoose.models.House ||
  mongoose.model<IHouse>("House", houseSchema);
