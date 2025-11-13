import { Banknote, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";

const PaymentInfo = () => {
  const [copied, setCopied] = useState(false);
  const accountNumber = "+251 994945786";

  const handleCopy = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Banknote className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-2">
            Payment Information
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Please deposit the ad&apos;s fee{" "}
            <span className="text-primary">(3000 ETB)</span> through our account
            below:
          </p>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Payment Method</p>
                <p className="text-sm font-medium">TeleBirr</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone Number</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{accountNumber}</p>
                  <button
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
                <p className="text-sm font-medium">Getaneh</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentInfo;
