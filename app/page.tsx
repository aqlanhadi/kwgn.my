"use client";

import { useCallback, useMemo, useState } from "react";
import { processFiles, type ProcessFilesResult } from "@/app/actions";
import { FileDropzone } from "@/components/FileDropzone";
import { type CsvRow, toCsvRows, createCsvBlobUrl } from "@/lib/csv";
import { AnimatePresence, motion } from "motion/react";

// CsvRow moved to lib/csv

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasStartedUpload, setHasStartedUpload] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [dropzoneHidden, setDropzoneHidden] = useState(false);
  // Simple upload flow (no chat UI)

  const totalCount = rows.length;

  const handleFilesDropped = useCallback(async (files: File[]) => {
    setError(null);
    setRows([]);
    setHasStartedUpload(true);
    setIsProcessing(true);
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      const result = (await processFiles(formData)) as ProcessFilesResult;
      if (!result || ("success" in result && !result.success)) {
        throw new Error((result as any)?.error || "Failed to process files");
      }

      setRows(toCsvRows((result as any).transactions));
    } catch (e: any) {
      setError(e?.message || "Unexpected error");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // no composer handlers needed

  const csvBlobUrl = useMemo(() => createCsvBlobUrl(rows), [rows]);

  return (
    <div className="min-h-screen bg-stone-300 flex flex-col p-4">
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="text-2xl font-bold text-yellow-800"
      >
        $ kwgn.my
      </motion.p>

      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          layout="position"
          layoutId="container"
          className="border flex-1 max-w-2xl mx-auto flex flex-col rounded-xl bg-stone-200 shadow-xs p-1"
        >
          <AnimatePresence mode="wait" initial={false}>
            {!dropzoneHidden && !isProcessing && !hasStartedUpload ? (
              <motion.div
                key="helper-container"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                  opacity: { duration: 0.2 },
                }}
                style={{ overflow: "hidden" }}
              >
                <div className="text-xs font-semibold text-stone-600 px-1 mb-1">
                  Drop your financial statements here, and we'll turn them into
                  CSV. <span className="underline">See supported banks.</span>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <FileDropzone
            onFilesDropped={handleFilesDropped}
            accept="application/pdf"
            onHidden={() => setDropzoneHidden(true)}
          />

          <div className="flex justify-center text-center">
            <AnimatePresence mode="wait" initial={false}>
              {!isProcessing && error && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="text-red-600 p-3"
                >
                  {error}
                </motion.p>
              )}
              {!isProcessing && !error && totalCount > 0 && dropzoneHidden && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  layout="position"
                  layoutId="results"
                  className="flex flex-col items-center p-5"
                >
                  <p className="text-slate-700 font-medium">
                    {totalCount} transactions extracted 🎉
                  </p>
                  {csvBlobUrl && (
                    <div className="flex items-center gap-2 mt-2">
                      <motion.a
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        href={csvBlobUrl}
                        download="transactions.csv"
                        className="inline-block rounded-lg bg-slate-900 text-white px-6 py-1.5 shadow-sm hover:shadow-md hover:bg-slate-800"
                      >
                        Download CSV
                      </motion.a>
                      <motion.a
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        href="/"
                        className="inline-block rounded-lg bg-slate-900 text-white px-6 py-1.5 shadow-sm hover:shadow-md hover:bg-slate-800"
                      >
                        Extract more
                      </motion.a>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
