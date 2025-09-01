"use client";

import { useCallback, useMemo, useState } from "react";
import { processFiles, type ProcessFilesResult } from "@/app/actions";
import { FileDropzone } from "@/components/FileDropzone";
import { type CsvRow, toCsvRows, createCsvBlobUrl } from "@/lib/csv";
import { AnimatePresence, motion } from "motion/react";
import { Download, ArrowLeft } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
                  CSV.{" "}
                  <Tooltip>
                    <TooltipTrigger className="underline">
                      See supported bank statements.
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs flex flex-col gap-2">
                        <p>
                          I can't possibly test against all statements, but here
                          are some that I've tested:
                        </p>
                        <ul className="list-disc list-inside">
                          <li>
                            Maybank - Savings, Current and Credit Card
                            Statements
                          </li>
                          <li>
                            TnG - eStatements, downloaded from the web portal
                            (not the email version)
                          </li>
                        </ul>
                        <p>
                          Drop a request if you want support for a new bank
                          statement by creating an issue{" "}
                          <a
                            href="https://github.com/aqlanhadi/kwgn/issues"
                            className="underline hover:text-stone-200"
                          >
                            here
                          </a>
                          .
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <FileDropzone
            onFilesDropped={handleFilesDropped}
            accept="application/pdf"
            onHidden={() => setDropzoneHidden(true)}
          />

          {/* <AnimatePresence mode="wait" initial={false}>
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
                className="overflow-hidden"
              >
                <div className="text-xs font-semibold text-stone-500 px-1 mt-1 text-end">
                  Files are not stored. We just collect anonymized analytics.
                  <br />
                  <span className="underline">See our privacy policy.</span>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence> */}

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
                    <>
                      <div className="flex items-center justify-center gap-2 mt-2 w-full max-w-md mx-auto">
                        <motion.a
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          href={csvBlobUrl}
                          download="transactions.csv"
                          className="plausible-event-name=download inline-flex items-center gap-2 rounded-lg bg-stone-600 text-white px-3 py-1.5 shadow-sm hover:shadow-md hover:bg-stone-700"
                        >
                          <Download className="w-4 h-4" />
                          Download CSV
                        </motion.a>
                        <motion.a
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          href="/"
                          className="inline-flex items-center gap-2 rounded-lg border border-stone-600 text-stone-600 px-3 py-1.5 shadow-sm hover:shadow-md hover:bg-stone-700 hover:text-white"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Extract more
                        </motion.a>
                      </div>

                      {rows.length > 0 && (
                        <motion.div
                          className="mt-6 relative max-w-md w-full self-center"
                          initial={{
                            height: 0,
                            opacity: 0,
                            overflow: "hidden",
                          }}
                          animate={{
                            height: "auto",
                            opacity: 1,
                            overflow: "visible",
                          }}
                          transition={{
                            height: {
                              duration: 0.4,
                              ease: [0.04, 0.62, 0.23, 0.98],
                            },
                            opacity: { duration: 0.3, delay: 0.1 },
                          }}
                        >
                          <div
                            className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-stone-200 pointer-events-none z-10"
                            style={{
                              backgroundSize: "100% 120%",
                              backgroundPosition: "0 -20px",
                            }}
                          />
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col gap-2"
                          >
                            {rows.slice(0, 3).map((row, index) => (
                              <motion.div
                                key={`preview-${row.sequence}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  delay: index * 0.15,
                                  duration: 0.3,
                                }}
                                className="flex justify-between items-center p-2 rounded-md border border-stone-400 bg-stone-100"
                              >
                                <div className="text-sm text-stone-700">
                                  {new Date(row.date).toLocaleDateString()}
                                </div>
                                <div className="text-sm flex-1 mx-4 truncate">
                                  {row.description}
                                </div>
                                <div className="text-sm font-medium">
                                  {Number(row.amount) < 0
                                    ? `-RM${Math.abs(
                                        Number(row.amount)
                                      ).toFixed(2)}`
                                    : `RM${Number(row.amount).toFixed(2)}`}
                                </div>
                              </motion.div>
                            ))}
                          </motion.div>
                        </motion.div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
      <footer className="text-xs text-stone-500 text-center mt-4">
        We won't store your files. We only collect anonymized analytics. (Just
        the number of statements processed as shown at the end of this footer) A
        mini project by{" "}
        <a
          href="https://github.com/aqlanhadi"
          className="text-stone-600 hover:text-stone-700"
        >
          @aqlanhadi
        </a>
        . <br />
        <span className="text-stone-400">
          <a
            href="https://www.buymeacoffee.com/aqlan"
            className="text-stone-600 hover:text-stone-700"
          >
            Buy me a ☕️.{" "}
          </a>
        </span>
        <span className="text-stone-400">
          <span className="font-bold">{totalCount}</span> statements processed.
        </span>
      </footer>
    </div>
  );
}
