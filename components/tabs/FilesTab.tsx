"use client";

import { cn } from "@/lib/utils";
import { KwgnExtractResult } from "@/lib/kwgn";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";

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
  extractTypeUsed?: string;
}

interface FileWithSummary extends ProcessedFile {
  extractResult?: KwgnExtractResult;
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

  // Calculate total credit and debit across all files
  const totalCredit = filesWithSummary.reduce((sum, file) => {
    if (file.extractResult) {
      return sum + parseFloat(file.extractResult.total_credit.replace(/[^\d.-]/g, ""));
    }
    return sum;
  }, 0);
  const totalDebit = filesWithSummary.reduce((sum, file) => {
    if (file.extractResult) {
      return sum + parseFloat(file.extractResult.total_debit.replace(/[^\d.-]/g, ""));
    }
    return sum;
  }, 0);

  return (
    <Table>
      <TableCaption>Uploaded Files Summary</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>File</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Transactions</TableHead>
          <TableHead>Total Credit</TableHead>
          <TableHead>Total Debit</TableHead>
          <TableHead>Net</TableHead>
          <TableHead>Error</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filesWithSummary.map((file) => {
          const status = file.processed
            ? file.error
              ? "Error"
              : "Processed"
            : "Processing...";
          const statusClass = file.processed
            ? file.error
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
            : "bg-yellow-100 text-yellow-800";
          return (
            <TableRow key={file.id}>
              <TableCell>
                <div className="font-medium text-gray-900">{file.name}</div>
                {file.extractTypeUsed && (
                  <div className="text-xs text-blue-600">Extracted as: {file.extractTypeUsed}</div>
                )}
                <div className="text-xs text-gray-500">
                  {formatFileSize(file.size)} • {file.type || "Unknown type"}
                </div>
              </TableCell>
              <TableCell>
                <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", statusClass)}>
                  {status}
                </span>
              </TableCell>
              <TableCell>{file.extractResult?.transactions.length ?? "-"}</TableCell>
              <TableCell className="text-green-600 font-semibold">
                {file.extractResult ? formatCurrency(file.extractResult.total_credit) : "-"}
              </TableCell>
              <TableCell className="text-red-600 font-semibold">
                {file.extractResult ? formatCurrency(file.extractResult.total_debit) : "-"}
              </TableCell>
              <TableCell className="font-semibold">
                {file.extractResult ? formatCurrency(file.extractResult.nett) : "-"}
              </TableCell>
              <TableCell className="text-red-600 text-xs">
                {file.error || ""}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell className="text-right font-semibold" colSpan={3}>Total</TableCell>
          <TableCell className="text-green-700 font-bold">{formatCurrency(totalCredit.toString())}</TableCell>
          <TableCell className="text-red-700 font-bold">{formatCurrency(totalDebit.toString())}</TableCell>
          <TableCell colSpan={2}></TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
} 