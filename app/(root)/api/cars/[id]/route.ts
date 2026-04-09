import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db-connect";
import Car from "@/lib/models/car.model";
import Payment from "@/lib/models/payment.model";
import { auth } from "@clerk/nextjs/server";
import { uploadImageToCPanel } from "@/lib/upload";
import { apiLogger } from "@/lib/logger";
import { buildClerkIdToSellerMap, type SellerPreview } from "@/lib/seller-preview";

interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
  carId?: string;
  paymentId?: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const userId = (await auth()).userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", paymentId: "" },
        { status: 401 }
      );
    }

    const formData = await request.formData();

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
      updatedAt: new Date(),
    };

    if (!carData.name || !carData.price || !carData.mileage) {
      return NextResponse.json(
        { success: false, error: "Missing required fields", paymentId: "" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingCar = await Car.findById(id);
    if (!existingCar) {
      return NextResponse.json(
        { success: false, error: "Car not found", paymentId: "" },
        { status: 404 }
      );
    }

    if (existingCar.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", paymentId: "" },
        { status: 401 }
      );
    }

    let imageUrls: string[] = existingCar.imageUrls || [];

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

    let receiptUrl = "";
    if (receiptFile) {
      const uploadResult = await uploadImageToCPanel(receiptFile, "receipts");
      if (!uploadResult.success) {
        return NextResponse.json(
          { success: false, error: uploadResult.error, paymentId: "" },
          { status: 500 }
        );
      }
      receiptUrl = uploadResult.publicUrl || "";
    }

    const updatedCar = await Car.findByIdAndUpdate(
      id,
      {
        ...carData,
        imageUrl: imageUrls.length > 0 ? imageUrls[0] : existingCar.imageUrl,
        imageUrls: imageUrls,
      },
      { new: true }
    );

    if (receiptUrl) {
      await Payment.findOneAndUpdate(
        { carId: id },
        {
          receiptUrl,
          servicePrice: Number(formData.get("servicePrice")),
          updatedAt: new Date(),
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Car updated successfully",
      carId: updatedCar._id.toString(),
      paymentId: existingCar.paymentId,
    });
  } catch (error) {
    apiLogger.error("Car update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update car", paymentId: "" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const userId = (await auth()).userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", paymentId: "" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const car = await Car.findById(id);
    if (!car) {
      return NextResponse.json(
        { success: false, error: "Car not found", paymentId: "" },
        { status: 404 }
      );
    }

    if (car.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", paymentId: "" },
        { status: 401 }
      );
    }

    await Car.findByIdAndDelete(id);
    await Payment.findOneAndDelete({ carId: id });

    return NextResponse.json({
      success: true,
      message: "Car deleted successfully",
      carId: id,
      paymentId: car.paymentId,
    });
  } catch (error) {
    apiLogger.error("Car deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete car", paymentId: "" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const includeSeller =
      searchParams.get("includeSeller") === "1" ||
      searchParams.get("includeSeller") === "true";

    const car = await Car.findById(id);
    if (!car) {
      return NextResponse.json(
        { success: false, error: "Car not found" },
        { status: 404 }
      );
    }

    const base = { success: true as const, ...car.toObject() };
    if (includeSeller && car.userId && car.userId !== "admin") {
      const map = await buildClerkIdToSellerMap([car.userId]);
      const seller = map.get(car.userId);
      if (seller) {
        return NextResponse.json({ ...base, seller } as typeof base & {
          seller: SellerPreview;
        });
      }
    }

    return NextResponse.json(base);
  } catch (error) {
    apiLogger.error("Error fetching car:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch car" },
      { status: 500 }
    );
  }
}
