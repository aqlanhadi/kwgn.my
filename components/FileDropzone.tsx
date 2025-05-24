"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function FileDropzone() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setIsUploading(true);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Store files in sessionStorage to pass to transactions page
      const fileData = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          content: await fileToBase64(file),
        }))
      );
      
      sessionStorage.setItem("uploadedFiles", JSON.stringify(fileData));
      router.push("/transactions");
    }
    
    setIsUploading(false);
  }, [router]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setIsUploading(true);
      
      const fileData = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          content: await fileToBase64(file),
        }))
      );
      
      sessionStorage.setItem("uploadedFiles", JSON.stringify(fileData));
      router.push("/transactions");
      setIsUploading(false);
    }
  }, [router]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 cursor-pointer",
        isDragOver
          ? "border-blue-500 bg-blue-50"
          : "border-slate-300 hover:border-slate-400 hover:bg-slate-50",
        isUploading && "opacity-50 pointer-events-none"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        id="file-input"
      />
      
      <label htmlFor="file-input" className="cursor-pointer">
        <div className="mx-auto w-16 h-16 text-slate-400 mb-4">
          <svg
            className="w-full h-full"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        
        {isUploading ? (
          <div className="text-blue-600">
            <p className="text-lg font-medium">Uploading files...</p>
            <p className="text-sm text-slate-500">Please wait</p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-medium text-slate-700 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-slate-500">
              Supports all file types
            </p>
          </div>
        )}
      </label>
    </div>
  );
} 