import mongoose, { Schema } from "mongoose";

export interface IPayment {
  _id: string;
  paymentId: string;
  servicePrice: number;
  receiptUrl: string;
  uploadedAt: Date;
  productId: string;
  productType: "house" | "car";
  userId: string;
}

const paymentSchema = new Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
    },
    servicePrice: {
      type: Number,
      required: true,
      default: 3000,
    },
    receiptUrl: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    productId: {
      type: String,
      required: true,
    },
    productType: {
      type: String,
      required: true,
      enum: ["house", "car"],
    },
    userId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Payment ||
  mongoose.model<IPayment>("Payment", paymentSchema);
