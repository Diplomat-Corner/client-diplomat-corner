"use client";

import ListingBrowseLayout from "@/components/listings/listing-browse-layout";
import { useListingBrowse } from "@/components/listings/useListingBrowse";

export default function HouseListings({
  advertisementType,
}: {
  advertisementType?: string;
}) {
  const ctx = useListingBrowse("house", advertisementType);
  return <ListingBrowseLayout ctx={ctx} />;
}
