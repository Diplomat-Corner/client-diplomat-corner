"use client";

import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { InboxTab, Thread } from "./types";
import {
  categoryBadgeVariant,
  inboxCounts,
  shortRelative,
  threadInitials,
} from "./format";

export function InboxSidebar(props: {
  threads: Thread[];
  selectedId: string | null;
  onSelect: (t: Thread) => void;
  loading: boolean;
  emptyLabel: string;
  search: string;
  onSearchChange: (s: string) => void;
  inboxTab: InboxTab;
  onInboxTabChange: (t: InboxTab) => void;
}) {
  const counts = inboxCounts(props.threads, "client");

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-border bg-muted/30">
      <div className="shrink-0 space-y-1 border-b border-border px-4 py-4">
        <h2 className="text-lg font-semibold tracking-tight">Inbox</h2>
        <p className="text-xs text-muted-foreground">
          Your conversations with Diplomat Corner
        </p>
        <div className="relative pt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search threads..."
            className="h-9 border-border bg-background pl-9"
            value={props.search}
            onChange={(e) => props.onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="shrink-0 border-b border-border px-2 py-2">
        <Tabs
          value={props.inboxTab}
          onValueChange={(v) => props.onInboxTabChange(v as InboxTab)}
          className="w-full"
        >
          <TabsList className="grid h-9 w-full grid-cols-3 bg-muted/80 p-0.5">
            <TabsTrigger value="all" className="text-xs">
              All [{counts.all}]
            </TabsTrigger>
            <TabsTrigger value="todo" className="text-xs">
              Todo [{counts.todo}]
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              Unread [{counts.unread}]
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="p-2">
          {props.loading ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : props.threads.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              {props.emptyLabel}
            </p>
          ) : (
            <ul className="space-y-1">
              {props.threads.map((thread) => {
                const active = props.selectedId === thread._id;
                return (
                  <li key={thread._id}>
                    <button
                      type="button"
                      onClick={() => props.onSelect(thread)}
                      className={cn(
                        "flex w-full gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                        active
                          ? "bg-background shadow-sm ring-1 ring-border"
                          : "hover:bg-background/80"
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {threadInitials(thread)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="truncate font-medium leading-tight">
                            {thread.subject}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {shortRelative(thread.lastMessageAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {thread.lastMessageText || "No messages yet"}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          <Badge
                            variant={categoryBadgeVariant(thread.category)}
                            className="text-[10px] font-normal"
                          >
                            {thread.category}
                          </Badge>
                          {(thread.clientUnreadCount ?? 0) > 0 && (
                            <Badge variant="destructive" className="text-[10px]">
                              {thread.clientUnreadCount} new
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
