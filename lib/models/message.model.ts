export type MessageSubject =
  | "General Inquiry"
  | "To promote Ads"
  | "Want admin"
  | "Technical support"
  | "Customer Support";

export interface IMessage {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: MessageSubject;
  message: string;
  createdAt: Date;
}
