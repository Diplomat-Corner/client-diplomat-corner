export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "request";
export type NotificationCategory = "system" | "car" | "user" | "request";

export interface INotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  category: string;
  link?: string;
  isRead: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  uniqueId?: string;
}
