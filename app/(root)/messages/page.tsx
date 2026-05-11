"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Thread = {
  _id: string;
  category: string;
  subject: string;
  status: string;
  lastMessageText?: string;
  lastMessageAt?: string;
  clientUnreadCount?: number;
};

type ThreadMessage = {
  _id: string;
  senderRole: "admin" | "client";
  body: string;
  createdAt: string;
};

export default function ClientMessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchThreads = async () => {
    setLoading(true);
    const res = await fetch("/api/messages/threads");
    const data = await res.json();
    setThreads(Array.isArray(data?.data) ? data.data : []);
    setLoading(false);
  };

  const fetchThreadMessages = async (threadId: string) => {
    const res = await fetch(`/api/messages/threads/${threadId}/messages`);
    const data = await res.json();
    setMessages(Array.isArray(data?.messages) ? data.messages : []);
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

  return (
    <div className="main-content p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-4">Support Messages</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg bg-white">
          <div className="p-3 border-b font-medium">Your Threads</div>
          <div className="max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="p-3 text-sm text-muted-foreground">Loading...</div>
            ) : threads.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">
                No support conversations yet.
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread._id}
                  className={`w-full text-left p-3 border-b hover:bg-gray-50 ${
                    selectedThread?._id === thread._id ? "bg-gray-50" : ""
                  }`}
                  onClick={() => {
                    setSelectedThread(thread);
                    void fetchThreadMessages(thread._id);
                  }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {thread.category}
                      </div>
                      <div className="font-medium">{thread.subject}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {thread.lastMessageText || "No messages yet"}
                      </div>
                    </div>
                    {(thread.clientUnreadCount ?? 0) > 0 && (
                      <span className="text-xs bg-primary text-white rounded-full px-2 py-1">
                        {thread.clientUnreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="md:col-span-2 border rounded-lg bg-white flex flex-col min-h-[70vh]">
          <div className="p-3 border-b font-medium">
            {selectedThread ? selectedThread.subject : "Select a thread"}
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {selectedThread ? (
              messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.senderRole === "client"
                      ? "ml-auto bg-primary text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div>{msg.body}</div>
                  <div className="text-[10px] opacity-70 mt-1">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                Choose a conversation from the left.
              </div>
            )}
          </div>
          {selectedThread && (
            <div className="p-3 border-t flex gap-2">
              <Input
                placeholder="Write your reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <Button onClick={handleReply}>Send</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
