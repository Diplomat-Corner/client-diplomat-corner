import type { User as ClerkUser } from "@clerk/backend";

/** Clerk `user.*` webhook JSON shape (snake_case) — matches Svix payloads. */
export interface ClerkWebhookUserPayload {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email_addresses: Array<{
    email_address: string;
    id: string;
    verification: { status: string };
  }>;
  image_url: string | null;
  profile_image_url: string | null;
  external_accounts?: Array<{ image_url?: string }>;
}

/** Fields used for `User.create` — aligned with [`app/(root)/api/webhook/clerk/route.ts`](webhook). */
export interface MongoUserCreateFields {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  role: "customer" | "admin";
  address: string;
  phoneNumber: string;
  timestamp: string;
}

/** Profile fields synced from Clerk on update (does not touch role / phone / address). */
export interface MongoUserProfilePatch {
  email: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
}

function primaryEmailFromWebhook(data: ClerkWebhookUserPayload): string {
  return data.email_addresses?.[0]?.email_address ?? "";
}

function imageUrlFromWebhook(data: ClerkWebhookUserPayload): string {
  let url = data.profile_image_url || data.image_url || "";
  if (!url && data.external_accounts?.[0]?.image_url) {
    url = data.external_accounts[0].image_url;
  }
  return url;
}

export function mapWebhookUserToCreateDoc(
  data: ClerkWebhookUserPayload,
  timestamp = new Date().toISOString()
): MongoUserCreateFields {
  return {
    clerkId: data.id,
    email: primaryEmailFromWebhook(data),
    firstName: data.first_name ?? "",
    lastName: data.last_name ?? "",
    imageUrl: imageUrlFromWebhook(data),
    role: "customer",
    address: "",
    phoneNumber: "",
    timestamp,
  };
}

export function mapWebhookUserToProfilePatch(
  data: ClerkWebhookUserPayload
): MongoUserProfilePatch {
  return {
    email: primaryEmailFromWebhook(data),
    firstName: data.first_name ?? "",
    lastName: data.last_name ?? "",
    imageUrl: imageUrlFromWebhook(data),
  };
}

function primaryEmailFromClerkUser(user: ClerkUser): string {
  return (
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    ""
  );
}

function imageUrlFromClerkUser(user: ClerkUser): string {
  let url = user.imageUrl || "";
  if (!url && user.externalAccounts[0]?.imageUrl) {
    url = user.externalAccounts[0].imageUrl;
  }
  return url;
}

/** Maps `currentUser()` result to the same create shape as the webhook. */
export function mapClerkUserToCreateDoc(
  user: ClerkUser,
  timestamp = new Date().toISOString()
): MongoUserCreateFields {
  return {
    clerkId: user.id,
    email: primaryEmailFromClerkUser(user),
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    imageUrl: imageUrlFromClerkUser(user),
    role: "customer",
    address: "",
    phoneNumber: "",
    timestamp,
  };
}

/** Maps `currentUser()` to profile fields for `user.updated`-style sync. */
export function mapClerkUserToProfilePatch(user: ClerkUser): MongoUserProfilePatch {
  return {
    email: primaryEmailFromClerkUser(user),
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    imageUrl: imageUrlFromClerkUser(user),
  };
}
