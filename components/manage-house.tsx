"use client";

import { IHouse } from "@/lib/models/house.model";
import {
  ArrowLeft,
  Car,
  CheckCircle,
  Circle,
  Home,
  PlayCircle,
  Upload,
  Trash2,
  Plus,
} from "lucide-react";
import Image from "next/image";

import Link from "next/link";
import { useState, useEffect } from "react";
import MaxWidthWrapper from "./max-width-wrapper";
import { useUser } from "@clerk/nextjs";
import LoadingComponent from "./ui/loading-component";
import { useRouter } from "next/navigation";
import ErrorDialog from "./dialogs/error-dialog";
import ValidationDialog from "./dialogs/validation-dialog";
import SuccessDialog from "./dialogs/success-dialog";
import PaymentInfo from "./payment-info";
import { useListingImages } from "@/components/manage-listing/useListingImages";
import { useListingReceipt } from "@/components/manage-listing/useListingReceipt";
import { appendCommonUploadFields } from "@/components/manage-listing/append-upload-fields";
import type { ListingImageData } from "@/components/manage-listing/image-types";

interface HouseFormData {
  name: string;
  bedroom: number;
  size: number;
  bathroom: number;
  parkingSpace: number;
  condition: string;
  maintenance: string;
  price: number;
  servicePrice?: number;
  description: string;
  advertisementType: "Rent" | "Sale";
  paymentMethod: "Monthly" | "Quarterly" | "Annual";
  houseType: "House" | "Apartment" | "Guest House";
  essentials: string[];
  currency: string;
  imageUrl?: string;
}

type ImageData = ListingImageData;

interface ManageHouseProps {
  initialData?: IHouse;
  isEditMode?: boolean;
}

const ManageHouse: React.FC<ManageHouseProps> = ({
  initialData,
  isEditMode = false,
}) => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [formData, setFormData] = useState<HouseFormData>({
    name: initialData?.name || "",
    bedroom: initialData?.bedroom || 0,
    size: initialData?.size || 0,
    bathroom: initialData?.bathroom || 0,
    parkingSpace: initialData?.parkingSpace || 0,
    condition: initialData?.condition || "",
    maintenance: initialData?.maintenance || "",
    price: initialData?.price || 0,
    servicePrice: undefined,
    description: initialData?.description || "",
    advertisementType:
      (initialData?.advertisementType as "Rent" | "Sale") || "Rent",
    paymentMethod:
      (initialData?.paymentMethod as "Monthly" | "Quarterly" | "Annual") ||
      "Monthly",
    houseType:
      (initialData?.houseType as "House" | "Apartment" | "Guest House") ||
      "House",
    essentials: initialData?.essentials || [],
    currency: initialData?.currency || "ETB",
  });

  const [isSending, setIsSending] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [missingFields, setMissingFields] = useState<
    { name: string; label: string; valid: boolean }[]
  >([]);
  const [createdHouseId, setCreatedHouseId] = useState<string>("");

  const {
    images,
    setImages,
    removedImageUrls,
    setRemovedImageUrls,
    fileInputRef,
    handleFileChange,
    handleAddMoreImages,
    handleRemoveImage,
  } = useListingImages(isEditMode, initialData);

  const {
    selectedReceipt,
    receiptPreview,
    receiptInputRef,
    handleReceiptChange,
    clearReceipt,
  } = useListingReceipt();

  const essentials = [
    "WiFi",
    "Furnished",
    "Play Ground",
    "Living Area",
    "Gym",
    "Outdoor",
    "Dining Area",
    "Jacuzzi",
    "Steam",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "bedroom" ||
        name === "size" ||
        name === "bathroom" ||
        name === "parkingSpace" ||
        name === "price"
          ? Number(value)
          : value,
    }));
  };

  const handleOptionChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSelection = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      essentials: prev.essentials.includes(item)
        ? prev.essentials.filter((i) => i !== item)
        : [...prev.essentials, item],
    }));
  };

  const validateForm = () => {
    const requiredFields = [
      { name: "name", label: "House Name" },
      { name: "bedroom", label: "Number of Bedrooms" },
      { name: "size", label: "Size" },
      { name: "bathroom", label: "Number of Bathrooms" },
      { name: "parkingSpace", label: "Parking Space" },
      { name: "price", label: "Price" },
      { name: "description", label: "Description" },
      { name: "advertisementType", label: "Advertisement Type" },
    ];

    // Check if formData has any undefined values for required fields
    const invalidFields = requiredFields.map((field) => {
      const value = formData[field.name as keyof HouseFormData];
      return {
        ...field,
        valid:
          value !== undefined &&
          value !== null &&
          (typeof value === "string" ? value.trim() !== "" : true) &&
          (typeof value === "number" ? !isNaN(value) : true),
      };
    });

    // Also check if at least one image is included
    const hasImages = images.length > 0;
    if (!hasImages) {
      invalidFields.push({
        name: "images",
        label: "House Images",
        valid: false,
      });
    }

    setMissingFields(invalidFields);
    return invalidFields.every((field) => field.valid);
  };

  const handleSend = async () => {
    setIsSending(true);

    if (!validateForm()) {
      setShowValidationDialog(true);
      setIsSending(false);
      return;
    }

    try {
      const apiFormData = new FormData();

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        // Safely handle null or undefined values
        if (value !== undefined && value !== null) {
          if (typeof value === "object") {
            // If it's an object (like arrays), stringify it
            apiFormData.append(key, JSON.stringify(value));
          } else {
            // Otherwise convert to string safely
            apiFormData.append(key, String(value));
          }
        } else {
          // For undefined or null values, append empty string
          apiFormData.append(key, "");
        }
      });

      appendCommonUploadFields(
        apiFormData,
        images,
        removedImageUrls,
        selectedReceipt
      );

      const endpoint = isEditMode
        ? `/api/house/${initialData?._id}`
        : "/api/house/create";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        body: apiFormData,
      });

      const result = await response.json();

      if (result.success) {
        setCreatedHouseId(result.houseId || "");
        setShowSuccessDialog(true);

        if (!isEditMode) {
          setFormData({
            name: "",
            bedroom: 0,
            size: 0,
            bathroom: 0,
            parkingSpace: 0,
            condition: "",
            maintenance: "",
            price: 0,
            servicePrice: 3000,
            description: "",
            advertisementType: "Rent",
            paymentMethod: "Monthly",
            houseType: "House",
            essentials: [],
            currency: "ETB",
          });
          setImages([]);
          setRemovedImageUrls([]);
          clearReceipt();
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      } else {
        throw new Error(result.error || "Failed to save house");
      }
    } catch (error) {
      setErrorMessage("Failed to save house");
      setErrorDetails(error instanceof Error ? error.message : "Unknown error");
      setShowErrorDialog(true);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (showErrorDialog || showSuccessDialog || showValidationDialog) {
      const timer = setTimeout(() => {
        setShowErrorDialog(false);
        setShowSuccessDialog(false);
        setShowValidationDialog(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showErrorDialog, showSuccessDialog, showValidationDialog]);

  useEffect(() => {
    // When advertisement type changes to "Sale", we don't need payment terms
    if (formData.advertisementType === "Sale") {
      // Just keep the current payment method as it won't be used
      // You could also set a default if needed
    }
  }, [formData.advertisementType]);

  if (!isLoaded) return <LoadingComponent />;
  if (!user) return <div>Please log in</div>;

  return (
    <section className="flex flex-col min-h-screen bg-gray-50">
      <MaxWidthWrapper>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {isEditMode ? "Edit House" : "Manage Products"}
          </h1>

          {/* Main Content */}
          <main className="flex-1 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {isEditMode ? (
                <button
                  onClick={() => router.back()}
                  className="flex items-center text-gray-700 hover:text-green-600 mb-8 text-sm font-medium transition-colors duration-200"
                >
                  <ArrowLeft size={18} className="mr-2" />
                  Back to Houses
                </button>
              ) : (
                <Link href="/manage-product/car">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors w-full sm:w-auto">
                    <Car className="w-5 h-5" />
                    <span className="font-medium">Car For Sale</span>
                  </button>
                </Link>
              )}
              {!isEditMode && (
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors w-full sm:w-auto">
                  <Home className="w-5 h-5" />
                  <span className="font-medium">Create House</span>
                </button>
              )}
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-8 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="New House Listing"
                      required
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["House", "Apartment", "Guest House"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleOptionChange("houseType", type)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                          formData.houseType === type
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                        }`}
                      >
                        {type === "House" && <Home className="w-5 h-5" />}
                        {type === "Apartment" && <Home className="w-5 h-5" />}
                        {type === "Guest House" && (
                          <PlayCircle className="w-5 h-5" />
                        )}
                        <span className="text-sm font-medium">{type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Property Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bedroom *
                    </label>
                    <input
                      type="number"
                      name="bedroom"
                      value={formData.bedroom || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="5"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size *
                    </label>
                    <input
                      type="number"
                      name="size"
                      value={formData.size || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="225"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bathroom *
                    </label>
                    <input
                      type="number"
                      name="bathroom"
                      value={formData.bathroom || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="3"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parking Space *
                    </label>
                    <input
                      type="number"
                      name="parkingSpace"
                      value={formData.parkingSpace || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="2"
                      required
                    />
                  </div>
                </div>

                {/* Essentials */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Essentials
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {essentials.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleSelection(item)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-colors ${
                          formData.essentials.includes(item)
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                        }`}
                      >
                        {formData.essentials.includes(item) ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                        <span className="text-sm">{item}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    placeholder="House description"
                    rows={4}
                    required
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-4 space-y-6">
                {/* File Uploads */}
                <div className="space-y-4">
                  {/* House Images Upload */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      House Images
                    </label>

                    {/* Image Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {images.map((image, index) => (
                        <div
                          key={image.id || index}
                          className="h-40 relative border border-gray-300 rounded-lg overflow-hidden group"
                        >
                          <Image
                            src={image.preview || "/placeholder-image.jpg"}
                            alt={`House image ${index + 1}`}
                            width={400}
                            height={400}
                            className="w-full h-full object-cover"
                            priority
                          />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add More Images Button */}
                      <div
                        className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-primary transition-colors cursor-pointer"
                        onClick={handleAddMoreImages}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddMoreImages();
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label="Add more house images"
                      >
                        <Plus className="w-8 h-8 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                          Add More Images
                        </p>
                      </div>
                    </div>

                    <input
                      type="file"
                      name="files"
                      accept="image/*"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                    />

                    <button
                      type="button"
                      onClick={handleAddMoreImages}
                      className="mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                    >
                      Choose House Images
                    </button>
                    <p className="text-sm text-gray-500 mt-1">
                      You can upload multiple images.{" "}
                      {images.length > 0
                        ? `${images.length} image(s) selected.`
                        : ""}
                    </p>
                    <p className="text-xs mt-1 text-red-400">
                      Total image size cannot exceed 4.0MB. Please compress your
                      images if needed.
                    </p>
                  </div>

                  {/* Payment Information */}
                  {!isEditMode && <PaymentInfo />}

                  {/* Receipt Upload */}
                  {!isEditMode && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Receipt *
                      </label>
                      <div
                        className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-primary transition-colors relative overflow-hidden cursor-pointer"
                        onClick={() => receiptInputRef.current?.click()}
                      >
                        {receiptPreview ? (
                          <>
                            <Image
                              src={receiptPreview}
                              alt="Receipt preview"
                              className="absolute inset-0 w-full h-full object-cover"
                              width={500}
                              height={300}
                            />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <Upload className="w-8 h-8 text-white" />
                              <p className="mt-2 text-sm text-white">
                                Click to change receipt
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">
                              Click to upload payment receipt
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        required
                        name="receipt"
                        accept="image/*,.pdf"
                        onChange={handleReceiptChange}
                        ref={receiptInputRef}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => receiptInputRef.current?.click()}
                        className="mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                      >
                        Choose Receipt File
                      </button>
                      {selectedReceipt && (
                        <span className="ml-2 text-sm text-gray-600">
                          {selectedReceipt.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition
                    </label>
                    <input
                      type="text"
                      name="condition"
                      value={formData.condition}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="Excellent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maintenance
                    </label>
                    <input
                      type="text"
                      name="maintenance"
                      value={formData.maintenance}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="Frequent"
                    />
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    placeholder="1000"
                    required
                  />
                </div>

                {/* Advertisement Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Advertisement Type
                  </label>
                  <div className="flex">
                    <button
                      type="button"
                      onClick={() =>
                        handleOptionChange("advertisementType", "Rent")
                      }
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-lg border transition-colors ${
                        formData.advertisementType === "Rent"
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                      }`}
                    >
                      <CheckCircle
                        className={`w-5 h-5 ${
                          formData.advertisementType === "Rent"
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      <span className="text-sm font-medium">For Rent</span>
                    </button>
                  </div>
                </div>

                {/* Service Price */}
                {!isEditMode && (
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        Service Price
                      </label>
                      <span className="px-3 py-1 bg-primary/20 text-primary rounded-md font-medium">
                        3,000 ETB
                      </span>
                    </div>
                    <input
                      type="hidden"
                      name="servicePrice"
                      value={formData.servicePrice}
                    />
                  </div>
                )}

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <div className="flex gap-2">
                    {["ETB", "USD", "EUR", "GBP"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleOptionChange("currency", option)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-colors ${
                          formData.currency === option
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                        }`}
                      >
                        {formData.currency === option ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                        <span className="text-sm">{option}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Terms - only show for Rent */}
                {formData.advertisementType === "Rent" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Terms
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Monthly", "Quarterly", "Annual"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            handleOptionChange("paymentMethod", option)
                          }
                          className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-colors ${
                            formData.paymentMethod === option
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                          }`}
                        >
                          {formData.paymentMethod === option ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                          <span className="text-sm">{option}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending}
                  className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
                    isSending
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {isSending ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {isEditMode ? "Updating..." : "Creating..."}
                    </div>
                  ) : isEditMode ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </div>
          </main>
        </div>
      </MaxWidthWrapper>

      {/* Dialogs */}
      <ErrorDialog
        isOpen={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        onRetry={handleSend}
        title="Error Creating House"
        errorMessage={errorMessage}
        errorDetails={errorDetails}
      />

      <ValidationDialog
        isOpen={showValidationDialog}
        onClose={() => setShowValidationDialog(false)}
        missingFields={missingFields}
        onGoBack={() => setShowValidationDialog(false)}
      />

      <SuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        productName={formData.name}
        productId={createdHouseId}
        productType="house"
      />
    </section>
  );
};

export default ManageHouse;
