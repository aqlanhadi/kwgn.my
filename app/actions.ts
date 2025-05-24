'use server';

import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { extract } from '@/lib/kwgn';

// Sanitize filename to prevent command injection
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^\w\s.-]/gi, '_');
}

export async function processFiles(formData: FormData) {
  try {
    const outputs: string[] = [];
    const files: File[] = [];
    
    // Extract all files from FormData
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return { success: false, error: "No files provided" };
    }

    // Process each file
    for (const file of files) {
      try {
        // Sanitize filename for security
        const sanitizedName = sanitizeFilename(file.name);
        const tempFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${sanitizedName}`;
        const tempFilePath = join(tmpdir(), tempFileName);
        
        // Write file to temp location
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await writeFile(tempFilePath, buffer);

        // Process file using kwgn CLI tool
        try {
          const extractOutput = await extract(tempFilePath, 'MAYBANK_CASA_AND_MAE');
          // Format output to include filename and JSON data
          outputs.push(`File: ${file.name}\nKWGN Extract Output:\n${JSON.stringify(extractOutput, null, 2)}\n---`);
        } catch (extractError) {
          console.error(`KWGN extraction error for ${file.name}:`, extractError);
          outputs.push(`File: ${file.name}\nError: KWGN extraction failed - ${extractError instanceof Error ? extractError.message : 'Unknown error'}\n---`);
        }
        
        // Clean up temp file
        await unlink(tempFilePath);
        
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        outputs.push(`File: ${file.name}\nError: Failed to process file - ${fileError instanceof Error ? fileError.message : 'Unknown error'}\n---`);
      }
    }

    return { 
      success: true, 
      outputs,
      message: `Successfully processed ${files.length} file(s) with KWGN`
    };
    
  } catch (error) {
    console.error("Error in processFiles:", error);
    return { 
      success: false, 
      error: "Failed to process files with KWGN" 
    };
  }
}

// Keep the old function for backward compatibility
export async function extractTextFromPDF(formData: FormData) {
  try {
    const file = formData.get("pdf") as File;
    
    if (!file || file.type !== "application/pdf") {
      return { error: "Please upload a valid PDF file" };
    }

    // Legacy function - kept for compatibility
    return { error: "Function deprecated, use processFiles instead" };
    
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    return { error: "Failed to extract text from PDF" };
  }
} 