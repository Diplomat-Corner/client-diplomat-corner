"use client";

import { useState } from "react";
import { ExternalLink, Mail, Phone, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Thread } from "./types";
import { Button } from "@/components/ui/button";
import {
  asCarInquiryMeta,
  statusPillLabel,
  threadInitials,
} from "./format";

function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="min-w-0 flex-1 truncate text-xs">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        title={`Copy ${label}`}
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}

export function ConversationDetailsPanel(props: { thread: Thread | null }) {
  const t = props.thread;
  const [tab, setTab] = useState("details");

  if (!t) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center border-l border-border bg-muted/20 p-4">
        <p className="text-center text-sm text-muted-foreground">
          Select a thread to see conversation details.
        </p>
      </div>
    );
  }

  const car = asCarInquiryMeta(t.meta);
  const contactPhone = t.participantPhone ?? car?.inquirerPhone;
  const contactEmail = t.participantEmail ?? car?.inquirerEmail;

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-border bg-muted/20">
      <div className="shrink-0 space-y-4 border-b border-border p-4">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-lg font-medium text-primary">
            {threadInitials(t)}
          </div>
          <h3 className="mt-3 line-clamp-2 px-2 text-sm font-semibold">{t.subject}</h3>
          {(contactPhone || contactEmail) && (
            <div className="mt-2 w-full space-y-1 text-xs text-muted-foreground">
              {contactPhone && (
                <p className="flex items-center justify-center gap-1.5">
                  <Phone className="h-3 w-3 shrink-0" />
                  <a href={`tel:${contactPhone}`} className="break-all text-primary underline-offset-4 hover:underline">
                    {contactPhone}
                  </a>
                </p>
              )}
              {contactEmail && (
                <p className="flex items-center justify-center gap-1.5">
                  <Mail className="h-3 w-3 shrink-0" />
                  <a
                    href={`mailto:${contactEmail}`}
                    className="break-all text-primary underline-offset-4 hover:underline"
                  >
                    {contactEmail}
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-background px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge className="font-normal">{statusPillLabel(t.status, t.category)}</Badge>
            <span className="text-xs text-muted-foreground">{t.category}</span>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-2 mt-2 grid h-9 w-auto grid-cols-3 rounded-lg bg-muted/80 p-0.5">
          <TabsTrigger value="details" className="text-[10px] px-1">
            Details
          </TabsTrigger>
          <TabsTrigger value="listing" className="text-[10px] px-1">
            Listing
          </TabsTrigger>
          <TabsTrigger value="help" className="text-[10px] px-1">
            Help
          </TabsTrigger>
        </TabsList>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <TabsContent value="details" className="m-0 space-y-3 p-4">
            {(contactPhone || contactEmail) && (
              <div className="space-y-3 rounded-xl border border-border bg-background p-3">
                {contactPhone && (
                  <div className="flex gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium text-muted-foreground">Phone</p>
                      <CopyField value={contactPhone} label="phone" />
                    </div>
                  </div>
                )}
                {contactEmail && (
                  <div className="flex gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium text-muted-foreground">Email</p>
                      <CopyField value={contactEmail} label="email" />
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Opened: </span>
                {t.createdAt
                  ? new Date(t.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"}
              </p>
              {t.lastMessageAt && (
                <p className="mt-2">
                  <span className="font-medium text-foreground">Last message: </span>
                  {new Date(t.lastMessageAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="listing" className="m-0 p-4">
            {car?.listingLink ? (
              <div className="space-y-2 rounded-xl border border-border bg-background p-3 text-xs">
                {car.listerName && (
                  <p className="text-muted-foreground">Seller: {car.listerName}</p>
                )}
                {car.listingId && (
                  <p className="text-muted-foreground">ID: {car.listingId}</p>
                )}
                <a
                  href={car.listingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                >
                  Open listing
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No listing linked to this conversation.
              </p>
            )}
          </TabsContent>

          <TabsContent value="help" className="m-0 p-4">
            <p className="text-xs text-muted-foreground">
              Need help? Use Contact Us or reply in this thread. A team member will respond when
              available.
            </p>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
