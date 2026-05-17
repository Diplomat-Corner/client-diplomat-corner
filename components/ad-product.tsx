"use client";
import { useRef, useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  Plus,
  Pencil,
  ImagePlus,
  Layout,
  RectangleHorizontal,
  Square,
  CheckCircle,
  Circle,
} from "lucide-react";
import { createAdvertisement, scheduleAdvertisement } from "@/lib/actions/advertisements.actions";
import type {
  AdvertisementResponse,
  AdvertisementPublicationStatus,
} from "@/lib/models/advertisement.types";

export default function ManageAds() {
  const queryClient = useQueryClient();
  const adImageInputRef = useRef<HTMLInputElement>(null);
  const [adImageUploadError, setAdImageUploadError] = useState<string | null>(
    null
  );
  const [isUploadingAdImage, setIsUploadingAdImage] = useState(false);
  const [priority, setPriority] = useState("Important");
  const [visibility, setVisibility] = useState(true);
  const [time, setTime] = useState("Current");
  const [isPending, startTransition] = useTransition();
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    errors?: string[];
  } | null>(null);

  const { data: ads = [] } = useQuery({
    queryKey: queryKeys.advertisements(),
    queryFn: async () => {
      const response = await fetch("/api/advertisements");
      if (!response.ok) throw new Error("Failed to fetch ads");
      const data = await response.json();
      if (Array.isArray(data)) {
        return data as AdvertisementResponse[];
      }
      return (data?.advertisements ?? []) as AdvertisementResponse[];
    },
    staleTime: 60_000,
  });

  const [formData, setFormData] = useState({
    companyName: "",
    product: "",
    startTime: "",
    endTime: "",
    tags: "",
    description: "",
    advertisementType: "normal" as "carousel" | "normal" | "banner",
    link: "https://example.com",
    imageUrl: "",
  });

  const handleAdImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAdImageUploadError(null);
    setIsUploadingAdImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/advertisements/upload", {
        method: "POST",
        body: fd,
      });
      const data: { error?: string; imageUrl?: string; url?: string; publicUrl?: string } =
        await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }
      const url =
        (typeof data.imageUrl === "string" && data.imageUrl) ||
        (typeof data.url === "string" && data.url) ||
        (typeof data.publicUrl === "string" && data.publicUrl);
      if (!url) {
        throw new Error("No image URL returned");
      }
      setFormData((prev) => ({ ...prev, imageUrl: url }));
    } catch (err) {
      setAdImageUploadError(
        err instanceof Error ? err.message : "Upload failed"
      );
    } finally {
      setIsUploadingAdImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const priorityMap: { [key: string]: "High" | "Medium" | "Low" } = {
      Important: "High",
      Medium: "Medium",
      Low: "Low",
    };

    const imageUrls = formData.imageUrl.trim()
      ? [formData.imageUrl.trim()]
      : ["https://placehold.co/800x400/png"];

    const status: AdvertisementPublicationStatus =
      time === "Current" ? "Active" : "Inactive";
    const adDetails = {
      title: formData.companyName || "Untitled",
      description: formData.description,
      advertisementType: formData.advertisementType,
      link: formData.link.trim() || "https://example.com",
      imageUrls,
      priority: priorityMap[priority],
      status,
      hashtags: formData.tags.split("#").filter((tag) => tag.trim()).map((tag) => `#${tag.trim()}`),
    };

    startTransition(async () => {
      try {
        if (!formData.companyName || !formData.description) {
          setSubmitResult({
            success: false,
            message: "Please fill in company name and description.",
          });
          return;
        }

        let result;
        if (formData.startTime && formData.endTime) {
          result = await scheduleAdvertisement(adDetails, formData.startTime, formData.endTime);
        } else {
          result = await createAdvertisement(adDetails);
        }

        setSubmitResult({
          success: true,
          message: `Advertisement created successfully with ID: ${result.id}`,
        });

        setFormData({
          companyName: "",
          product: "",
          startTime: "",
          endTime: "",
          tags: "",
          description: "",
          advertisementType: "normal",
          link: "https://example.com",
          imageUrl: "",
        });

        void queryClient.invalidateQueries({
          queryKey: queryKeys.advertisements(),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.homeAdvertisements(),
        });
      } catch (error) {
        setSubmitResult({
          success: false,
          message: `Error creating advertisement: ${(error as Error).message}`,
        });
      }
    });
  };

  return (
    <div className="p-6 bg-secondary min-h-screen text-primary">
      <h1 className="text-2xl font-bold">Manage Ads</h1>
      <div className="mt-6 flex gap-4">
        <aside className="w-1/4 bg-secondary p-4 rounded-3xl shadow-md border-2 border-primary">
          <h2 className="text-lg font-semibold">Products</h2>
          <ul className="mt-2 space-y-2">
            <li className="text-primary flex items-center gap-2">
              <Plus size={16} /> Add Products
            </li>
            <li className="text-primary flex items-center gap-2">
              <Pencil size={16} /> Edit Products
            </li>
          </ul>
          <h2 className="text-lg font-semibold mt-4">Adverts</h2>
          <ul className="mt-2 space-y-2">
            <li className="text-primary flex items-center gap-2">
              <Plus size={16} /> Add Adverts
            </li>
            <li className="text-primary flex items-center gap-2">
              <Pencil size={16} /> Edit Adverts
            </li>
          </ul>
        </aside>

        <main className="flex-1 bg-white p-6 rounded-3xl shadow-md border-2 border-primary grid grid-cols-2 gap-4">
          <div>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <ul className="flex flex-wrap gap-2">
                {(
                  [
                    { id: "carousel" as const, label: "Carousel", icon: Layout },
                    {
                      id: "normal" as const,
                      label: "Normal",
                      icon: Square,
                    },
                    {
                      id: "banner" as const,
                      label: "Banner",
                      icon: RectangleHorizontal,
                    },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <li
                    key={id}
                    className={`border border-primary px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary hover:text-white cursor-pointer active:bg-secondary ${
                      formData.advertisementType === id
                        ? "bg-primary text-white"
                        : ""
                    }`}
                    onClick={() =>
                      setFormData({ ...formData, advertisementType: id })
                    }
                  >
                    <Icon size={16} /> {label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-secondary p-4 rounded-3xl border-2 border-primary">
              <div>
                <label className="block text-sm font-semibold text-primary">
                  Company Name
                </label>
                <input
                  className="border-b-2 border-primary w-full p-2 focus:outline-none bg-secondary"
                  placeholder="Ford"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-primary">
                  Product
                </label>
                <input
                  className="border-b-2 border-primary w-full p-2 focus:outline-none bg-secondary"
                  placeholder="F150"
                  value={formData.product}
                  onChange={(e) =>
                    setFormData({ ...formData, product: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-primary">
                  Destination link (URL)
                </label>
                <input
                  className="border-b-2 border-primary w-full p-2 focus:outline-none bg-secondary"
                  placeholder="https://"
                  value={formData.link}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-primary">
                  Image URL (optional — upload below or paste a link; placeholder
                  if empty)
                </label>
                <input
                  className="border-b-2 border-primary w-full p-2 focus:outline-none bg-secondary"
                  placeholder="https://…"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-primary">
                  Starting Date
                </label>
                <input
                  type="date"
                  className="border-b-2 border-primary w-full p-2 focus:outline-none bg-secondary"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-primary">
                  End Date
                </label>
                <input
                  type="date"
                  className="border-b-2 border-primary w-full p-2 focus:outline-none bg-secondary"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="mt-4 flex gap-4">
              {["Current", "Past"].map((option) => (
                <button
                  key={option}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold ${
                    time === option
                      ? "bg-primary text-white border border-primary"
                      : "bg-secondary text-black border border-black"
                  }`}
                  onClick={() => setTime(option)}
                >
                  {time === option ? (
                    <CheckCircle size={16} />
                  ) : (
                    <Circle size={16} />
                  )}
                  <span>{option}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-2 border-primary p-4 rounded-3xl w-full">
            <div>
              <input
                ref={adImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAdImageFileChange}
              />
              <button
                type="button"
                disabled={isUploadingAdImage}
                onClick={() => adImageInputRef.current?.click()}
                className="h-40 w-full flex flex-col items-center justify-center border-dashed border-2 border-primary rounded-lg bg-secondary/30 hover:bg-secondary/50 disabled:opacity-60 transition-colors cursor-pointer"
              >
                <ImagePlus size={40} className="text-primary" />
                <p className="mt-4 text-sm text-primary">
                  {isUploadingAdImage
                    ? "Uploading…"
                    : "Click to upload campaign image"}
                </p>
              </button>
              {adImageUploadError && (
                <p className="mt-2 text-sm text-red-600">{adImageUploadError}</p>
              )}
              {formData.imageUrl.trim() !== "" && (
                <p className="mt-2 text-xs text-primary break-all">
                  Current image: {formData.imageUrl.trim()}
                </p>
              )}
            </div>

            <div className="mt-4 flex gap-4">
              {["Important", "Medium", "Low"].map((option) => (
                <button
                  key={option}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold ${
                    priority === option
                      ? "bg-primary text-white border border-primary"
                      : "bg-secondary text-black border border-black"
                  }`}
                  onClick={() => setPriority(option)}
                >
                  {priority === option ? (
                    <CheckCircle size={16} />
                  ) : (
                    <Circle size={16} />
                  )}
                  <span>{option}</span>
                </button>
              ))}
            </div>

            <div className="mt-4">
              <button
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold ${
                  visibility
                    ? "bg-primary text-white border border-primary"
                    : "bg-secondary text-black border border-black"
                }`}
                onClick={() => setVisibility(!visibility)}
              >
                {visibility ? <CheckCircle size={16} /> : <Circle size={16} />}
                <span>Visible</span>
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-primary">
                Tag
              </label>
              <input
                type="text"
                className="w-full p-2 border-b-2 border-primary focus:outline-none bg-white"
                placeholder="#Ford #Ad"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-primary">
                Short Description
              </label>
              <textarea
                className="w-full p-2 border-b-2 border-primary focus:outline-none bg-white"
                placeholder="Brief description here..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              ></textarea>
            </div>

            <div className="mt-4">
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="px-4 py-2 bg-primary text-white rounded-full text-sm font-semibold disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create Advertisement"}
              </button>
              {submitResult && (
                <div className="mt-2">
                  <p className={`text-sm ${submitResult.success ? "text-green-600" : "text-red-600"}`}>
                    {submitResult.message}
                  </p>
                  {submitResult.errors && (
                    <ul className="text-sm text-red-600 list-disc pl-5">
                      {submitResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Display fetched ads */}
            <div className="mt-4">
              <h2 className="text-lg font-semibold">All Advertisements</h2>
              {ads.length > 0 ? (
                <ul className="space-y-2">
                  {ads.map((ad) => (
                    <li key={ad._id} className="text-sm">
                      {ad.title} - {ad.advertisementType} ({ad.status})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm">No advertisements found.</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}