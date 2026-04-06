export interface ListingImageData {
  file: File | null;
  preview: string | null;
  isNew: boolean;
  id?: string;
}

export interface InitialImageSource {
  imageUrls?: string[];
  imageUrl?: string;
}
