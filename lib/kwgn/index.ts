import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export interface KwgnAccount {
    account_number: string
    account_name: string
    account_type: string
    debit_credit: string
    reconciliable: boolean
}

export interface KwgnTransactions {
    sequence: number
    date: string
    descriptions: string[]
    type: "debit" | "credit"
    amount: string
    balance: string
    ref: string
}

export interface KwgnExtractResult {
    account: KwgnAccount
    nett: string
    source: string
    total_credit: string
    total_debit: string
    transactions: KwgnTransactions[]
}

export interface FileData {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  content: string;
}

export interface ProcessedFile extends FileData {
  id: string;
  processed: boolean;
  output?: string;
  error?: string;
  extractTypeUsed?: string | null;
}

export interface FileWithSummary extends ProcessedFile {
  extractResult?: KwgnExtractResult;
}

export async function extract(file: string, type: 'MAYBANK_CASA_AND_MAE' | 'MAYBANK_2_CC' | 'TNG'): Promise<KwgnExtractResult> {
    const { stdout } = await execAsync(`kwgn extract -f "${file}" --config ${process.env.KWGN_CONFIG_PATH} --statement-type ${type}`)
    return JSON.parse(stdout) as KwgnExtractResult
}
