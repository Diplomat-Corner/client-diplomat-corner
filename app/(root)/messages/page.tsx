"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChatColumn } from "./_components/chat-column";
import { ConversationDetailsPanel } from "./_components/conversation-details-panel";
import {
  filterThreadsBySearch,
  filterThreadsForInbox,
  normalizeMessageFromApi,
  normalizeThreadFromApi,
} from "./_components/format";
import { InboxSidebar } from "./_components/inbox-sidebar";
import type { InboxTab, Thread, ThreadMessage } from "./_components/types";

export default function ClientMessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [activeThreadDetail, setActiveThreadDetail] = useState<Thread | null>(
    null
  );
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [listUnauthorized, setListUnauthorized] = useState(false);
  const [listLoadError, setListLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [inboxTab, setInboxTab] = useState<InboxTab>("all");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchThreads = async () => {
    setLoading(true);
    setListUnauthorized(false);
    setListLoadError(false);
    const res = await fetch("/api/messages/threads/mine");
    if (res.status === 401) {
      setThreads([]);
      setSelectedThread(null);
      setMessages([]);
      setListUnauthorized(true);
      setLoading(false);
      return;
    }
    if (!res.ok) {
      setThreads([]);
      setListLoadError(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    const raw = Array.isArray(data?.data) ? data.data : [];
    const normalized = raw
      .map((row: unknown) => normalizeThreadFromApi(row))
      .filter((t): t is Thread => t != null);
    setThreads(normalized);
    setLoading(false);
  };

  const fetchThreadMessages = async (threadId: string) => {
    const res = await fetch(`/api/messages/threads/${threadId}/messages`);
    const data = await res.json();
    const rawMsgs = Array.isArray(data?.messages) ? data.messages : [];
    setMessages(
      rawMsgs
        .map((m: unknown) => normalizeMessageFromApi(m))
        .filter((m): m is ThreadMessage => m != null)
    );
    const full = normalizeThreadFromApi(data?.thread);
    setActiveThreadDetail(full);
    if (full) {
      setThreads((prev) =>
        prev.map((t) => (t._id === full._id ? { ...t, ...full } : t))
      );
    }
    await fetch(`/api/messages/threads/${threadId}/read`, { method: "PATCH" });
    setThreads((prev) =>
      prev.map((t) => (t._id === threadId ? { ...t, clientUnreadCount: 0 } : t))
    );
  };

  useEffect(() => {
    void fetchThreads();
  }, []);

  const handleReply = async () => {
    if (!selectedThread || !reply.trim()) return;
    await fetch(`/api/messages/threads/${selectedThread._id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply.trim() }),
    });
    setReply("");
    await fetchThreadMessages(selectedThread._id);
    await fetchThreads();
  };

  const displayedThreads = useMemo(() => {
    const step1 = filterThreadsForInbox(threads, inboxTab, "client");
    return filterThreadsBySearch(step1, search);
  }, [threads, inboxTab, search]);

  const inboxEmptyLabel = useMemo(() => {
    if (listUnauthorized) {
      return "Sign in to view your support messages.";
    }
    if (listLoadError) {
      return "Could not load your messages. Please try again.";
    }
    if (threads.length === 0) {
      return "No messages created yet.";
    }
    return "No conversations match your filters.";
  }, [listLoadError, listUnauthorized, threads.length]);

  const mergedThread = useMemo((): Thread | null => {
    if (!selectedThread) return null;
    if (!activeThreadDetail || activeThreadDetail._id !== selectedThread._id) {
      return selectedThread;
    }
    return { ...selectedThread, ...activeThreadDetail };
  }, [selectedThread, activeThreadDetail]);

  const selectThread = (t: Thread) => {
    setSelectedThread(t);
    setActiveThreadDetail(null);
    void fetchThreadMessages(t._id);
  };

  return (
    <div className="flex min-h-[calc(100dvh-8.5rem)] flex-col overflow-hidden bg-background">
      <div className="shrink-0 border-b border-border px-4 py-4 md:px-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Support messages
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chat with our team in one place.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(200px,34vh)_minmax(0,1fr)] md:grid-rows-1 md:grid-cols-[minmax(240px,300px)_1fr] lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)_minmax(260px,300px)]">
        <div className="min-h-0 border-b border-border md:border-b-0">
          <InboxSidebar
            threads={displayedThreads}
            selectedId={selectedThread?._id ?? null}
            onSelect={selectThread}
            loading={loading}
            emptyLabel={inboxEmptyLabel}
            search={search}
            onSearchChange={setSearch}
            inboxTab={inboxTab}
            onInboxTabChange={setInboxTab}
          />
        </div>

        <div className="min-h-0">
          <ChatColumn
            thread={mergedThread}
            messages={messages}
            reply={reply}
            onReplyChange={setReply}
            onSend={() => void handleReply()}
            outgoingRole="client"
            onOpenDetails={() => setDetailsOpen(true)}
          />
        </div>

        <div className="hidden min-h-0 lg:block">
          <ConversationDetailsPanel thread={mergedThread} />
        </div>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-md lg:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Conversation details</DialogTitle>
          </DialogHeader>
          <ConversationDetailsPanel thread={mergedThread} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
