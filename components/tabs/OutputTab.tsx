"use client";

interface OutputTabProps {
  allOutput: string;
}

export function OutputTab({ allOutput }: OutputTabProps) {
  if (!allOutput) {
    return (
      <div className="text-center text-gray-500 py-8">
        No output yet. Upload and process some files to see results.
      </div>
    );
  }

  return (
    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">
      {allOutput}
    </pre>
  );
} 