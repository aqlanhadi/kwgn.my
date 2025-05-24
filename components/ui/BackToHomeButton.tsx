import React from "react";
import { useRouter } from "next/navigation";

interface BackToHomeButtonProps {
  className?: string;
}

export const BackToHomeButton: React.FC<BackToHomeButtonProps> = ({ className }) => {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/")}
      className={`bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors ${className || ""}`}
    >
      Back to Home
    </button>
  );
}; 