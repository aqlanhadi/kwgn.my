import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export interface kwgnAccount {
    account_number: string
    account_name: string
    account_type: string
    debit_credit: string
    reconciliable: boolean
}

export interface kwgnTransaction {
    sequence: number
    date: string
    descriptions: string[]
    type: "debit" | "credit"
    amount: string
    balance: string
    ref: string
}

export interface kwgnExtractResult {
    account: kwgnAccount
    nett: string
    source: string
    total_credit: string
    total_debit: string
    transactions: kwgnTransaction[]
}

export async function extract(file: string, type: 'MAYBANK_CASA_AND_MAE' | 'MAYBANK_2_CC' | 'TNG'): Promise<kwgnExtractResult> {
    const { stdout } = await execAsync(`kwgn extract -f "${file}" --config ${process.env.KWGN_CONFIG_PATH} --statement-type ${type}`)
    return JSON.parse(stdout) as kwgnExtractResult
}
