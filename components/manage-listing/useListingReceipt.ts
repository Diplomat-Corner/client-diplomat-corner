"use client";

import { useCallback, useRef, useState } from "react";

export function useListingReceipt() {
  const [selectedReceipt, setSelectedReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const handleReceiptChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setSelectedReceipt(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  const clearReceipt = useCallback(() => {
    setSelectedReceipt(null);
    setReceiptPreview(null);
    if (receiptInputRef.current) {
      receiptInputRef.current.value = "";
    }
  }, []);

  return {
    selectedReceipt,
    setSelectedReceipt,
    receiptPreview,
    setReceiptPreview,
    receiptInputRef,
    handleReceiptChange,
    clearReceipt,
  };
}
