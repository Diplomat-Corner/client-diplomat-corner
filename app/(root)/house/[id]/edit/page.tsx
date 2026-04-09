"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import ManageHouse from "@/components/manage-house";
import { useUser } from "@clerk/nextjs";
import { IHouse } from "@/lib/models/house.model";
import {
  ErrorScreen,
  LoadingScreen,
  NotFoundScreen,
  PermissionDeniedScreen,
} from "@/components/error";
import LoadingComponent from "@/components/ui/loading-component";
import { useRouter } from "next/navigation";

export default function EditHousePage() {
  const { id } = useParams();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const {
    data: raw,
    isPending: loading,
    error: queryError,
    isError,
  } = useQuery({
    queryKey: queryKeys.houseById(String(id), { includeSeller: false }),
    queryFn: async () => {
      const response = await fetch(`/api/house/${id}`);
      const data = (await response.json()) as { success?: boolean; error?: string } & IHouse;
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch house");
      }
      return data;
    },
    enabled: !!id && !!user,
  });

  const permissionDenied = Boolean(
    raw && user && raw.userId && raw.userId !== user.id
  );

  const house = useMemo(() => {
    if (!raw || !user) return null;
    if (raw.userId !== user.id) return null;
    const { success: _s, error: _e, ...rest } = raw as {
      success?: boolean;
      error?: string;
    } & IHouse;
    return rest as IHouse;
  }, [raw, user]);

  const error = isError ? (queryError as Error).message : null;

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (loading) return <LoadingComponent />;
  if (permissionDenied)
    return (
      <PermissionDeniedScreen message="You do not have permission to edit this house." />
    );
  if (error) return <ErrorScreen message={error} />;
  if (!house) return <NotFoundScreen />;

  return (
    <div className="container mx-auto px-2 py-8">
      <ManageHouse isEditMode={true} initialData={house} />
    </div>
  );
}
