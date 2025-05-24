"use client"

import { DailyTransactionFlowChart, CumulativeCashFlowChart } from "@/components/ui/bar-chart"
import { Card } from "../ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs"
import { KwgnExtractResult } from "@/lib/kwgn"

interface FileWithSummary {
  extractResult?: KwgnExtractResult;
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  content: string;
  processed: boolean;
  output?: string;
  error?: string;
}

interface SummaryProps {
  filesWithSummary: FileWithSummary[];
}

export function Summary({ filesWithSummary }: SummaryProps) {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          Financial Summary
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Analyze your transaction data with different chart views
        </p>
      </div>
      
      <Tabs defaultValue="money-flow" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="money-flow">Money In vs Out</TabsTrigger>
          <TabsTrigger value="cumulative">Cumulative Cash Flow</TabsTrigger>
        </TabsList>
        
        <TabsContent value="money-flow" className="mt-6">
          <DailyTransactionFlowChart filesWithSummary={filesWithSummary} />
        </TabsContent>
        
        <TabsContent value="cumulative" className="mt-6">
          <CumulativeCashFlowChart filesWithSummary={filesWithSummary} />
        </TabsContent>
      </Tabs>
    </Card>
  )
}