"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Bed,
  Bath,
  Ruler,
  Car,
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  BadgeCheck,
  Home,
  Square,
  CalendarDays,
  Sofa,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Phone,
} from "lucide-react";
import type { IHouse } from "@/lib/models/house.model";
import type { IUser } from "@/lib/models/user.model";
import ContactSellerDialog from "@/components/dialogs/contact-seller-dialog";
import HouseDetailLoadingSkeleton from "@/components/loading-effects/id-loading-house";
import ReviewsSection from "@/components/reviews/reviews-section";
import { motion, AnimatePresence } from "framer-motion";

const paymentMethodLabels: Record<string, string> = {
  Monthly: "Monthly",
  Quarterly: "Quarterly",
  Annual: "Annual",
};

export default function HouseDetails() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id as string;
  const [house, setHouse] = useState<IHouse | null>(null);
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // State for image carousel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    const fetchHouseAndUser = async () => {
      try {
        const response = await fetch(`/api/house/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setHouse(data);

        // Fetch user data if house exists
        if (data.userId) {
          const userResponse = await fetch(`/api/users/${data.userId}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUser(userData.user);
          }
        }

        // Set up image URLs array
        if (data.imageUrls && data.imageUrls.length > 0) {
          setImageUrls(data.imageUrls);
        } else if (data.imageUrl) {
          setImageUrls([data.imageUrl]);
        } else {
          setImageUrls(["/c.jpg"]); // Default image
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchHouseAndUser();
  }, [id]);

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === imageUrls.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? imageUrls.length - 1 : prevIndex - 1
    );
  };

  const selectImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  if (loading) {
    return <HouseDetailLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <p className="text-center text-red-600 text-lg">Error: {error}</p>
      </div>
    );
  }

  if (!house) {
    return (
      <div className="container mx-auto px-4 py-16">
        <p className="text-center text-gray-600 text-lg">Property not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-5 max-w-6xl">
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-700 hover:text-green-600 mb-8 text-sm font-medium transition-colors duration-200"
      >
        <ArrowLeft size={18} className="mr-2" />
        Back to Houses
      </button>

      {/* Desktop: Side-by-side layout, Mobile: Stacked layout with specific order */}
      <div className="block lg:flex lg:space-x-12">
        {/* Left Column on Desktop / First + Third on Mobile */}
        <div className="lg:w-2/3">
          {/* Image Carousel */}
          <div className="relative rounded-xl overflow-hidden mb-8">
            {/* Main image */}
            <div className="relative h-[400px] w-full">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={imageUrls[currentImageIndex]}
                    alt={`${house.name} - image ${currentImageIndex + 1}`}
                    fill
                    className="object-cover"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation arrows - only show if more than one image */}
            {imageUrls.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-2 rounded-full text-white transition-colors z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-2 rounded-full text-white transition-colors z-10"
                  aria-label="Next image"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Thumbnail navigation - only show if more than one image */}
            {imageUrls.length > 1 && (
              <div className="flex justify-center mt-4 space-x-2">
                {imageUrls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => selectImage(index)}
                    className={`h-2 w-2 rounded-full transition-all ${
                      currentImageIndex === index
                        ? "bg-primary w-4"
                        : "bg-gray-300"
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Thumbnail strip */}
            {imageUrls.length > 1 && (
              <div className="flex mt-4 overflow-x-auto pb-2 space-x-2 scrollbar-thin scrollbar-thumb-gray-300">
                {imageUrls.map((url, index) => (
                  <div
                    key={index}
                    onClick={() => selectImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md cursor-pointer overflow-hidden ${
                      currentImageIndex === index
                        ? "ring-2 ring-primary"
                        : "opacity-70"
                    }`}
                  >
                    <Image
                      src={url}
                      alt={`${house.name} thumbnail ${index + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Description - Visible only on desktop here, third on mobile (see below) */}
          <div className="hidden lg:block">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Description
            </h2>
            <p className="text-gray-600 leading-relaxed">{house.description}</p>
          </div>

          {/* 4. Reviews - Visible only on desktop here, fourth on mobile (see below) */}
          <div className="hidden lg:block">
            <ReviewsSection
              productId={id}
              productType="house"
              sellerId={house.userId}
            />
          </div>
        </div>

        {/* Right Column on Desktop / Second on Mobile */}
        <div className="lg:w-1/3 mt-8 lg:mt-0 order-2">
          <div className="mb-4">
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                {house.name}
              </h1>
              <div className="flex-shrink-0 ml-2">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    house.advertisementType === "Rent"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  For {house.advertisementType}
                </span>
              </div>
            </div>
          </div>

          <p className="text-2xl text-green-600 font-semibold mb-6">
            {house.currency} {house.price.toLocaleString()}
          </p>

          {house.advertisementType === "Rent" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Clock className="mr-2 text-blue-500" size={20} />
                Rental Information
              </h3>

              <div className="grid grid-cols-1 gap-3">
                <motion.div
                  className="flex items-center p-2 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <Calendar className="text-blue-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Schedule</p>
                    <p className="font-medium text-gray-800">
                      {paymentMethodLabels[house.paymentMethod] ||
                        "One-time Payment"}
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-center p-2 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <DollarSign className="text-blue-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rental Rate</p>
                    <p className="font-medium text-gray-800">
                      {house.currency} {house.price.toLocaleString()} per{" "}
                      {paymentMethodLabels[
                        house.paymentMethod
                      ]?.toLowerCase() || "month"}
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-center p-2 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <BadgeCheck className="text-blue-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Availability</p>
                    <p className="font-medium text-gray-800">Available Now</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-4 text-gray-700 mb-8">
            <div className="flex items-center gap-2">
              <Bed size={18} className="text-gray-500" />
              <span className="text-sm">{house.bedroom} Bedrooms</span>
            </div>
            <div className="flex items-center gap-2">
              <Bath size={18} className="text-gray-500" />
              <span className="text-sm">{house.bathroom} Bathrooms</span>
            </div>
            <div className="flex items-center gap-2">
              <Square size={18} className="text-gray-500" />
              <span className="text-sm">{house.size.toLocaleString()} m²</span>
            </div>
            <div className="flex items-center gap-2">
              <Car size={18} className="text-gray-500" />
              <span className="text-sm">{house.parkingSpace} Parking</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Specifications
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {house.houseType && (
                <motion.div
                  className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                    <Home className="text-gray-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">House Type</p>
                    <p className="font-medium text-gray-800 break-words">
                      {house.houseType}
                    </p>
                  </div>
                </motion.div>
              )}
              {house.bedroom > 0 && (
                <motion.div
                  className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                    <Bed className="text-gray-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bedrooms</p>
                    <p className="font-medium text-gray-800 break-words">
                      {house.bedroom}
                    </p>
                  </div>
                </motion.div>
              )}
              {house.bathroom > 0 && (
                <motion.div
                  className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                    <Bath className="text-gray-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bathrooms</p>
                    <p className="font-medium text-gray-800 break-words">
                      {house.bathroom}
                    </p>
                  </div>
                </motion.div>
              )}
              {house.size > 0 && (
                <motion.div
                  className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                    <Square className="text-gray-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Area</p>
                    <p className="font-medium text-gray-800 break-words">
                      {house.size} m²
                    </p>
                  </div>
                </motion.div>
              )}
              {house.parkingSpace > 0 && (
                <motion.div
                  className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                    <Car className="text-gray-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Parking Spaces</p>
                    <p className="font-medium text-gray-800 break-words">
                      {house.parkingSpace}
                    </p>
                  </div>
                </motion.div>
              )}
              {house.condition && (
                <motion.div
                  className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                    <BadgeCheck className="text-gray-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Condition</p>
                    <p className="font-medium text-gray-800 break-words">
                      {house.condition}
                    </p>
                  </div>
                </motion.div>
              )}
              {house.maintenance && (
                <motion.div
                  className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                    <Clock className="text-gray-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Maintenance</p>
                    <p className="font-medium text-gray-800 break-words">
                      {house.maintenance}
                    </p>
                  </div>
                </motion.div>
              )}
              {house.essentials && house.essentials.length > 0 && (
                <motion.div
                  className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                    <Sofa className="text-gray-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Essentials</p>
                    <p className="font-medium text-gray-800 break-words">
                      {house.essentials.join(", ")}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Replace the button and dialog with conditional contact information */}
          {user && user.role !== "admin" && user.phoneNumber && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="text-primary" size={20} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Contact Owner
                </h3>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">Phone:</span>
                <span className="text-primary font-semibold">
                  {user.phoneNumber}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile-only sections for correct ordering */}
      <div className="lg:hidden mt-8">
        {/* 3. Description - Third on mobile */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Description
          </h2>
          <p className="text-gray-600 leading-relaxed">{house.description}</p>
        </div>

        {/* 4. Reviews - Fourth on mobile */}
        <ReviewsSection
          productId={id}
          productType="house"
          sellerId={house.userId}
        />
      </div>
    </div>
  );
}
