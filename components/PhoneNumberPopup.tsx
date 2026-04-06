"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Phone, Shield, Info } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface PhoneNumberPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PhoneNumberPopup({ isOpen, onClose }: PhoneNumberPopupProps) {
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        throw new Error("Failed to update phone number");
      }

      toast({
        title: "Success",
        description: "Phone number updated successfully",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update phone number",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-[#5B8F2D]/10 rounded-full flex items-center justify-center mb-4">
            <Phone className="w-10 h-10 text-[#5B8F2D]" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#5B8F2D]">
              Add Your Phone Number
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-500 mt-2 mb-6">
            We need your phone number to enhance your experience and keep you
            updated.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <PhoneInput
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={setPhoneNumber}
              defaultCountry="ET"
              international
              className="!h-12 !w-full !text-lg phone-input" // Optional: tweak appearance
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 pl-1">
              Enter a valid international phone number
            </p>
          </div>

          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
            <Info className="w-5 h-5 text-[#5B8F2D] mt-0.5" />
            <p className="text-sm text-gray-600">
              Your phone number will be used for important updates and
              notifications. We never share your information with third parties.
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full h-12 text-lg bg-[#5B8F2D] hover:bg-[#5B8F2D]/90"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>Save Phone Number</span>
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
