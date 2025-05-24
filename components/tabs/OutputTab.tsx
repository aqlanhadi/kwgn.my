"use client";

import { KwgnAccount, KwgnTransactions } from "@/lib/kwgn";

interface OutputTabProps {
  allOutput: string;
  accounts: KwgnAccount[];
  transactions: KwgnTransactions[];
  allHashes: string[];
}

export function OutputTab({ allOutput, accounts, transactions, allHashes }: OutputTabProps) {
  if (!allOutput) {
    return (
      <div className="text-center text-gray-500 py-8">
        No output yet. Upload and process some files to see results.
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* {
        !allOutput ? (
          <div className="text-center text-gray-500 py-8">
            No output yet. Upload and process some files to see results.
          </div>
        ) : (
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">
            {allOutput}
          </pre>
        )
      } */}

      {
        !accounts ? (
          <div className="text-center text-gray-500 py-8">
            No accounts yet. Upload and process some files to see results.
          </div>
        ) : (
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">
            {JSON.stringify(accounts, null, 2)}
          </pre>
        )
      }

      {
        !transactions ? (
          <div className="text-center text-gray-500 py-8">
            No transactions yet. Upload and process some files to see results.
          </div>
        ) : (
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">
            {JSON.stringify(transactions, null, 2)}
          </pre>
        )
      }

      {
        !allHashes ? (
          <div className="text-center text-gray-500 py-8">
            No hashes yet. Upload and process some files to see results.
          </div>
        ) : (
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">
            {JSON.stringify(allHashes, null, 2)}
          </pre>
        )
      }
    </div>
  );
} 