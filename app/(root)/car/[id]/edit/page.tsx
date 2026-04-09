"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
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

  const {
    data: raw,
    isPending: loading,
    error: queryError,
    isError,
  } = useQuery({
    queryKey: queryKeys.carById(String(id), { includeSeller: false }),
    queryFn: async () => {
      const response = await fetch(`/api/cars/${id}`);
      const data = (await response.json()) as { success?: boolean; error?: string } & ICar;
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch car");
      }
      return data;
    },
    enabled: !!id && !!user,
  });

  const permissionDenied = Boolean(
    raw && user && raw.userId && raw.userId !== user.id
  );

  const car = useMemo(() => {
    if (!raw || !user) return null;
    if (raw.userId !== user.id) return null;
    const { success: _s, error: _e, ...rest } = raw as {
      success?: boolean;
      error?: string;
    } & ICar;
    return rest as ICar;
  }, [raw, user]);

  const error = isError ? (queryError as Error).message : null;

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
