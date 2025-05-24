"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { kwgnExtractResult, kwgnTransaction, kwgnAccount } from "@/lib/kwgn";
import { Download, Search, Filter } from "lucide-react";

interface TransactionTableProps {
  output: string;
}

interface ParsedResult {
  extractResult: kwgnExtractResult;
  filename: string;
}

export function TransactionTable({ output }: TransactionTableProps) {
  const [sortBy, setSortBy] = useState<keyof kwgnTransaction>("sequence");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "credit" | "debit">("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");

  const parsedResults = useMemo(() => {
    const results: ParsedResult[] = [];
    
    // Split output by file separators
    const fileOutputs = output.split("---").filter(section => section.trim());
    
    for (const fileOutput of fileOutputs) {
      try {
        // Extract filename
        const filenameMatch = fileOutput.match(/File: (.+)/);
        const filename = filenameMatch ? filenameMatch[1].trim() : "Unknown file";
        
        // Find JSON content between KWGN Extract Output: and end of section
        const jsonMatch = fileOutput.match(/KWGN Extract Output:\s*(\{[\s\S]*\})/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[1].trim();
          const extractResult = JSON.parse(jsonStr) as kwgnExtractResult;
          results.push({ extractResult, filename });
        }
      } catch (error) {
        console.error("Error parsing file output:", error);
      }
    }
    
    return results;
  }, [output]);

  const allTransactions = useMemo(() => {
    const transactions: (kwgnTransaction & { filename: string; account: kwgnAccount })[] = [];
    
    for (const result of parsedResults) {
      for (const transaction of result.extractResult.transactions) {
        transactions.push({
          ...transaction,
          filename: result.filename,
          account: result.extractResult.account,
        });
      }
    }
    
    return transactions;
  }, [parsedResults]);

  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.descriptions.some(desc =>
          desc.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        transaction.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.account.account_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter(transaction => transaction.type === typeFilter);
    }

    // Filter by account
    if (accountFilter !== "all") {
      filtered = filtered.filter(transaction => 
        transaction.account?.account_number === accountFilter
      );
    }

    // Sort transactions
    return filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [allTransactions, searchTerm, typeFilter, accountFilter, sortBy, sortOrder]);

  const uniqueAccounts = useMemo(() => {
    const accounts = new Set<string>();
    allTransactions.forEach(transaction => {
      // Only add non-empty account numbers
      if (transaction.account?.account_number && transaction.account.account_number.trim()) {
        accounts.add(transaction.account.account_number);
      }
    });
    return Array.from(accounts);
  }, [allTransactions]);

  const handleSort = (column: keyof kwgnTransaction) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount.replace(/[^\d.-]/g, ""));
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: "MYR",
    }).format(num);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-MY", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Sequence",
      "Date",
      "Description",
      "Type",
      "Amount",
      "Balance", 
      "Reference",
      "Account Name",
      "Account Number",
      "Filename"
    ];

    const csvData = filteredTransactions.map(transaction => [
      transaction.sequence,
      transaction.date,
      transaction.descriptions.join(" | "),
      transaction.type,
      transaction.amount,
      transaction.balance,
      transaction.ref,
      transaction.account.account_name,
      transaction.account.account_number,
      transaction.filename
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (parsedResults.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction Table</CardTitle>
          <CardDescription>
            No valid transaction data found in the output. Make sure the files are processed successfully.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Transactions ({filteredTransactions.length})</CardTitle>
              <CardDescription>
                Combined transactions from all processed files
              </CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={(value: "all" | "credit" | "debit") => setTypeFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
              </SelectContent>
            </Select>
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {uniqueAccounts
                  .filter(account => account && account.trim()) // Extra safety check
                  .map(account => (
                    <SelectItem key={account} value={account}>
                      {account}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transactions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("date")}
                  >
                    Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("type")}
                  >
                    Type {sortBy === "type" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("amount")}
                  >
                    Amount {sortBy === "amount" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Account</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No transactions found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction, index) => (
                    <TableRow key={`${transaction.filename}-${transaction.sequence}-${index}`}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground font-mono">#{transaction.sequence}</div>
                          {transaction.descriptions.map((desc, i) => (
                            <div key={i} className={i === 0 ? "text-sm" : "text-xs text-muted-foreground"}>
                              {desc}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`font-mono text-xs px-2 py-0.5 rounded-full border shadow-none ${
                            transaction.type === "credit" 
                              ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200" 
                              : "bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
                          }`}
                        >
                          {transaction.type.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={transaction.type === "credit" ? "text-green-600" : "text-red-600"}>
                          {formatCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(transaction.balance)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          <div className="font-medium">{transaction.account.account_name}</div>
                          <div className="text-muted-foreground font-mono">
                            {transaction.account.account_number}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 