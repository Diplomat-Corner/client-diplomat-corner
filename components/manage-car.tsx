"use client";
import Image from "next/image";
import {
  Car,
  CheckCircle,
  Circle,
  Home,
  Upload,
  Trash2,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";

import { ICar } from "@/lib/models/car.model";
import LoadingComponent from "./ui/loading-component";
import ErrorDialog from "./dialogs/error-dialog";
import ValidationDialog from "./dialogs/validation-dialog";
import SuccessDialog from "./dialogs/success-dialog";
import PaymentInfo from "./payment-info";
import { useListingImages } from "@/components/manage-listing/useListingImages";
import { useListingReceipt } from "@/components/manage-listing/useListingReceipt";
import { appendCommonUploadFields } from "@/components/manage-listing/append-upload-fields";
import type { ListingImageData } from "@/components/manage-listing/image-types";

interface ICarExtended extends ICar {
  servicePrice?: number;
}

interface CarFormData {
  name: string;
  year: number;
  mileage: number;
  speed: number;
  milesPerGallon: number;
  transmission: string;
  fuel: string;
  bodyType: string;
  condition: string;
  engine: string;
  maintenance: string;
  price: number;
  servicePrice: number;
  description: string;
  advertisementType: "Rent" | "Sale";
  paymentMethod: string;
  currency: string;
  tags: string;
}

type ImageData = ListingImageData;

interface ManageCarProps {
  initialData?: ICarExtended;
  isEditMode?: boolean;
}

const ManageCar: React.FC<ManageCarProps> = ({
  initialData,
  isEditMode = false,
}) => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const userId = user?.id || "guest";

  const [formData, setFormData] = useState<CarFormData>({
    name: initialData?.name || "",
    year: initialData?.year || 0,
    mileage: initialData?.mileage || 0,
    speed: initialData?.speed || 0,
    milesPerGallon: initialData?.milesPerGallon || 0,
    transmission: initialData?.transmission || "Automatic",
    fuel: initialData?.fuel || "Gasoline",
    bodyType: initialData?.bodyType || "Truck",
    condition: initialData?.condition || "",
    engine: initialData?.engine || "",
    maintenance: initialData?.maintenance || "",
    price: initialData?.price || 0,
    servicePrice: initialData?.servicePrice || 3000,
    description: initialData?.description || "",
    advertisementType:
      (initialData?.advertisementType as "Rent" | "Sale") || "Sale",
    paymentMethod: initialData?.paymentMethod || "Daily",
    currency: initialData?.currency || "ETB",
    tags: initialData?.tags || "",
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
  const [createdCarId, setCreatedCarId] = useState<string>("");

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

  useEffect(() => {
    if (isLoaded) {
      setFormData((prev) => ({ ...prev, userId }));
    }
  }, [userId, isLoaded]);

  useEffect(() => {
    // When the advertisement type changes, set default payment method
    if (formData.advertisementType === "Sale") {
      setFormData((prev) => ({ ...prev, paymentMethod: "Daily" }));
    } else if (formData.advertisementType === "Rent") {
      // Use a functional update to access the latest state
      setFormData((prev) => {
        // Only update if payment method is Daily
        if (prev.paymentMethod === "Daily") {
          return { ...prev, paymentMethod: "Monthly" };
        }
        return prev;
      });
    }
  }, [formData.advertisementType]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "year" ||
        name === "mileage" ||
        name === "price" ||
        name === "servicePrice"
          ? Number(value)
          : value,
    }));
  };

  const handleOptionChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Add handleKeyDown function to prevent form submission on Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target instanceof HTMLElement) {
      // Prevent form submission when pressing Enter on input fields
      // unless it's a textarea or button
      const tagName = e.target.tagName.toLowerCase();
      if (tagName !== "textarea" && tagName !== "button") {
        e.preventDefault();
      }
    }
  };

  const validateForm = () => {
    const requiredFields = [
      { name: "name", label: "Car Name" },
      { name: "price", label: "Price" },
      { name: "mileage", label: "Mileage" },
      { name: "description", label: "Description" },
      { name: "advertisementType", label: "Advertisement Type" },
    ];

    // Check if formData has any undefined values for required fields
    const invalidFields = requiredFields.map((field) => {
      const value = formData[field.name as keyof CarFormData];
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
        label: "Car Images",
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

      // Convert paymentMethod to numeric format expected by the server
      let paymentMethodValue = "1"; // Default to Daily (1)

      if (formData.paymentMethod === "Daily") paymentMethodValue = "1";
      if (formData.paymentMethod === "Weekly") paymentMethodValue = "2";
      if (formData.paymentMethod === "Monthly") paymentMethodValue = "3";
      if (formData.paymentMethod === "Annually") paymentMethodValue = "4";

      // Add all form data to API form data
      Object.entries(formData).forEach(([key, value]) => {
        // Safely handle null or undefined values
        if (value !== undefined && value !== null) {
          if (key === "paymentMethod") {
            apiFormData.append(key, paymentMethodValue);
          } else {
            apiFormData.append(key, String(value));
          }
        } else {
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
        ? `/api/cars/${initialData?._id}`
        : "/api/cars/create";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        body: apiFormData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        setCreatedCarId(result.carId || "");
        setShowSuccessDialog(true);

        if (!isEditMode) {
          setFormData({
            name: "",
            year: 0,
            mileage: 0,
            speed: 0,
            milesPerGallon: 0,
            transmission: "Automatic",
            fuel: "Diesel",
            bodyType: "Truck",
            condition: "",
            engine: "",
            maintenance: "",
            price: 0,
            servicePrice: 3000,
            description: "",
            advertisementType: "Sale",
            paymentMethod: "Daily",
            currency: "ETB",
            tags: "",
          });
          setImages([]);
          setRemovedImageUrls([]);
          clearReceipt();
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      } else {
        throw new Error(result.error || "Failed to save car");
      }
    } catch (error) {
      setErrorMessage("Failed to save car");
      setErrorDetails(error instanceof Error ? error.message : "Unknown error");
      setShowErrorDialog(true);
    } finally {
      setIsSending(false);
    }
  };

  if (!isLoaded) {
    return <LoadingComponent />;
  }

  return (
    <section
      className="flex flex-col min-h-screen bg-gray-50"
      onKeyDown={handleKeyDown}
    >
      <MaxWidthWrapper>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {isEditMode ? "Edit Car" : "Manage Products"}
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
                  Back to Cars
                </button>
              ) : (
                <Link href="/manage-product/car">
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors w-full sm:w-auto">
                    <Car className="w-5 h-5" />
                    <span className="font-medium">Create Cars</span>
                  </button>
                </Link>
              )}
              {!isEditMode && (
                <Link href="/manage-product/house">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors w-full sm:w-auto">
                    <Home className="w-5 h-5" />
                    <span className="font-medium">Create House</span>
                  </button>
                </Link>
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
                      placeholder="New Car Listing"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <input
                      type="number"
                      name="year"
                      value={formData.year || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="2022"
                    />
                  </div>
                </div>

                {/* Car Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mileage *
                    </label>
                    <input
                      type="number"
                      name="mileage"
                      value={formData.mileage || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="50000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Speed
                    </label>
                    <input
                      type="number"
                      name="speed"
                      value={formData.speed || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="120"
                    />
                  </div>
                </div>

                {/* Transmission */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transmission
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Automatic", "Manual"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={(e) =>
                          handleOptionChange("transmission", option)
                        }
                        className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-colors ${
                          formData.transmission === option
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                        }`}
                      >
                        {formData.transmission === option ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                        <span className="text-sm">{option}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fuel Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuel Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Diesel", "Petrol", "Electric", "Hybrid"].map(
                      (option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={(e) => handleOptionChange("fuel", option)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-colors ${
                            formData.fuel === option
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                          }`}
                        >
                          {formData.fuel === option ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                          <span className="text-sm">{option}</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Body Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Body Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Truck", "SUV", "Sedan", "Hatchback", "Minivan"].map(
                      (option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={(e) =>
                            handleOptionChange("bodyType", option)
                          }
                          className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-colors ${
                            formData.bodyType === option
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                          }`}
                        >
                          {formData.bodyType === option ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                          <span className="text-sm">{option}</span>
                        </button>
                      )
                    )}
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
                    placeholder="Car description"
                    rows={4}
                    required
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-4 space-y-6">
                {/* File Uploads */}
                <div className="space-y-4">
                  {/* Car Image Upload */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Car Images
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
                            alt={`Car image ${index + 1}`}
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
                        aria-label="Add more car images"
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
                      Choose Car Images
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
                        Payment Receipt (Optional)
                      </label>
                      <div
                        className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-primary transition-colors relative overflow-hidden cursor-pointer"
                        onClick={() => receiptInputRef.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            receiptInputRef.current?.click();
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label="Upload payment receipt"
                      >
                        {receiptPreview ? (
                          <>
                            <Image
                              src={receiptPreview}
                              alt="Receipt preview"
                              width={400}
                              height={400}
                              className="absolute inset-0 w-full h-full object-cover"
                              priority
                            />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <Trash2 className="w-8 h-8 text-white" />
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
                      Engine
                    </label>
                    <input
                      type="text"
                      name="engine"
                      value={formData.engine}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="3.8L V6"
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
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={(e) =>
                        handleOptionChange("advertisementType", "Sale")
                      }
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-lg border transition-colors ${
                        formData.advertisementType === "Sale"
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                      }`}
                    >
                      <CheckCircle
                        className={`w-5 h-5 ${
                          formData.advertisementType === "Sale"
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      <span className="text-sm font-medium">For Sale</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) =>
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
                        onClick={(e) => handleOptionChange("currency", option)}
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

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    placeholder="#Ford #F150 #2022"
                  />
                </div>

                {/* Add payment period options that show only for Rent */}
                {formData.advertisementType === "Rent" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Period
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "Daily", label: "Daily" },
                        { value: "Weekly", label: "Weekly" },
                        { value: "Monthly", label: "Monthly" },
                        { value: "Annually", label: "Annually" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={(e) =>
                            handleOptionChange("paymentMethod", option.value)
                          }
                          className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-colors ${
                            formData.paymentMethod === option.value
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                          }`}
                        >
                          {formData.paymentMethod === option.value ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                          <span className="text-sm">{option.label}</span>
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
        title="Error Creating Car"
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
        productId={createdCarId}
        productType="car"
      />
    </section>
  );
};

export default ManageCar;
