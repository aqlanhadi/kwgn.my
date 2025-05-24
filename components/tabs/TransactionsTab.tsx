"use client";

import { TransactionTable } from "@/components/TransactionTable";

interface TransactionsTabProps {
  allOutput: string;
}

export function TransactionsTab({ allOutput }: TransactionsTabProps) {
  if (!allOutput) {
    return (
      <div className="text-center text-gray-500 py-8">
        No transactions yet. Upload and process some files to see transactions.
      </div>
    );
  }

  return <TransactionTable output={allOutput} />;
} 