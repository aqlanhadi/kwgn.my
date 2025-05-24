import React from "react";

interface ProcessingBannerProps {
  message?: string;
}

export const ProcessingBanner: React.FC<ProcessingBannerProps> = ({ message = "Processing files..." }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <div className="flex items-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
      <span className="text-blue-800">{message}</span>
    </div>
  </div>
); 