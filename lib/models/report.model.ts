export type ReportType =
  | "spam"
  | "harassment"
  | "inappropriate"
  | "misinformation"
  | "other";
export type ReportStatus = "pending" | "reviewed" | "resolved" | "rejected";
export type EntityType = "review" | "user" | "car" | "house";

export interface IReport {
  entityType: EntityType;
  entityId: string;
  reportType: ReportType;
  reportedBy: string;
  status: ReportStatus;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
}
