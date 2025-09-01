"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";

interface FileDropzoneProps {
  onFilesDropped?: (files: File[]) => Promise<void> | void;
  accept?: string;
  onHidden?: () => void;
}

export function FileDropzone({
  onFilesDropped,
  accept,
  onHidden,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  type Phase = "idle" | "uploading" | "processing" | "done";
  const [phase, setPhase] = useState<Phase>("idle");
  const [isHidden, setIsHidden] = useState(false);
  const router = useRouter();

  // Animation configuration
  const containerAnimation = {
    duration: 0.3,
    ease: "easeInOut" as const,
  };

  // onHidden will be called after exit animation via AnimatePresence

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      setPhase("uploading");

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        try {
          const minMs = 2000;
          const phaseGate = new Promise<void>((resolve) => {
            const toProcess = setTimeout(
              () => setPhase("processing"),
              Math.floor(minMs / 2)
            );
            const toDoneGate = setTimeout(() => {
              clearTimeout(toProcess);
              resolve();
            }, minMs);
          });

          if (onFilesDropped) {
            await Promise.all([onFilesDropped(files), phaseGate]);
          } else {
            const processTask = (async () => {
              const fileData = await Promise.all(
                files.map(async (file) => ({
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  lastModified: file.lastModified,
                  content: await fileToBase64(file),
                }))
              );
              sessionStorage.setItem("uploadedFiles", JSON.stringify(fileData));
            })();
            await Promise.all([processTask, phaseGate]);
            router.push("/transactions");
          }
        } finally {
          setPhase("done");
          setIsHidden(true);
        }
      }
    },
    [onFilesDropped, router]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        setPhase("uploading");
        try {
          const minMs = 2000;
          const phaseGate = new Promise<void>((resolve) => {
            const toProcess = setTimeout(
              () => setPhase("processing"),
              Math.floor(minMs / 2)
            );
            const toDoneGate = setTimeout(() => {
              clearTimeout(toProcess);
              resolve();
            }, minMs);
          });

          if (onFilesDropped) {
            await Promise.all([onFilesDropped(files), phaseGate]);
          } else {
            const processTask = (async () => {
              const fileData = await Promise.all(
                files.map(async (file) => ({
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  lastModified: file.lastModified,
                  content: await fileToBase64(file),
                }))
              );
              sessionStorage.setItem("uploadedFiles", JSON.stringify(fileData));
            })();
            await Promise.all([processTask, phaseGate]);
            router.push("/transactions");
          }
        } finally {
          setPhase("done");
          setIsHidden(true);
        }
      }
    },
    [onFilesDropped, router]
  );

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <AnimatePresence onExitComplete={() => onHidden?.()}>
      {!isHidden && (
        <motion.div
          key="dropzone"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={containerAnimation}
          layout="position"
          layoutId="dropzone"
          className={cn(
            "relative rounded-lg p-6 text-center transition-colors",
            phase === "idle"
              ? "bg-slate-50 cursor-pointer"
              : "bg-stone-200 cursor-default",
            phase === "idle" &&
              (isDragOver ? "bg-yellow-50" : "hover:bg-stone-300"),
            phase !== "idle" && phase !== "done" && "opacity-60"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
            accept={accept}
            disabled={phase !== "idle"}
          />

          {phase === "idle" && (
            <label
              htmlFor="file-input"
              className="absolute inset-0 z-10 cursor-pointer"
              aria-label="Browse files"
            />
          )}

          <motion.div
            layout="position"
            layoutId="status-container"
            transition={containerAnimation}
          >
            <AnimatePresence mode="wait" initial={false}>
              {phase === "uploading" && (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: containerAnimation.duration * 0.8 }}
                  className="text-stone-700 min-h-[60px] flex flex-col justify-center"
                >
                  <p className="text-md font-medium">Uploading files...</p>
                  <p className="text-sm text-stone-500">Please wait</p>
                </motion.div>
              )}
              {phase === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: containerAnimation.duration * 0.8 }}
                  className="text-stone-700 min-h-[60px] flex flex-col justify-center"
                >
                  <p className="text-md font-medium">Processing...</p>
                  <p className="text-sm text-stone-500">Hang tight</p>
                </motion.div>
              )}
              {phase === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: containerAnimation.duration * 0.8 }}
                  className="min-h-[60px] flex items-center justify-center"
                >
                  <p className="text-md font-medium text-stone-700">
                    Drop financial statements here or click to browse
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
