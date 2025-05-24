import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileData, ProcessedFile } from "@/lib/kwgn";

export function useSessionFiles() {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (hasInitialized) return;
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
          sessionStorage.removeItem("uploadedFiles");
        } else {
          setShouldRedirect(true);
        }
      } catch (error) {
        setShouldRedirect(true);
      } finally {
        setIsLoading(false);
        setHasInitialized(true);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [hasInitialized]);

  useEffect(() => {
    if (shouldRedirect) {
      router.push("/");
    }
  }, [shouldRedirect, router]);

  return { files, setFiles, isLoading, hasInitialized };
} 