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
import {
  SESSION_STORAGE_UPLOADED_FILES,
  FILE_ID_PREFIX,
  ERROR_PROCESSING_FAILED,
  ERROR_DUPLICATE_HASH,
  LOCALE_MY,
  CURRENCY_MY,
  TAB_SUMMARY,
  TAB_TRANSACTIONS,
  TAB_FILES,
  TAB_OUTPUT
} from "@/lib/constants";
import { FileUploadButton } from "@/components/ui/FileUploadButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProcessingBanner } from "@/components/ui/ProcessingBanner";
import { BackToHomeButton } from "@/components/ui/BackToHomeButton";
import { TabNavigation } from "@/components/ui/TabNavigation";

type TabType = 'summary' | 'transactions' | 'files' | 'output';

export type TransactionWithAccount = {
  transaction: KwgnTransactions;
  account: KwgnAccount;
  source?: string;
};

type FileProcessingState = {
  files: FileWithSummary[];
  transactions: TransactionWithAccount[];
  allOutput: string;
  allHashes: string[];
};

type FileProcessingAction =
  | { type: "SET_FILES"; files: FileWithSummary[] }
  | { type: "UPDATE_FILES"; updatedFiles: FileWithSummary[] }
  | { type: "APPEND_TRANSACTIONS"; transactions: TransactionWithAccount[] }
  | { type: "APPEND_OUTPUT"; output: string }
  | { type: "APPEND_HASHES"; hashes: string[] };

function fileProcessingReducer(state: FileProcessingState, action: FileProcessingAction): FileProcessingState {
  switch (action.type) {
    case "SET_FILES":
      return { ...state, files: action.files };
    case "UPDATE_FILES":
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

  // Automatically process any unprocessed files loaded from session
  useEffect(() => {
    // Only run after session files are loaded and not currently processing
    if (!isLoading && hasInitialized && state.files.length > 0 && !isProcessing) {
      const unprocessedFiles = state.files.filter(f => !f.processed && !f.error);
      if (unprocessedFiles.length > 0) {
        handleProcessFiles(unprocessedFiles);
      }
    }
    // We intentionally do not include handleProcessFiles in deps to avoid infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, hasInitialized, state.files, isProcessing]);

  // Parse files with summary data
  const filesWithSummary = useMemo(() => state.files, [state.files]);

  // Helper to handle file processing errors
  function handleFileProcessingError(filesToProcess: FileWithSummary[], errorMsg: string) {
    const updatedFiles = filesToProcess.map(file => ({
      ...file,
      processed: true,
      error: errorMsg,
    }));
    dispatch({ type: "UPDATE_FILES", updatedFiles });
  }

  const handleProcessFiles = async (filesToProcess: FileWithSummary[]) => {
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
          extractResult: result.extractedResults?.[index] ?? undefined,
          error: result.fileResults?.[index]?.error, // Attach error if present
        })) as FileWithSummary[];
        
        dispatch({ type: "UPDATE_FILES", updatedFiles });

        // Append to all output
        if (result.fileResults) {
          const newOutput = result.fileResults.map(r => r.output).join("\n\n");
          dispatch({ type: "APPEND_OUTPUT", output: newOutput });
        }

        // Build transactions with account info
        let transactionsWithAccount: TransactionWithAccount[] = [];
        if (result.extractedResults) {
          result.extractedResults.forEach((extractResult) => {
            if (extractResult && extractResult.transactions) {
              extractResult.transactions.forEach((transaction) => {
                transactionsWithAccount.push({ transaction, account: extractResult.account, source: (transaction as any).source });
              });
            }
          });
        }
        dispatch({ type: "APPEND_TRANSACTIONS", transactions: transactionsWithAccount });
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
            <FileUploadButton onFilesSelected={handleAddMoreFiles} />
            <BackToHomeButton />
          </div>
        </div>

        {isProcessing && (
          <ProcessingBanner />
        )}

        <TabNavigation tabs={tabs} activeTab={activeTab} setActiveTab={(tabId: string) => setActiveTab(tabId as TabType)} />

        {/* Tab Content */}
        <div className="px-6">
          {activeTab === 'summary' && (
            <Summary transactions={state.transactions} />
          )}
          {activeTab === 'transactions' && (
            <TransactionsTab transactions={state.transactions} />
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
              transactions={state.transactions.map(t => t.transaction)} 
              allHashes={state.allHashes}
            />
          )}
        </div>
      </div>
    </div>
  );
} 