"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { processFiles } from "@/app/actions";
import { cn } from "@/lib/utils";
import { TransactionsTab } from "@/components/tabs/TransactionsTab";
import { FilesTab } from "@/components/tabs/FilesTab";
import { OutputTab } from "@/components/tabs/OutputTab";
import { Summary } from "@/components/tabs/Summary";
import { KwgnAccount, KwgnExtractResult, KwgnTransactions } from "@/lib/kwgn";

interface FileData {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  content: string;
}

interface ProcessedFile extends FileData {
  id: string;
  processed: boolean;
  output?: string;
  error?: string;
  extractTypeUsed?: string | null;
}

interface FileWithSummary extends ProcessedFile {
  extractResult?: KwgnExtractResult;
}

type TabType = 'summary' | 'transactions' | 'files' | 'output';

export default function TransactionsPage() {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [accounts, setAccounts] = useState<KwgnAccount[]>([]);
  const [transactions, setTransactions] = useState<KwgnTransactions[]>([]);
  const [allOutput, setAllOutput] = useState<string>("");
  const [allHashes, setAllHashes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const router = useRouter();

  // Parse files with summary data
  const filesWithSummary = useMemo(() => {
    return files.map((file): FileWithSummary => {
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
  }, [files]);

  useEffect(() => {
    // Only run once when component mounts
    if (hasInitialized) return;
    
    // Wait for client-side hydration
    const timer = setTimeout(() => {
      try {
        const storedFiles = sessionStorage.getItem("uploadedFiles");
        if (storedFiles) {
          const fileData: FileData[] = JSON.parse(storedFiles);
          const processedFiles: ProcessedFile[] = fileData.map((file, index) => ({
            ...file,
            id: `file_${Date.now()}_${index}`,
            processed: false,
          }));
          setFiles(processedFiles);
          
          // Remove from sessionStorage only after successfully loading
          sessionStorage.removeItem("uploadedFiles");
          
          // Auto-process files on page load
          handleProcessFiles(processedFiles);
        } else {
          // If no files in storage, redirect to home
          router.push("/");
        }
      } catch (error) {
        console.error("Error loading files from sessionStorage:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
        setHasInitialized(true);
      }
    }, 100); // Small delay to ensure client-side hydration

    return () => clearTimeout(timer);
  }, [router, hasInitialized]);

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
          output: result.outputs?.[index] || "Processed successfully",
          extractTypeUsed: result.fileResults?.[index]?.extractTypeUsed ?? null,
        }));
        
        setFiles(prev => {
          const existing = prev.filter(f => !filesToProcess.some(tf => tf.id === f.id));
          return [...existing, ...updatedFiles];
        });

        // Append to all output
        if (result.outputs) {
          const newOutput = result.outputs.join("\n\n");
          setAllOutput(prev => prev ? `${prev}\n\n${newOutput}` : newOutput);
        }

        setAccounts(prev => [...prev, ...(result.accounts || [])]);
        setTransactions(prev => [...prev, ...(result.transactions || [])]);
        setAllHashes(prev => [...prev, ...(result.hashes || [])]);
      } else {
        // Handle error case
        const updatedFiles = filesToProcess.map(file => ({
          ...file,
          processed: true,
          error: result.error || "Processing failed",
        }));
        
        setFiles(prev => {
          const existing = prev.filter(f => !filesToProcess.some(tf => tf.id === f.id));
          return [...existing, ...updatedFiles];
        });
      }
    } catch (error) {
      console.error("Error processing files:", error);
      const updatedFiles = filesToProcess.map(file => ({
        ...file,
        processed: true,
        error: "Processing failed",
      }));
      
      setFiles(prev => {
        const existing = prev.filter(f => !filesToProcess.some(tf => tf.id === f.id));
        return [...existing, ...updatedFiles];
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddMoreFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length > 0) {
      const fileData = await Promise.all(
        newFiles.map(async (file, index) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          content: await fileToBase64(file),
          id: `file_${Date.now()}_${files.length + index}`,
          processed: false,
        }))
      );

      // Process new files
      await handleProcessFiles(fileData);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount.replace(/[^\d.-]/g, ""));
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: "MYR",
    }).format(num);
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
              Add More Files
            </label>
            <input
              id="add-files"
              type="file"
              multiple
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
            <TransactionsTab allOutput={allOutput} />
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
              allOutput={allOutput} 
              accounts={accounts} 
              transactions={transactions} 
              allHashes={allHashes}
            />
          )}
        </div>
      </div>
    </div>
  );
} 