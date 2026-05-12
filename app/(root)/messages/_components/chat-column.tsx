"use client";

import { Paperclip, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Thread } from "./types";
import {
  groupMessagesByDay,
  messageTimeLabel,
  statusPillLabel,
  threadDisplayName,
} from "./format";

const QUICK_REPLIES = [
  "Hi — could you share more details on this?",
  "What would you need from me to move forward?",
  "Thanks for the update. One more question: ",
];

export function ChatColumn(props: {
  thread: Thread | null;
  messages: import("./types").ThreadMessage[];
  reply: string;
  onReplyChange: (s: string) => void;
  onSend: () => void;
  outgoingRole: "admin" | "client";
  disabledSend?: boolean;
  onOpenDetails?: () => void;
}) {
  const groups = groupMessagesByDay(props.messages);
  const titleName = props.thread ? threadDisplayName(props.thread) : "";

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="shrink-0 border-b border-border px-4 py-3">
        {props.thread ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold leading-none">{titleName}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {props.thread.lastMessageAt
                    ? `Last activity ${messageTimeLabel(props.thread.lastMessageAt)}`
                    : "Conversation"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {props.onOpenDetails && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={props.onOpenDetails}
                    aria-label="Conversation details"
                  >
                    <PanelRight className="h-4 w-4" />
                  </Button>
                )}
                <Badge variant="outline" className="text-xs font-normal">
                  {statusPillLabel(props.thread.status, props.thread.category)}
                </Badge>
              </div>
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {props.thread.subject}
            </p>
          </>
        ) : (
          <h3 className="font-medium text-muted-foreground">Select a thread</h3>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          {!props.thread ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Choose a conversation from the inbox.
            </p>
          ) : groups.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No messages in this thread yet.
            </p>
          ) : (
            groups.map((g) => (
              <div key={g.dayKey} className="space-y-3">
                <div className="flex justify-center">
                  <span className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
                    {g.dayLabel}
                  </span>
                </div>
                {g.items.map((msg) => {
                  const isMine = msg.senderRole === props.outgoingRole;
                  return (
                    <div
                      key={msg._id}
                      className={cn("flex", isMine ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[min(85%,28rem)] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                          isMine
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-card text-card-foreground"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                        <p
                          className={cn(
                            "mt-1.5 text-[10px]",
                            isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}
                        >
                          {messageTimeLabel(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {props.thread && (
        <footer className="shrink-0 border-t border-border bg-muted/20 p-3">
          <div className="mb-2 flex flex-wrap gap-2">
            {QUICK_REPLIES.map((q) => (
              <Button
                key={q}
                type="button"
                variant="secondary"
                size="sm"
                className="h-auto max-w-full whitespace-normal rounded-full px-3 py-1 text-left text-xs font-normal"
                onClick={() =>
                  props.onReplyChange(
                    props.reply ? `${props.reply.trim()}\n\n${q}` : q
                  )
                }
              >
                {q.length > 48 ? `${q.slice(0, 48)}…` : q}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 rounded-xl border border-border bg-background p-2">
            <div className="flex shrink-0 items-end px-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                disabled
                title="Attachments coming soon"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              placeholder="Write a message…"
              className="min-h-[88px] flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
              value={props.reply}
              onChange={(e) => props.onReplyChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  props.onSend();
                }
              }}
            />
            <div className="flex shrink-0 flex-col justify-end">
              <Button
                type="button"
                onClick={props.onSend}
                disabled={props.disabledSend || !props.reply.trim()}
              >
                Send
              </Button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
