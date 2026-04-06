import type { ListingImageData } from "./image-types";

export function appendCommonUploadFields(
  apiFormData: FormData,
  images: ListingImageData[],
  removedImageUrls: string[],
  selectedReceipt: File | null
): void {
  images.forEach((image) => {
    if (image.file) {
      apiFormData.append("files", image.file);
    }
  });

  const existingImages = images
    .filter((img) => !img.isNew && img.preview)
    .map((img) => img.preview);

  if (existingImages.length > 0) {
    apiFormData.append("existingImageUrls", JSON.stringify(existingImages));
  }

  if (removedImageUrls.length > 0) {
    apiFormData.append(
      "removedImageUrls",
      JSON.stringify(removedImageUrls)
    );
  }

  if (selectedReceipt) {
    apiFormData.append("receipt", selectedReceipt);
  }
}
