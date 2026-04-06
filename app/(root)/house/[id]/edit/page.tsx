"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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

interface EditHousePageProps {
  params: {
    id: string;
  };
}

export default function EditHousePage({ params }: EditHousePageProps) {
  const { id } = useParams();
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [house, setHouse] = useState<IHouse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    const fetchHouse = async () => {
      try {
        const response = await fetch(`/api/house/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch house");
        }

        // Check if the current user owns this house
        if (data.userId !== user?.id) {
          setPermissionDenied(true);
          return;
        }

        setHouse(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch house");
      } finally {
        setLoading(false);
      }
    };

    if (id && user) {
      fetchHouse();
    }
  }, [id, user]);

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
