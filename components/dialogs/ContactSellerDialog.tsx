'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useUser } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PhoneNumberPopup } from "@/components/PhoneNumberPopup";

export interface ContactSellerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productType: string;
  sellerName: string;
  sellerEmail?: string;
  sellerPhone?: string;
  carId: string;
  sellerId: string;
}

export function ContactSellerDialog({
  isOpen,
  onClose,
  productType,
  sellerName,
  sellerEmail,
  sellerPhone,
  carId,
  sellerId,
}: ContactSellerDialogProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [openPhonePopup, setOpenPhonePopup] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: `Hello, I'm interested in renting this ${productType}. Please provide more details.`,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const listingLink =
        typeof window !== "undefined"
          ? `${window.location.origin}/car/${carId}`
          : `/car/${carId}`;
      const response = await fetch('/api/messages/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          topicType: "car-inquiry",
          topicId: carId,
          subject: `Car Inquiry: ${productType}`,
          meta: {
            listingId: carId,
            listingLink,
            listerName: sellerName,
            listerEmail: sellerEmail || "unknown@diplomatcorner.net",
            listerPhone: sellerPhone || "Not provided",
            inquirerName: `${formData.firstName} ${formData.lastName}`.trim(),
            inquirerEmail: formData.email,
            inquirerPhone: formData.phone,
            sellerId,
            productType,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your inquiry has been sent successfully!",
        variant: "default",
      });
      onClose();
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.unsafeMetadata?.phoneNumber && !formData.phone) {
      setOpenPhonePopup(true);
      return;
    }
    sendMessageMutation.mutate();
  };

  const isLoading = sendMessageMutation.isPending;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contact Seller</DialogTitle>
          <DialogDescription>
            Send a message to {sellerName} about this {productType} rental.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <Input
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
        </DialogContent>
      </Dialog>
      <PhoneNumberPopup
        isOpen={openPhonePopup}
        onClose={() => setOpenPhonePopup(false)}
      />
    </>
  );
}
