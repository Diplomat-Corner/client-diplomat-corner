export type ThreadMessage = {
  _id: string;
  senderRole: "admin" | "client";
  body: string;
  createdAt: string;
};

export type Thread = {
  _id: string;
  category: string;
  subject: string;
  status: string;
  topicType?: string;
  topicId?: string;
  participantFirstName?: string;
  participantLastName?: string;
  participantEmail?: string;
  participantPhone?: string;
  lastMessageText?: string;
  lastMessageAt?: string;
  lastSenderRole?: "admin" | "client";
  clientUnreadCount?: number;
  adminUnreadCount?: number;
  createdAt?: string;
  updatedAt?: string;
  meta?: Record<string, unknown>;
};

export type InboxTab = "all" | "todo" | "unread";
