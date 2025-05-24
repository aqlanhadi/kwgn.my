"use client";

import { useEffect, useState, useMemo, useReducer } from "react";
import { useRouter } from "next/navigation";
import { processFiles, ProcessFilesResult } from "@/app/actions";
import { cn } from "@/lib/utils";
import { TransactionsTab } from "@/components/tabs/TransactionsTab";
import { FilesTab } from "@/components/tabs/FilesTab";
import { OutputTab } from "@/components/tabs/OutputTab";
import { Summary } from "@/components/tabs/Summary";
import { KwgnAccount, KwgnExtractResult, KwgnTransactions, FileData, ProcessedFile, FileWithSummary } from "@/lib/kwgn";
import { hashFile, fileToBase64, formatFileSize, formatCurrency } from "@/lib/utils/file";
import { useSessionFiles } from "@/lib/hooks/useSessionFiles";

type TabType = 'summary' | 'transactions' | 'files' | 'output';

type FileProcessingState = {
  files: ProcessedFile[];
  transactions: KwgnTransactions[];
  allOutput: string;
  allHashes: string[];
};

type FileProcessingAction =
  | { type: "SET_FILES"; files: ProcessedFile[] }
  | { type: "UPDATE_FILES"; updatedFiles: ProcessedFile[] }
  | { type: "APPEND_TRANSACTIONS"; transactions: KwgnTransactions[] }
  | { type: "APPEND_OUTPUT"; output: string }
  | { type: "APPEND_HASHES"; hashes: string[] };

function fileProcessingReducer(state: FileProcessingState, action: FileProcessingAction): FileProcessingState {
  switch (action.type) {
    case "SET_FILES":
      return { ...state, files: action.files };
    case "UPDATE_FILES":
      // Remove files with same ids, then add updated
      const existing = state.files.filter(f => !action.updatedFiles.some(uf => uf.id === f.id));
      return { ...state, files: [...existing, ...action.updatedFiles] };
    case "APPEND_TRANSACTIONS":
      return { ...state, transactions: [...state.transactions, ...action.transactions] };
    case "APPEND_OUTPUT":
      return { ...state, allOutput: state.allOutput ? `${state.allOutput}\n\n${action.output}` : action.output };
    case "APPEND_HASHES":
      return { ...state, allHashes: [...state.allHashes, ...action.hashes] };
    default:
      return state;
  }
}

export default function TransactionsPage() {
  const { files: initialFiles, setFiles: setSessionFiles, isLoading, hasInitialized } = useSessionFiles();
  const [isProcessing, setIsProcessing] = useState(false);
  const [accounts, setAccounts] = useState<KwgnAccount[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const router = useRouter();

  const [state, dispatch] = useReducer(fileProcessingReducer, {
    files: initialFiles,
    transactions: [],
    allOutput: "",
    allHashes: [],
  });

  // Keep session files and reducer files in sync
  useEffect(() => {
    if (initialFiles.length > 0) {
      dispatch({ type: "SET_FILES", files: initialFiles });
    }
  }, [initialFiles]);

  // Parse files with summary data
  const filesWithSummary = useMemo(() => {
    return state.files.map((file): FileWithSummary => {
      if (!file.output || file.error) {
        return file;
      }

      try {
        // Extract JSON content from the output
        const jsonMatch = file.output.match(/KWGN Extract Output:\s*(\{[\s\S]*?\})\s*(?:---|\s*$)/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[1].trim();
          const extractResult = JSON.parse(jsonStr) as KwgnExtractResult;
          return { ...file, extractResult };
        }
      } catch (error) {
        console.error("Error parsing file output:", error);
      }

      return file;
    });
  }, [state.files]);

  // Helper to handle file processing errors
  function handleFileProcessingError(filesToProcess: ProcessedFile[], errorMsg: string) {
    const updatedFiles = filesToProcess.map(file => ({
      ...file,
      processed: true,
      error: errorMsg,
    }));
    dispatch({ type: "UPDATE_FILES", updatedFiles });
  }

  const handleProcessFiles = async (filesToProcess: ProcessedFile[]) => {
    setIsProcessing(true);
    
    try {
      // Convert files back to File objects for processing
      const fileObjects = await Promise.all(
        filesToProcess.map(async (fileData) => {
          // Convert base64 back to blob
          const response = await fetch(fileData.content);
          const blob = await response.blob();
          return new File([blob], fileData.name, { type: fileData.type });
        })
      );

      const formData = new FormData();
      fileObjects.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      const result = await processFiles(formData);

      console.log(result);
      
      if (result.success) {
        // Update files with processing results
        const updatedFiles = filesToProcess.map((file, index) => ({
          ...file,
          processed: true,
          output: result.fileResults?.[index]?.output || "Processed successfully",
          extractTypeUsed: result.fileResults?.[index]?.extractTypeUsed ?? null,
        }));
        
        dispatch({ type: "UPDATE_FILES", updatedFiles });

        // Append to all output
        if (result.fileResults) {
          const newOutput = result.fileResults.map(r => r.output).join("\n\n");
          dispatch({ type: "APPEND_OUTPUT", output: newOutput });
        }

        dispatch({ type: "APPEND_TRANSACTIONS", transactions: result.transactions || [] });
        dispatch({ type: "APPEND_HASHES", hashes: result.hashes || [] });
      } else {
        // Handle error case
        handleFileProcessingError(filesToProcess, result.error || "Processing failed");
      }
    } catch (error) {
      console.error("Error processing files:", error);
      handleFileProcessingError(filesToProcess, "Processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddMoreFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);

    const hashes = await Promise.all(newFiles.map(hashFile));
    // prevent process if hashes are already in the hashes state
    if (hashes.some(hash => state.allHashes.includes(hash))) {
      console.log("Files with the same hashes already exist. Please remove the files with the same hashes.");
      alert("Files with the same hashes already exist. Please remove the files with the same hashes.");
      return;
    }

    if (newFiles.length > 0) {
      const fileData = await Promise.all(
        newFiles.map(async (file, index) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          content: await fileToBase64(file),
          id: `file_${Date.now()}_${state.files.length + index}`,
          processed: false,
        }))
      );

      // Process new files
      await handleProcessFiles(fileData);
    }
  };

  // Show loading state while initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your files...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'summary' as TabType, label: 'Summary', count: null },
    { id: 'transactions' as TabType, label: 'Transactions', count: filesWithSummary.reduce((sum, file) => sum + (file.extractResult?.transactions.length || 0), 0) },
    { id: 'files' as TabType, label: 'Files', count: filesWithSummary.length },
    { id: 'output' as TabType, label: 'Raw Output', count: null },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center bg-white py-8 px-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600 mt-1">Manage and process your files</p>
          </div>
          <div className="flex gap-4">
            <label
              htmlFor="add-files"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
            >
              Add More File
            </label>
            <input
              id="add-files"
              type="file"
              onChange={handleAddMoreFiles}
              className="hidden"
            />
            <button
              onClick={() => router.push("/")}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>

        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-800">Processing files...</span>
            </div>
          </div>
        )}

        {/* Tab Navigation - Full Width */}
        <div className="border-b border-gray-200 bg-white mb-6">
          <nav className="-mb-px flex space-x-8 max-w-7xl mx-auto px-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className={cn(
                    "ml-2 py-0.5 px-2 rounded-full text-xs",
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-900"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="px-6">
          {activeTab === 'summary' && (
            <Summary filesWithSummary={filesWithSummary} />
          )}
          {activeTab === 'transactions' && (
            <TransactionsTab allOutput={state.allOutput} />
          )}

          {activeTab === 'files' && (
            <FilesTab 
              filesWithSummary={filesWithSummary}
              formatFileSize={formatFileSize}
              formatCurrency={formatCurrency}
            />
          )}

          {activeTab === 'output' && (
            <OutputTab 
              allOutput={state.allOutput} 
              accounts={accounts} 
              transactions={state.transactions} 
              allHashes={state.allHashes}
            />
          )}
        </div>
      </div>
    </div>
  );
} 