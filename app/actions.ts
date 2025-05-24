'use server';

import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { extract, KwgnAccount, KwgnExtractResult, KwgnTransactions } from '@/lib/kwgn';
import crypto from 'crypto';

// Sanitize filename to prevent command injection
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^\w\s.-]/gi, '_');
}

async function hashFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  return crypto.createHash('sha256').update(Buffer.from(arrayBuffer)).digest('hex');
}

export async function processFiles(formData: FormData) {
  try {
    const outputs: string[] = [];
    const extractedResults: KwgnExtractResult[] = [];
    const transactions: (KwgnTransactions & { source: string, accountType: string })[] = [];
    const files: File[] = [];
    const hashes: string[] = [];
    const fileResults: { output: string; extractTypeUsed: string | null; error?: string }[] = [];
    
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
        const hash = await hashFile(file);
        hashes.push(hash);
        const tempFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${sanitizedName}`;
        const tempFilePath = join(tmpdir(), tempFileName);
        
        // Write file to temp location
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await writeFile(tempFilePath, buffer);

        // Try all extract types in order
        const extractTypes: ('MAYBANK_CASA_AND_MAE' | 'MAYBANK_2_CC' | 'TNG')[] = ['MAYBANK_CASA_AND_MAE', 'MAYBANK_2_CC', 'TNG'];
        let extractOutput = null;
        let extractTypeUsed = null;
        let extractError = null;
        for (const type of extractTypes) {
          try {
            extractOutput = await extract(tempFilePath, type);
            // if an empty object, try next type
            if (Object.keys(extractOutput).length === 0) {
              continue;
            }
            extractTypeUsed = type;
            break; // Success, stop trying
          } catch (err) {
            extractError = err;
          }
        }

        if (extractOutput && extractOutput.transactions.length > 0) {
          outputs.push(`File: ${file.name}\nKWGN Extract Output (Type: ${extractTypeUsed}):\n${JSON.stringify(extractOutput, null, 2)}\n---`);
          extractedResults.push({ 
            total_credit: extractOutput.total_credit,
            total_debit: extractOutput.total_debit,
            nett: extractOutput.nett,
            account: extractOutput.account,
            source: file.name,
            transactions: extractOutput.transactions,
           });
          transactions.push(...extractOutput.transactions.map(transaction => ({ ...transaction, source: file.name, accountType: extractTypeUsed ?? "" })));
          fileResults.push({ output: outputs[outputs.length - 1], extractTypeUsed });
        } else {
          console.error(`KWGN extraction error for ${file.name}:`, extractError);
          outputs.push(`File: ${file.name}\nError: KWGN extraction failed for all types - ${extractError instanceof Error ? extractError.message : 'Unknown error'}\n---`);
          fileResults.push({ output: outputs[outputs.length - 1], extractTypeUsed: null, error: extractError instanceof Error ? extractError.message : 'Unknown error' });
        }
        
        // Clean up temp file
        await unlink(tempFilePath);
        
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        outputs.push(`File: ${file.name}\nError: Failed to process file - ${fileError instanceof Error ? fileError.message : 'Unknown error'}\n---`);
        fileResults.push({ output: outputs[outputs.length - 1], extractTypeUsed: null, error: fileError instanceof Error ? fileError.message : 'Unknown error' });
      }
    }

    return { 
      success: true, 
      transactions,
      hashes,
      extractedResults,
      outputs,
      fileResults,
      message: `Successfully processed ${files.length} file(s) with kwgn`
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