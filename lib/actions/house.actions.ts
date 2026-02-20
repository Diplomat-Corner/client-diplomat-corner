"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db-connect";
import House, { IHouse } from "@/lib/models/house.model";

interface HouseData {
  name: string;
  bedroom: number;
  size: number;
  bathroom: number;
  condition: string;
  maintenance: string;
  price: number;
  description: string;
  advertisementType: "Rent" | "Sale";
  paymentMethod: "Monthly" | "Quarterly" | "Annual";
  houseType: "House" | "Apartment" | "Guest House";
  essentials: string[];
  currency: string;
}

export async function createHouse(formData: HouseData) {
  try {
    await connectToDatabase();

    const house = await new House(formData).save();
    revalidatePath("/houses");
    return { success: true, house: toPlainObject(house) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteHouse(houseId: string) {
  try {
    await connectToDatabase();
    const house = await House.findByIdAndDelete(houseId);

    if (!house) {
      return { success: false, error: "House not found" };
    }

    revalidatePath("/houses");
    return { success: true, message: "House deleted successfully" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateHouseDetails(houseId: string, formData: HouseData) {
  try {
    await connectToDatabase();

    const house = await House.findByIdAndUpdate(houseId, formData, {
      new: true,
      runValidators: true,
    });

    if (!house) {
      return { success: false, error: "House not found" };
    }

    revalidatePath("/houses");
    return { success: true, house: toPlainObject(house) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

const toPlainObject = <T>(doc: T): T | null => {
  return doc ? JSON.parse(JSON.stringify(doc)) : null;
};

export async function getAllHouses(): Promise<IHouse[]> {
  try {
    await connectToDatabase();
    const houses = await House.find({});
    return houses.map((house) => toPlainObject(house));
  } catch (error) {
    throw new Error(`Failed to fetch houses: ${(error as Error).message}`);
  }
}

export async function getHouseById(id: string) {
  await connectToDatabase();
  const house = await House.findById(id);
  return house;
}
