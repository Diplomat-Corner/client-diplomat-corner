import React from "react";
import HouseListings from "@/components/house/house-listings";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Houses For Rent | Diplomat Corner",
  description: "Browse all properties available for rent on Diplomat Corner",
};

export default function HouseForRentPage() {
  return (
    <div className="container mx-auto py-2">
      <HouseListings advertisementType="Rent" />
    </div>
  );
}
