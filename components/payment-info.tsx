"use client";

import { Banknote, Copy, CheckCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

type PaymentInfoState = {
  title: string;
  description: string;
  feeDisplay: string;
  descriptionSuffix: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
};

const fallback: PaymentInfoState = {
  title: "Payment Information",
  description: "Please deposit the ad's fee",
  feeDisplay: "3000 ETB",
  descriptionSuffix: " through our account below:",
  bankName: "Commercial Bank of Ethiopia",
  accountNumber: "1000388072966",
  accountHolderName: "Mekenet Advertising",
};

const PaymentInfo = () => {
  const [copied, setCopied] = useState(false);
  const [info, setInfo] = useState<PaymentInfoState>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/payment-info", { cache: "no-store" });
        if (!res.ok) {
          if (ok) setInfo(fallback);
          return;
        }
        const data = await res.json();
        const p = data?.paymentInfo;
        if (p && typeof p === "object" && ok) {
          setInfo({
            title: p.title || fallback.title,
            description: p.description || fallback.description,
            feeDisplay: p.feeDisplay || fallback.feeDisplay,
            descriptionSuffix: p.descriptionSuffix || fallback.descriptionSuffix,
            bankName: p.bankName || fallback.bankName,
            accountNumber: p.accountNumber || fallback.accountNumber,
            accountHolderName: p.accountHolderName || fallback.accountHolderName,
          });
        }
      } catch {
        if (ok) setInfo(fallback);
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, []);

  const handleCopy = () => {
    void navigator.clipboard.writeText(info.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20 flex items-center justify-center min-h-[160px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label="Loading payment information" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Banknote className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-2">{info.title}</h3>
          <p className="text-sm text-gray-600 mb-3">
            {info.description}
            {info.feeDisplay ? (
              <span className="text-primary"> ({info.feeDisplay})</span>
            ) : null}
            {info.descriptionSuffix}
          </p>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Payment Method</p>
                <p className="text-sm font-medium">{info.bankName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Account Number</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{info.accountNumber}</p>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                    title="Copy account number"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Account Holder Name</p>
                <p className="text-sm font-medium">{info.accountHolderName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentInfo;
