"use client";

import { TransactionTable } from "@/components/TransactionTable";
import { TransactionWithAccount } from "@/app/transactions/page";

interface TransactionsTabProps {
  transactions: TransactionWithAccount[];
}

export function TransactionsTab({ transactions }: TransactionsTabProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No transactions yet. Upload and process some files to see transactions.
      </div>
    );
  }

  return <TransactionTable transactions={transactions} />;
} 