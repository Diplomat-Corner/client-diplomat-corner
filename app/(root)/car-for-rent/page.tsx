import CarListings from "@/components/car/car-listings";

export default function CarForRent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <CarListings advertisementType="Rent" />
    </div>
  );
}
