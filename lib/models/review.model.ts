import { Schema, model, models } from "mongoose";

const reviewSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    targetUserId: {
      type: String,
      required: true,
    },
    productId: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
    },
    likes: [
      {
        type: String,
        ref: "User",
      },
    ],
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ productId: 1 });

const Review = models.Review || model("Review", reviewSchema);

export default Review;
