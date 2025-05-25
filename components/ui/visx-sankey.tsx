"use client";

import { useMemo } from "react";
import { sankey, sankeyLinkHorizontal } from "@visx/sankey";
import { TransactionWithAccount } from "@/app/transactions/page";

interface SankeyNode {
  id: string;
  name: string;
  value: number;
  type: "credit" | "debit" | "total";
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

interface VisxSankeyProps {
  transactions: TransactionWithAccount[];
  width: number;
  height?: number;
}

export function VisxSankey({ transactions, width, height = 400 }: VisxSankeyProps) {
  const sankeyData = useMemo(() => {
    // Group transactions by their first description and type
    const creditGroups = new Map<string, number>();
    const debitGroups = new Map<string, number>();

    transactions.forEach(({ transaction }) => {
      const description = transaction.descriptions[0] || "Unknown";
      const amount = Math.abs(parseFloat(transaction.amount));

      if (transaction.type === "credit") {
        creditGroups.set(description, (creditGroups.get(description) || 0) + amount);
      } else if (transaction.type === "debit") {
        debitGroups.set(description, (debitGroups.get(description) || 0) + amount);
      }
    });

    // Calculate totals
    const totalCredit = Array.from(creditGroups.values()).reduce((sum, val) => sum + val, 0);
    const totalDebit = Array.from(debitGroups.values()).reduce((sum, val) => sum + val, 0);

    // Create nodes
    const nodes: SankeyNode[] = [];
    
    // Add credit nodes (left side)
    creditGroups.forEach((value, description) => {
      nodes.push({
        id: `credit_${description}`,
        name: description,
        value,
        type: "credit"
      });
    });

    // Add middle "Total Income" node
    nodes.push({
      id: "total_income",
      name: "Total Income",
      value: totalCredit,
      type: "total"
    });

    // Add debit nodes (right side)
    debitGroups.forEach((value, description) => {
      nodes.push({
        id: `debit_${description}`,
        name: description,
        value,
        type: "debit"
      });
    });

    // Create links
    const links: SankeyLink[] = [];
    const creditNodeCount = creditGroups.size;
    const totalNodeIndex = creditNodeCount; // Index of the "Total Income" node
    
    // Links from credit sources to "Total Income"
    Array.from(creditGroups.entries()).forEach(([description, value], index) => {
      links.push({
        source: index,
        target: totalNodeIndex,
        value: value
      });
    });

    // Links from "Total Income" to debit destinations
    Array.from(debitGroups.entries()).forEach(([description, value], index) => {
      const debitNodeIndex = creditNodeCount + 1 + index; // +1 for the total income node
      links.push({
        source: totalNodeIndex,
        target: debitNodeIndex,
        value: value
      });
    });

    return { nodes, links };
  }, [transactions]);

  const sankeyGenerator = useMemo(() => {
    // Reserve more space for text labels (100px on each side) and legend at bottom
    const chartHeight = height - 60;
    return sankey<SankeyNode, SankeyLink>()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[120, 20], [width - 120, chartHeight - 20]]);
  }, [width, height]);

  const { nodes, links } = useMemo(() => {
    return sankeyGenerator(sankeyData);
  }, [sankeyGenerator, sankeyData]);

  if (sankeyData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No transaction data available for Sankey chart
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-50">
        Transaction Flow (Sankey Diagram)
      </h3>
      <div className="border rounded-lg bg-white dark:bg-gray-800">
        <svg width={width} height={height}>
          {/* Render links */}
          {links.map((link, i) => {
            const sourceIndex = typeof link.source === 'number' ? link.source : 0;
            const targetIndex = typeof link.target === 'number' ? link.target : 0;
            const sourceNode = sankeyData.nodes[sourceIndex];
            const targetNode = sankeyData.nodes[targetIndex];
            
            // Color based on the flow direction
            let strokeColor = "#6b7280"; // default gray
            if (sourceNode?.type === "credit" && targetNode?.type === "total") {
              strokeColor = "#10b981"; // green for income flows to total
            } else if (sourceNode?.type === "total" && targetNode?.type === "debit") {
              strokeColor = "#ef4444"; // red for expense flows from total
            }
            
            return (
              <path
                key={`link-${i}`}
                d={sankeyLinkHorizontal()(link) || ""}
                fill="none"
                stroke={strokeColor}
                strokeWidth={Math.max(1, link.width || 1)}
                strokeOpacity={0.6}
              />
            );
          })}
          
          {/* Render nodes */}
          {nodes.map((node, i) => {
            const originalNode = sankeyData.nodes[i];
            const nodeX = node.x0 || 0;
            const nodeY = (node.y0 || 0) + ((node.y1 || 0) - (node.y0 || 0)) / 2;
            const isCredit = originalNode?.type === "credit";
            const isTotal = originalNode?.type === "total";
            const isDebit = originalNode?.type === "debit";
            
            // Determine node color
            let nodeColor = "#6b7280"; // default gray
            if (isCredit) nodeColor = "#10b981"; // green
            else if (isDebit) nodeColor = "#ef4444"; // red
            else if (isTotal) nodeColor = "#3b82f6"; // blue for total
            
            // Determine text position
            let textX = nodeX;
            let textAnchor: "start" | "middle" | "end" = "middle";
            
            if (isCredit) {
              textX = nodeX - 10;
              textAnchor = "end";
            } else if (isDebit) {
              textX = (node.x1 || 0) + 10;
              textAnchor = "start";
            } else if (isTotal) {
              textX = nodeX + ((node.x1 || 0) - nodeX) / 2;
              textAnchor = "middle";
            }
            
            return (
              <g key={`node-${i}`}>
                <rect
                  x={node.x0}
                  y={node.y0}
                  width={(node.x1 || 0) - (node.x0 || 0)}
                  height={(node.y1 || 0) - (node.y0 || 0)}
                  fill={nodeColor}
                  fillOpacity={0.8}
                  rx={2}
                />
                
                {/* Node name */}
                <text
                  x={textX}
                  y={isTotal ? nodeY - 8 : nodeY}
                  dy="0.35em"
                  textAnchor={textAnchor}
                  fontSize={isTotal ? 14 : 12}
                  fontWeight={isTotal ? "600" : "500"}
                  fill="#1f2937"
                  className="dark:fill-gray-100"
                >
                  {originalNode?.name}
                </text>
                
                {/* Node value */}
                <text
                  x={textX}
                  y={isTotal ? nodeY + 8 : nodeY + 16}
                  dy="0.35em"
                  textAnchor={textAnchor}
                  fontSize={10}
                  fill="#6b7280"
                  className="dark:fill-gray-400"
                >
                  RM {originalNode?.value.toFixed(2)}
                </text>
              </g>
            );
          })}
          
          {/* Legend inside SVG */}
          <g transform={`translate(${width / 2}, ${height - 30})`}>
            {/* Money In (Credits) */}
            <g transform="translate(-120, 0)">
              <rect x={0} y={0} width={16} height={16} fill="#10b981" rx={2} />
              <text x={20} y={12} fontSize={12} fill="#374151" className="dark:fill-gray-300">
                Income Sources
              </text>
            </g>
            
            {/* Total Income */}
            <g transform="translate(-20, 0)">
              <rect x={0} y={0} width={16} height={16} fill="#3b82f6" rx={2} />
              <text x={20} y={12} fontSize={12} fill="#374151" className="dark:fill-gray-300">
                Total Income
              </text>
            </g>
            
            {/* Money Out (Debits) */}
            <g transform="translate(80, 0)">
              <rect x={0} y={0} width={16} height={16} fill="#ef4444" rx={2} />
              <text x={20} y={12} fontSize={12} fill="#374151" className="dark:fill-gray-300">
                Expenses
              </text>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
} 