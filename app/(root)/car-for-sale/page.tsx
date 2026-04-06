import React from "react";
import CarListings from "@/components/car/car-listings";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cars For Sale | Diplomat Corner",
  description: "Browse all cars available for sale on Diplomat Corner",
};

export default function CarForSale() {
  return (
    <div className="min-h-screen bg-gray-50">
      <CarListings advertisementType="Sale" />
    </div>
  );
}
