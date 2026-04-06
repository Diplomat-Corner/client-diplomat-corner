import mongoose, { Schema } from "mongoose";

export interface ICar {
  _id: string;
  name: string;
  userId: string;
  description: string;
  advertisementType: "Rent" | "Sale";
  price: number;
  paymentMethod: "Daily" | "Weekly" | "Monthly" | "Annually";
  mileage: number;
  speed: number;
  milesPerGallon: number;
  timestamp: string;
  year: number;
  transmission: string;
  fuel: string;
  bodyType: string;
  condition: string;
  engine: string;
  maintenance: string;
  currency: string;
  tags: string;
  imageUrl?: string;
  imageUrls?: string[];
  paymentId: string;
  visiblity: "Private" | "Public";
  status: "Pending" | "Active";
  createdAt?: Date;
  updatedAt?: Date;
}

const carSchema = new Schema(
  {
    name: { type: String, required: true },
    userId: { type: String, required: true },
    description: { type: String, required: true },
    advertisementType: { type: String, required: true, enum: ["Rent", "Sale"] },
    price: { type: Number, required: true },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["Daily", "Weekly", "Monthly", "Annually"],
    },
    mileage: { type: Number, required: true },
    speed: { type: Number, default: 0 },
    milesPerGallon: { type: Number, default: 0 },
    timestamp: { type: String, required: true },
    year: { type: Number, default: 0 },
    transmission: { type: String, default: "Automatic" },
    fuel: { type: String, default: "Diesel" },
    bodyType: { type: String },
    condition: { type: String, default: "" },
    engine: { type: String, default: "" },
    maintenance: { type: String, default: "" },
    currency: { type: String, default: "USD" },
    tags: { type: String, default: "" },
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

export default mongoose.models.Car || mongoose.model<ICar>("Car", carSchema);
