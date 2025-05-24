"use client";

import { TransactionTable } from "./TransactionTable";

// Sample output that mimics the KWGN CLI output format
const sampleOutput = `File: maybank_statement_202412.pdf
KWGN Extract Output:
{
  "account": {
    "account_number": "512345678901",
    "account_name": "SAVINGS ACCOUNT-i",
    "account_type": "SAVINGS",
    "debit_credit": "DEBIT",
    "reconciliable": true
  },
  "nett": "2450.75",
  "source": "MAYBANK",
  "total_credit": "5630.25",
  "total_debit": "3179.50",
  "transactions": [
    {
      "sequence": 1,
      "date": "2024-12-01",
      "descriptions": ["SALARY PAYMENT", "FROM COMPANY ABC SDN BHD"],
      "type": "credit",
      "amount": "3500.00",
      "balance": "8945.75",
      "ref": "FT24120100001"
    },
    {
      "sequence": 2,
      "date": "2024-12-02",
      "descriptions": ["ATM WITHDRAWAL", "MAYBANK ATM KLCC"],
      "type": "debit",
      "amount": "200.00",
      "balance": "8745.75",
      "ref": "AT24120200001"
    },
    {
      "sequence": 3,
      "date": "2024-12-03",
      "descriptions": ["ONLINE TRANSFER", "TO JOHN DOE", "DBS BANK"],
      "type": "debit",
      "amount": "500.00",
      "balance": "8245.75",
      "ref": "OT24120300001"
    },
    {
      "sequence": 4,
      "date": "2024-12-05",
      "descriptions": ["GROCERY SHOPPING", "TESCO KLCC"],
      "type": "debit",
      "amount": "145.50",
      "balance": "8100.25",
      "ref": "DC24120500001"
    },
    {
      "sequence": 5,
      "date": "2024-12-07",
      "descriptions": ["DIVIDEND PAYMENT", "PUBLIC BANK SHARES"],
      "type": "credit",
      "amount": "250.00",
      "balance": "8350.25",
      "ref": "DV24120700001"
    },
    {
      "sequence": 6,
      "date": "2024-12-10",
      "descriptions": ["BILL PAYMENT", "TNB ELECTRICITY BILL"],
      "type": "debit",
      "amount": "156.75",
      "balance": "8193.50",
      "ref": "BP24121000001"
    }
  ]
}
---
File: touchngo_statement_202412.pdf
KWGN Extract Output:
{
  "account": {
    "account_number": "60123456789",
    "account_name": "TOUCH N GO EWALLET",
    "account_type": "EWALLET",
    "debit_credit": "DEBIT",
    "reconciliable": true
  },
  "nett": "-45.25",
  "source": "TOUCHNGO",
  "total_credit": "100.00",
  "total_debit": "145.25",
  "transactions": [
    {
      "sequence": 1,
      "date": "2024-12-08",
      "descriptions": ["TOP UP", "MAYBANK ACCOUNT"],
      "type": "credit",
      "amount": "100.00",
      "balance": "245.75",
      "ref": "TU24120800001"
    },
    {
      "sequence": 2,
      "date": "2024-12-08",
      "descriptions": ["TOLL PAYMENT", "PLUS HIGHWAY SUBANG"],
      "type": "debit",
      "amount": "8.50",
      "balance": "237.25",
      "ref": "TL24120800001"
    },
    {
      "sequence": 3,
      "date": "2024-12-09",
      "descriptions": ["PARKING", "SUNWAY PYRAMID"],
      "type": "debit",
      "amount": "6.00",
      "balance": "231.25",
      "ref": "PK24120900001"
    },
    {
      "sequence": 4,
      "date": "2024-12-10",
      "descriptions": ["FOOD DELIVERY", "GRABFOOD ORDER"],
      "type": "debit",
      "amount": "25.75",
      "balance": "205.50",
      "ref": "FD24121000001"
    },
    {
      "sequence": 5,
      "date": "2024-12-12",
      "descriptions": ["PETROL", "SHELL BANGSAR"],
      "type": "debit",
      "amount": "45.00",
      "balance": "160.50",
      "ref": "PT24121200001"
    }
  ]
}
---`;

export function TransactionTableDemo() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Transaction Table Demo</h1>
          <p className="text-gray-600 mt-1">
            Sample transaction data showing the features of the transaction table
          </p>
        </div>
        
        <TransactionTable output={sampleOutput} />
      </div>
    </div>
  );
} 