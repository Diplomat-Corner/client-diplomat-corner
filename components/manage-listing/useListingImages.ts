"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InitialImageSource, ListingImageData } from "./image-types";

export function useListingImages(
  isEditMode: boolean,
  initialData: InitialImageSource | undefined
) {
  const [images, setImages] = useState<ListingImageData[]>([]);
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditMode && initialData) {
      if (initialData.imageUrls && initialData.imageUrls.length > 0) {
        const initialImages = initialData.imageUrls.map((url, index) => ({
          file: null,
          preview: url,
          isNew: false,
          id: `existing-${index}`,
        }));
        setImages(initialImages);
      } else if (initialData.imageUrl) {
        setImages([
          {
            file: null,
            preview: initialData.imageUrl,
            isNew: false,
            id: "existing-main",
          },
        ]);
      }
    }
  }, [isEditMode, initialData]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;

      const newImages: ListingImageData[] = [];
      const filesArray = Array.from(e.target.files);

      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push({
            file,
            preview: reader.result as string,
            isNew: true,
            id: `new-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 9)}`,
          });

          if (newImages.length === filesArray.length) {
            setImages((prev) => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    },
    []
  );

  const handleAddMoreImages = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setImages((prevImages) => {
      const updatedImages = [...prevImages];
      const removedImage = updatedImages[index];

      if (!removedImage.isNew && removedImage.preview) {
        setRemovedImageUrls((prev) => [...prev, removedImage.preview!]);
      }

      updatedImages.splice(index, 1);
      return updatedImages;
    });
  }, []);

  return {
    images,
    setImages,
    removedImageUrls,
    setRemovedImageUrls,
    fileInputRef,
    handleFileChange,
    handleAddMoreImages,
    handleRemoveImage,
  };
}
