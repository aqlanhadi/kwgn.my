"use client"

import { DailyTransactionFlowChart, CumulativeCashFlowChart } from "@/components/ui/bar-chart"
import { Card } from "../ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs"
import { TransactionWithAccount } from "@/app/transactions/page"
import { VisxBarChart } from "../ui/visx-bar-chart"
import { useContainerWidth } from "@/lib/hooks/useContainerWidth"

interface SummaryProps {
  transactions: TransactionWithAccount[];
}

export function Summary({ transactions }: SummaryProps) {
  const [chartRef, chartWidth] = useContainerWidth<HTMLDivElement>();

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
          <DailyTransactionFlowChart transactions={transactions} />
        </TabsContent>
        
        <TabsContent value="cumulative" className="mt-6">
          <CumulativeCashFlowChart transactions={transactions} />
        </TabsContent>
      </Tabs>

      <div ref={chartRef} className="border-2 border-gray-300 rounded-md p-4 w-full">
        <VisxBarChart transactions={transactions} width={chartWidth || 600} />
      </div>
    </Card>
  )
}