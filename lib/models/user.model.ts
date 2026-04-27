export interface IUser {
  _id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName?: string;
  address?: string;
  phoneNumber?: string;
  imageUrl: string;
  role: "customer" | "admin";
  timestamp: string;
  createdAt?: Date;
  updatedAt?: Date;
}
