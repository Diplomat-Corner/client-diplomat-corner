import React, { useEffect, useState, memo } from "react";
import { Bath, Bed, Car, Ruler, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { IHouse } from "@/lib/models/house.model";
import Avatar from "../ui/avatar";

interface CardProps extends IHouse {
  listedBy?: string;
}

interface UserInfo {
  name: string;
  imageUrl: string;
  role: "admin" | "customer";
}

const CardHouse: React.FC<CardProps> = ({
  _id,
  name,
  price,
  bedroom,
  bathroom,
  size,
  parkingSpace,
  currency,
  imageUrl,
  advertisementType,
  userId,
}) => {
  const { user } = useUser();
  const isOwner = user?.id === userId;
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: "Anonymous",
    imageUrl: "",
    role: "customer",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      // If it's an admin user, set admin info immediately
      if (userId === "admin") {
        setUserInfo({
          name: "Administrator",
          imageUrl: "",
          role: "admin",
        });
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/${userId}`, {
          headers: {
            "Cache-Control": "no-store",
          },
        });

        // Handle different response statuses
        if (response.status === 401) {
          setUserInfo({
            name: "Administrator",
            imageUrl: "",
            role: "customer",
          });
          return;
        }

        if (response.status === 404) {
          setUserInfo({
            name: "Administrator",
            imageUrl: "",
            role: "customer",
          });
          return;
        }

        if (!response.ok) {
          setUserInfo({
            name: "Administrator",
            imageUrl: "",
            role: "customer",
          });
          return;
        }

        const data = await response.json();
        if (data.success && data.user) {
          const userData = data.user;
          // If the user is an admin, prioritize showing admin status
          if (userData.role === "admin") {
            setUserInfo({
              name: "Administrator",
              imageUrl: userData.imageUrl || "",
              role: "admin",
            });
          } else {
            setUserInfo({
              name:
                userData.firstName +
                (userData.lastName ? ` ${userData.lastName}` : ""),
              imageUrl: userData.imageUrl || "",
              role: "customer",
            });
          }
        } else {
          // Only show Anonymous for non-admin users
          setUserInfo({
            name: "Administrator",
            imageUrl: "",
            role: "customer",
          });
        }
      } catch (error) {
        setUserInfo({
          name: "Administrator",
          imageUrl: "",
          role: "customer",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, [userId]);

  return (
    <div className="relative z-0">
      <Link href={`/house/${_id}`} className="block">
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="relative">
            <Image
              width={300}
              height={200}
              src={imageUrl || "/assets/images/house.jpg"}
              alt="House Image"
              className="w-full h-48 object-cover"
            />
            <span className="absolute top-2 right-2 bg-primary text-white text-xs font-semibold px-2 py-1 rounded-full">
              {advertisementType}
            </span>
          </div>
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-800 truncate">
              {name}
            </h2>
            <p className="text-green-600 text-xl font-bold mt-1">
              {currency} {price.toLocaleString()}
            </p>
            <div className="flex flex-wrap justify-between text-gray-600 mt-2 gap-2">
              <div className="flex items-center gap-1">
                <Bed size={16} />
                <span>{bedroom} Beds</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath size={16} />
                <span>{bathroom} Baths</span>
              </div>
              <div className="flex items-center gap-1">
                <Ruler size={16} />
                <span>{size.toLocaleString()} m²</span>
              </div>
              <div className="flex items-center gap-1">
                <Car size={16} />
                <span>{parkingSpace} Parking</span>
              </div>
            </div>
            {/* Listed by section */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex flex-col gap-1">
                    <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
                    <div className="w-16 h-2 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Avatar
                    imageUrl={userInfo.imageUrl}
                    name={userInfo.name}
                    role={userInfo.role}
                    size="sm"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {userInfo.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {userInfo.role === "admin" ? (
                        <span className="text-primary font-medium">
                          Administrator
                        </span>
                      ) : (
                        "Listed by"
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
      {isOwner && (
        <Link
          href={`/house/${_id}/edit`}
          className="absolute top-2 left-2 bg-white text-primary p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200"
          title="Edit property"
        >
          <Pencil size={16} />
        </Link>
      )}
    </div>
  );
};

export default memo(CardHouse);
