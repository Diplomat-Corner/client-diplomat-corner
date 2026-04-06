"use client";

import ListingBrowseLayout from "@/components/listings/listing-browse-layout";
import { useListingBrowse } from "@/components/listings/useListingBrowse";

export default function CarListings({
  advertisementType,
}: {
  advertisementType?: string;
}) {
  const ctx = useListingBrowse("car", advertisementType);
  return <ListingBrowseLayout ctx={ctx} />;
}
