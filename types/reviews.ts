export interface IReview {
  userId: string;
  targetUserId: string;
  productId: string;
  rating: number;
  comment: string;
  likes: number;
  user?: {
    _id: string;
    username: string;
    imageUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReviewInput {
  rating: number;
  comment: string;
  productId: string;
  targetUserId: string;
}

export interface UpdateReviewInput {
  rating?: number;
  comment?: string;
}

export interface ReviewResponse {
  success: boolean;
  message: string;
  data?: IReview | IReview[];
}
