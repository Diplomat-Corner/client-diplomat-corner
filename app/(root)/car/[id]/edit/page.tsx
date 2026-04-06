"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ManageCar from "@/components/manage-car";
import { useUser } from "@clerk/nextjs";
import { ICar } from "@/lib/models/car.model";
import {
  LoadingScreen,
  ErrorScreen,
  NotFoundScreen,
  PermissionDeniedScreen,
} from "@/components/error";
import { useRouter } from "next/navigation";
import LoadingComponent from "@/components/ui/loading-component";

export default function EditCarPage() {
  const { id } = useParams();
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [car, setCar] = useState<ICar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const response = await fetch(`/api/cars/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch car");
        }

        // Check if the current user owns this car
        if (data.userId !== user?.id) {
          setPermissionDenied(true);
          return;
        }

        setCar(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch car");
      } finally {
        setLoading(false);
      }
    };

    if (id && user) {
      fetchCar();
    }
  }, [id, user]);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  if (loading) return <LoadingComponent />;
  if (permissionDenied)
    return (
      <PermissionDeniedScreen message="You do not have permission to edit this car." />
    );
  if (error) return <ErrorScreen message={error} />;
  if (!car) return <NotFoundScreen />;

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ManageCar isEditMode={true} initialData={car} />
    </div>
  );
}
