import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db-connect";
import Car from "@/lib/models/car.model";
import Payment from "@/lib/models/payment.model";
import { auth } from "@clerk/nextjs/server";
import { v4 as uuidv4 } from "uuid";
import { uploadImageToCPanel } from "@/lib/upload";
import { apiLogger } from "@/lib/logger";

interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
  carId?: string;
  paymentId?: string;
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const userId = (await auth()).userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", paymentId: "" },
        { status: 401 }
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

    const MAX_TOTAL_SIZE = 2 * 1024 * 1024;
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);

    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Total image size exceeds 4.5MB limit. Please reduce image sizes or upload fewer images.",
          paymentId: "",
        },
        { status: 413 }
      );
    }

    const receiptFile = formData.get("receipt") as File;

    const carData = {
      name: formData.get("name") as string,
      year: Number(formData.get("year")),
      mileage: Number(formData.get("mileage")),
      speed: Number(formData.get("speed")),
      milesPerGallon: Number(formData.get("milesPerGallon")),
      transmission: formData.get("transmission") as string,
      fuel: formData.get("fuel") as string,
      bodyType: formData.get("bodyType") as string,
      condition: formData.get("condition") as string,
      engine: formData.get("engine") as string,
      maintenance: formData.get("maintenance") as string,
      price: Number(formData.get("price")),
      description: formData.get("description") as string,
      advertisementType: formData.get("advertisementType") as "Rent" | "Sale",
      paymentMethod: (() => {
        const paymentValue = formData.get("paymentMethod") as string;
        switch (paymentValue) {
          case "1":
            return "Daily";
          case "2":
            return "Weekly";
          case "3":
            return "Monthly";
          case "4":
            return "Annually";
          default:
            return paymentValue as "Daily" | "Weekly" | "Monthly" | "Annually";
        }
      })(),
      currency: formData.get("currency") as string,
      tags: formData.get("tags") as string,
      userId,
      visiblity: "Private",
      status: "Pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      timestamp: new Date().toISOString(),
    };

    if (!carData.name || !carData.price || !carData.mileage) {
      return NextResponse.json(
        { success: false, error: "Missing required fields", paymentId: "" },
        { status: 400 }
      );
    }

    const paymentId = `${Date.now()}-${uuidv4()}`;
    const imageUrls: string[] = [];

    for (const file of files) {
      const uploadResult = await uploadImageToCPanel(file, "public_images");
      if (!uploadResult.success) {
        apiLogger.error("Image upload failed:", uploadResult.error);
        return NextResponse.json(
          { success: false, error: uploadResult.error, paymentId: "" },
          { status: 500 }
        );
      }
      imageUrls.push(uploadResult.publicUrl!);
    }

    let receiptUrl = "";
    if (receiptFile) {
      const uploadResult = await uploadImageToCPanel(receiptFile, "receipts");
      if (!uploadResult.success) {
        return NextResponse.json(
          { success: false, error: uploadResult.error, paymentId: "" },
          { status: 500 }
        );
      }
      receiptUrl = uploadResult.publicUrl!;
    }

    await connectToDatabase();

    const car = await Car.create({
      ...carData,
      imageUrl: imageUrls.length > 0 ? imageUrls[0] : undefined,
      imageUrls: imageUrls,
      paymentId,
    });

    await Payment.create({
      paymentId,
      servicePrice: Number(formData.get("servicePrice")),
      receiptUrl,
      productId: car._id.toString(),
      productType: "car",
      userId,
    });

    return NextResponse.json({
      success: true,
      message: "Car created successfully",
      carId: car._id.toString(),
      paymentId,
    });
  } catch (error) {
    apiLogger.error("Car creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create car", paymentId: "" },
      { status: 500 }
    );
  }
}
