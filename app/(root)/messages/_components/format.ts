import { format, isToday, isYesterday } from "date-fns";
import type { InboxTab, Thread, ThreadMessage } from "./types";

export function coerceId(id: unknown): string {
  if (typeof id === "string") return id;
  if (
    id &&
    typeof id === "object" &&
    "$oid" in (id as object) &&
    typeof (id as { $oid: unknown }).$oid === "string"
  ) {
    return (id as { $oid: string }).$oid;
  }
  return "";
}

export function threadDisplayName(t: Thread): string {
  const n = `${t.participantFirstName ?? ""} ${t.participantLastName ?? ""}`.trim();
  if (n) return n;
  if (t.participantEmail) return t.participantEmail;
  return "Support";
}

export function threadInitials(t: Thread): string {
  const parts = [t.participantFirstName, t.participantLastName].filter(Boolean) as string[];
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  const fb = t.subject?.slice(0, 2);
  return (fb ?? "DC").toUpperCase();
}

export function shortRelative(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  if (sec < 86400 * 7) return `${Math.floor(sec / 86400)}d`;
  return format(d, "MMM d");
}

export function messageDayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
}

export function messageTimeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "h:mm a");
}

export function statusPillLabel(status: string, _category: string): string {
  const s = status.trim().toLowerCase();
  if (s === "open") return "Open";
  return status || "—";
}

export function categoryBadgeVariant(
  category: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (category) {
    case "Car Inquiry":
      return "default";
    case "Contact Us":
      return "secondary";
    default:
      return "outline";
  }
}

export type CarInquiryMeta = {
  listingLink?: string;
  listingId?: string;
  inquirerName?: string;
  inquirerEmail?: string;
  inquirerPhone?: string;
  listerName?: string;
  listingTitle?: string;
};

export function asCarInquiryMeta(meta?: Record<string, unknown>): CarInquiryMeta | null {
  if (!meta) return null;
  const get = (k: string) => (typeof meta[k] === "string" ? meta[k] : undefined);
  const out: CarInquiryMeta = {
    listingLink: get("listingLink"),
    listingId: get("listingId"),
    inquirerName: get("inquirerName"),
    inquirerEmail: get("inquirerEmail"),
    inquirerPhone: get("inquirerPhone"),
    listerName: get("listerName"),
    listingTitle: get("listingTitle"),
  };
  if (Object.values(out).every((v) => !v)) return null;
  return out;
}

export function normalizeThreadFromApi(raw: unknown): Thread | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = coerceId(r._id);
  if (!id) return null;
  const role = r.lastSenderRole;
  return {
    _id: id,
    category: String(r.category ?? ""),
    subject: String(r.subject ?? ""),
    status: String(r.status ?? ""),
    topicType: r.topicType != null ? String(r.topicType) : undefined,
    topicId: r.topicId != null ? String(r.topicId) : undefined,
    participantFirstName:
      r.participantFirstName != null ? String(r.participantFirstName) : undefined,
    participantLastName:
      r.participantLastName != null ? String(r.participantLastName) : undefined,
    participantEmail:
      r.participantEmail != null ? String(r.participantEmail) : undefined,
    participantPhone:
      r.participantPhone != null ? String(r.participantPhone) : undefined,
    lastMessageText:
      r.lastMessageText != null ? String(r.lastMessageText) : undefined,
    lastMessageAt: r.lastMessageAt != null ? String(r.lastMessageAt) : undefined,
    lastSenderRole:
      role === "admin" || role === "client" ? role : undefined,
    clientUnreadCount:
      typeof r.clientUnreadCount === "number" ? r.clientUnreadCount : undefined,
    adminUnreadCount:
      typeof r.adminUnreadCount === "number" ? r.adminUnreadCount : undefined,
    createdAt: r.createdAt != null ? String(r.createdAt) : undefined,
    updatedAt: r.updatedAt != null ? String(r.updatedAt) : undefined,
    meta:
      typeof r.meta === "object" && r.meta !== null
        ? (r.meta as Record<string, unknown>)
        : undefined,
  };
}

export function normalizeMessageFromApi(raw: unknown): ThreadMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = coerceId(r._id);
  if (!id) return null;
  const role = r.senderRole;
  if (role !== "admin" && role !== "client") return null;
  return {
    _id: id,
    senderRole: role,
    body: String(r.body ?? ""),
    createdAt: String(r.createdAt ?? ""),
  };
}

export function filterThreadsForInbox(
  threads: Thread[],
  tab: InboxTab,
  perspective: "admin" | "client"
): Thread[] {
  if (tab === "unread") {
    return threads.filter((t) =>
      perspective === "admin"
        ? (t.adminUnreadCount ?? 0) > 0
        : (t.clientUnreadCount ?? 0) > 0
    );
  }
  if (tab === "todo") {
    return threads.filter((t) => {
      if (!t.lastSenderRole) return false;
      if (perspective === "admin") return t.lastSenderRole !== "admin";
      return t.lastSenderRole !== "client";
    });
  }
  return threads;
}

export function filterThreadsBySearch(threads: Thread[], q: string): Thread[] {
  const s = q.trim().toLowerCase();
  if (!s) return threads;
  return threads.filter((t) => {
    const name = `${t.participantFirstName ?? ""} ${t.participantLastName ?? ""}`.toLowerCase();
    const email = (t.participantEmail ?? "").toLowerCase();
    return (
      t.subject.toLowerCase().includes(s) ||
      t.category.toLowerCase().includes(s) ||
      (t.lastMessageText ?? "").toLowerCase().includes(s) ||
      name.includes(s) ||
      email.includes(s)
    );
  });
}

export function inboxCounts(
  threads: Thread[],
  perspective: "admin" | "client"
): { all: number; todo: number; unread: number } {
  const unread = threads.filter((t) =>
    perspective === "admin"
      ? (t.adminUnreadCount ?? 0) > 0
      : (t.clientUnreadCount ?? 0) > 0
  ).length;
  const todo = filterThreadsForInbox(threads, "todo", perspective).length;
  return { all: threads.length, todo, unread };
}

export function groupMessagesByDay(
  messages: ThreadMessage[]
): { dayKey: string; dayLabel: string; items: ThreadMessage[] }[] {
  const sorted = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const groups: { dayKey: string; dayLabel: string; items: ThreadMessage[] }[] = [];
  for (const m of sorted) {
    const d = new Date(m.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const dayKey = format(d, "yyyy-MM-dd");
    const dayLabel = messageDayLabel(m.createdAt);
    const last = groups[groups.length - 1];
    if (last?.dayKey === dayKey) last.items.push(m);
    else groups.push({ dayKey, dayLabel, items: [m] });
  }
  return groups;
}
