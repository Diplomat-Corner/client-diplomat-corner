import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db-connect";
import House from "@/lib/models/house.model";
import { auth } from "@clerk/nextjs/server";
import { uploadImageToCPanel } from "@/lib/upload";
import { apiLogger } from "@/lib/logger";
import { buildClerkIdToSellerMap, type SellerPreview } from "@/lib/seller-preview";

interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
  houseId?: string;
  paymentId?: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const includeSeller =
      searchParams.get("includeSeller") === "1" ||
      searchParams.get("includeSeller") === "true";

    await connectToDatabase();
    const house = await House.findById(id);

    if (!house) {
      return NextResponse.json(
        { success: false, error: "House not found", paymentId: "" },
        { status: 404 }
      );
    }

    const base = { success: true as const, ...house.toObject() };
    if (includeSeller && house.userId && house.userId !== "admin") {
      const map = await buildClerkIdToSellerMap([house.userId]);
      const seller = map.get(house.userId);
      if (seller) {
        return NextResponse.json({
          ...base,
          seller,
        } as typeof base & { seller: SellerPreview });
      }
    }

    return NextResponse.json(base);
  } catch (error) {
    apiLogger.error("Error fetching house:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch house", paymentId: "" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;
    const userId = (await auth()).userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", paymentId: "" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const existingHouse = await House.findById(id);

    if (!existingHouse) {
      return NextResponse.json(
        { success: false, error: "House not found", paymentId: "" },
        { status: 404 }
      );
    }

    if (existingHouse.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", paymentId: "" },
        { status: 403 }
      );
    }

    const formData = await req.formData();

    const files: File[] = [];
    formData.getAll("files").forEach((file) => {
      if (file instanceof File) {
        files.push(file);
      }
    });

    const singleFile = formData.get("file") as File | null;
    if (singleFile) {
      files.push(singleFile);
    }

    const receiptFile = formData.get("receipt") as File;

    let existingImageUrls: string[] = [];
    try {
      const existingImageUrlsStr = formData.get("existingImageUrls") as string;
      if (existingImageUrlsStr) {
        existingImageUrls = JSON.parse(existingImageUrlsStr);
      }
    } catch (e) {
      apiLogger.warn("Error parsing existingImageUrls");
    }

    let removedImageUrls: string[] = [];
    try {
      const removedImageUrlsStr = formData.get("removedImageUrls") as string;
      if (removedImageUrlsStr) {
        removedImageUrls = JSON.parse(removedImageUrlsStr);
      }
    } catch (e) {
      apiLogger.warn("Error parsing removedImageUrls");
    }

    const houseData = {
      name: formData.get("name") as string,
      bedroom: Number(formData.get("bedroom")),
      size: Number(formData.get("size")),
      bathroom: Number(formData.get("bathroom")),
      parkingSpace: Number(formData.get("parkingSpace")),
      condition: formData.get("condition") as string,
      maintenance: formData.get("maintenance") as string,
      price: Number(formData.get("price")),
      description: formData.get("description") as string,
      advertisementType: formData.get("advertisementType") as "Rent" | "Sale",
      paymentMethod: formData.get("paymentMethod") as
        | "Monthly"
        | "Quarterly"
        | "Annual",
      houseType: formData.get("houseType") as
        | "House"
        | "Apartment"
        | "Guest House",
      essentials: JSON.parse(formData.get("essentials") as string),
      currency: formData.get("currency") as string,
    };

    if (
      !houseData.name ||
      !houseData.bedroom ||
      !houseData.size ||
      !houseData.bathroom ||
      !houseData.parkingSpace ||
      !houseData.price ||
      !houseData.description
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields", paymentId: "" },
        { status: 400 }
      );
    }

    let imageUrls: string[] = existingHouse.imageUrls || [];

    if (removedImageUrls.length > 0) {
      imageUrls = imageUrls.filter((url) => !removedImageUrls.includes(url));
    }

    if (existingImageUrls.length > 0) {
      existingImageUrls.forEach((url) => {
        if (!imageUrls.includes(url)) {
          imageUrls.push(url);
        }
      });
    }

    for (const file of files) {
      const uploadResult = await uploadImageToCPanel(file, "public_images");
      if (!uploadResult.success) {
        return NextResponse.json(
          { success: false, error: uploadResult.error, paymentId: "" },
          { status: 500 }
        );
      }
      imageUrls.push(uploadResult.publicUrl!);
    }

    let receiptUrl = existingHouse.paymentReceipt?.url;
    if (receiptFile) {
      const uploadResult = await uploadImageToCPanel(receiptFile, "receipts");
      if (!uploadResult.success) {
        return NextResponse.json(
          { success: false, error: uploadResult.error, paymentId: "" },
          { status: 500 }
        );
      }
      receiptUrl = uploadResult.publicUrl;
    }

    const updatedHouse = await House.findByIdAndUpdate(
      id,
      {
        ...houseData,
        imageUrl: imageUrls.length > 0 ? imageUrls[0] : existingHouse.imageUrl,
        imageUrls: imageUrls,
        paymentReceipt: receiptUrl
          ? {
              url: receiptUrl,
              paymentId: existingHouse.paymentId,
              uploadedAt: new Date(),
            }
          : existingHouse.paymentReceipt,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "House updated successfully",
      houseId: updatedHouse._id.toString(),
      paymentId: existingHouse.paymentId,
    });
  } catch (error) {
    apiLogger.error("House update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update house", paymentId: "" },
      { status: 500 }
    );
  }
}
