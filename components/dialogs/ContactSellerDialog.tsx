"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PhoneNumberPopup } from "@/components/PhoneNumberPopup";

const DEFAULT_SUBJECT = "Car Rent Inquiry";

export interface ContactSellerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productType: string;
  sellerName: string;
  sellerEmail?: string;
  sellerPhone?: string;
  carId: string;
  sellerId: string;
}

type InquirerProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export function ContactSellerDialog({
  isOpen,
  onClose,
  productType,
  sellerName,
  sellerEmail,
  sellerPhone,
  carId,
  sellerId,
}: ContactSellerDialogProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [openPhonePopup, setOpenPhonePopup] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [inquirer, setInquirer] = useState<InquirerProfile | null>(null);
  const [message, setMessage] = useState(
    `Hello, I'm interested in renting this ${productType}. Please provide more details.`
  );
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);

  useEffect(() => {
    if (!isOpen || !user?.id) {
      setInquirer(null);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/users/${user.id}`);
        const data = await res.json();
        if (cancelled) return;
        const u = data?.user as Record<string, unknown> | undefined;
        const clerkEmail = user.primaryEmailAddress?.emailAddress ?? "";
        const first =
          (typeof u?.firstName === "string" ? u.firstName : "").trim() ||
          user.firstName ||
          "";
        const last =
          (typeof u?.lastName === "string" ? u.lastName : "").trim() ||
          user.lastName ||
          "";
        const phone =
          (typeof u?.phoneNumber === "string" ? u.phoneNumber : "").trim() ||
          String(user.unsafeMetadata?.phoneNumber ?? "").trim();
        setInquirer({
          firstName: first,
          lastName: last,
          email: clerkEmail.trim(),
          phone,
        });
      } catch {
        if (!cancelled) {
          const clerkEmail = user.primaryEmailAddress?.emailAddress ?? "";
          setInquirer({
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
            email: clerkEmail.trim(),
            phone: String(user.unsafeMetadata?.phoneNumber ?? "").trim(),
          });
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, user, profileRefreshKey]);

  useEffect(() => {
    if (isOpen) {
      setMessage(
        `Hello, I'm interested in renting this ${productType}. Please provide more details.`
      );
    }
  }, [isOpen, productType]);

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!inquirer) {
        throw new Error("Profile not loaded");
      }
      const firstName = inquirer.firstName.trim();
      const lastName = inquirer.lastName.trim();
      const email = inquirer.email.trim();
      const phone = inquirer.phone.trim();
      const inquirerName =
        `${firstName} ${lastName}`.trim() || email.split("@")[0] || "Customer";
      const listingLink =
        typeof window !== "undefined"
          ? `${window.location.origin}/car/${carId}`
          : `/car/${carId}`;
      const response = await fetch("/api/messages/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: firstName || inquirerName,
          lastName,
          email,
          phone,
          message: message.trim(),
          topicType: "car-inquiry",
          topicId: carId,
          subject: DEFAULT_SUBJECT,
          meta: {
            listingId: carId,
            listingLink,
            listerName: sellerName,
            listerEmail: sellerEmail || "unknown@diplomatcorner.net",
            listerPhone: sellerPhone || "Not provided",
            inquirerName,
            inquirerEmail: email,
            inquirerPhone: phone,
            sellerId,
            productType,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send message");
      }
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your inquiry has been sent successfully!",
        variant: "default",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquirer) return;
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message before sending.",
        variant: "destructive",
      });
      return;
    }
    if (!inquirer.phone.trim()) {
      setOpenPhonePopup(true);
      return;
    }
    if (!inquirer.email.trim()) {
      toast({
        title: "Email missing",
        description: "Your account does not have an email on file.",
        variant: "destructive",
      });
      return;
    }
    sendMessageMutation.mutate();
  };

  const isLoading = sendMessageMutation.isPending;
  const inquirerNamePreview =
    inquirer && `${inquirer.firstName} ${inquirer.lastName}`.trim();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Contact Seller</DialogTitle>
            <DialogDescription>
              Send a message to {sellerName} about this {productType} rental.
            </DialogDescription>
            <p className="pt-1 text-xs text-muted-foreground">
              Subject: <span className="font-medium text-foreground">{DEFAULT_SUBJECT}</span>
            </p>
          </DialogHeader>

          {profileLoading ? (
            <p className="py-6 text-sm text-muted-foreground">Loading your profile…</p>
          ) : inquirer ? (
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">From: </span>
                {inquirerNamePreview || "—"}
              </p>
              <p className="mt-1">
                <span className="font-medium text-foreground">Email: </span>
                {inquirer.email || "—"}
              </p>
              <p className="mt-1">
                <span className="font-medium text-foreground">Phone: </span>
                {inquirer.phone || "—"}
              </p>
            </div>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">Sign in to send an inquiry.</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="inquiry-message" className="mb-1 block text-sm font-medium text-gray-700">
                Message *
              </label>
              <Textarea
                id="inquiry-message"
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
                disabled={isLoading || !inquirer}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || profileLoading || !inquirer}>
                {isLoading ? "Sending…" : "Send Message"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <PhoneNumberPopup
        isOpen={openPhonePopup}
        onClose={() => {
          setOpenPhonePopup(false);
          if (isOpen) setProfileRefreshKey((k) => k + 1);
        }}
      />
    </>
  );
}
