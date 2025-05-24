"use client";

import { cn } from "@/lib/utils";
import { kwgnExtractResult } from "@/lib/kwgn";

interface ProcessedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  content: string;
  processed: boolean;
  output?: string;
  error?: string;
}

interface FileWithSummary extends ProcessedFile {
  extractResult?: kwgnExtractResult;
}

interface FilesTabProps {
  filesWithSummary: FileWithSummary[];
  formatFileSize: (bytes: number) => string;
  formatCurrency: (amount: string) => string;
}

export function FilesTab({ filesWithSummary, formatFileSize, formatCurrency }: FilesTabProps) {
  if (filesWithSummary.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No files uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filesWithSummary.map((file) => (
        <div key={file.id} className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-lg font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)} • {file.type || "Unknown type"}
              </p>
            </div>
            <div className="ml-4">
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                  file.processed
                    ? file.error
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                )}
              >
                {file.processed
                  ? file.error
                    ? "Error"
                    : "Processed"
                  : "Processing..."}
              </span>
            </div>
          </div>
          
          {/* Display transaction summary if available */}
          {file.extractResult && (
            <div className="bg-white rounded-lg p-4 border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {file.extractResult.account.account_name}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account:</span>
                      <span className="font-mono text-gray-900">
                        {file.extractResult.account.account_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transactions:</span>
                      <span className="text-gray-900">
                        {file.extractResult.transactions.length}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Credit:</span>
                    <span className="text-green-600 font-semibold">
                      {formatCurrency(file.extractResult.total_credit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Debit:</span>
                    <span className="text-red-600 font-semibold">
                      {formatCurrency(file.extractResult.total_debit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Net:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(file.extractResult.nett)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {file.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{file.error}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 