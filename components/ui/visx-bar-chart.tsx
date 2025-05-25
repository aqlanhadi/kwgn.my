import React from "react";
import { Group } from '@visx/group';
import { Bar } from '@visx/shape';
import { scaleBand, scaleLinear } from '@visx/scale';
import { TransactionWithAccount } from "@/app/transactions/page";

interface VisxBarChartProps {
  transactions: TransactionWithAccount[];
  width?: number;
  height?: number;
}

export const VisxBarChart: React.FC<VisxBarChartProps> = ({ transactions, width = 600, height = 300 }) => {
  // Prepare data: group by date, sum money in and out
  const chartData = React.useMemo(() => {
    if (transactions.length === 0) return [];
    const dailyFlow = new Map<string, { moneyIn: number; moneyOut: number }>();
    transactions.forEach(({ transaction }) => {
      const date = transaction.date;
      const amount = parseFloat(transaction.amount.replace(/[^\d.-]/g, ""));
      const current = dailyFlow.get(date) || { moneyIn: 0, moneyOut: 0 };
      if (transaction.type === "credit") {
        current.moneyIn += amount;
      } else {
        current.moneyOut += amount; // amount is negative for debits
      }
      dailyFlow.set(date, current);
    });
    return Array.from(dailyFlow.entries())
      .map(([date, { moneyIn, moneyOut }]) => ({
        date: new Date(date).toLocaleDateString("en-MY", {
          month: "short",
          day: "numeric"
        }),
        moneyIn: Math.round(moneyIn * 100) / 100,
        moneyOut: Math.round(moneyOut * 100) / 100,
        fullDate: date
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  }, [transactions]);

  // Scales
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;
  const xScale = scaleBand({
    domain: chartData.map(d => d.date),
    range: [0, xMax],
    padding: 0.3,
  });
  const minY = Math.min(0, ...chartData.map(d => d.moneyOut));
  const maxY = Math.max(0, ...chartData.map(d => d.moneyIn));
  const yScale = scaleLinear({
    domain: [minY, maxY],
    range: [yMax, 0],
    nice: true,
  });

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <Group left={margin.left} top={margin.top}>
        {/* Y axis grid lines */}
        {[...yScale.ticks(5)].map((tick, i) => (
          <line
            key={i}
            x1={0}
            x2={xMax}
            y1={yScale(tick)}
            y2={yScale(tick)}
            stroke="#e5e7eb"
            strokeDasharray="2,2"
          />
        ))}
        {/* Bars */}
        {chartData.map((d, i) => {
          const x = xScale(d.date);
          if (x == null) return null;
          // Money In (green, up)
          const moneyInBar = d.moneyIn > 0 ? (
            <Bar
              key={`in-${i}`}
              x={x}
              y={yScale(d.moneyIn)}
              width={xScale.bandwidth()}
              height={yScale(0) - yScale(d.moneyIn)}
              fill="#059669"
              rx={0}
            />
          ) : null;
          // Money Out (red, down)
          const moneyOutBar = d.moneyOut < 0 ? (
            <Bar
              key={`out-${i}`}
              x={x}
              y={yScale(0)}
              width={xScale.bandwidth()}
              height={yScale(d.moneyOut) - yScale(0)}
              fill="#dc2626"
              rx={0}
            />
          ) : null;
          return (
            <React.Fragment key={d.date}>
              {moneyInBar}
              {moneyOutBar}
            </React.Fragment>
          );
        })}
        {/* X axis */}
        {chartData.map((d, i) => {
          const x = xScale(d.date);
          if (x == null) return null;
          return (
            <text
              key={`xaxis-${i}`}
              x={x + xScale.bandwidth() / 2}
              y={yMax + 16}
              textAnchor="middle"
              fontSize={10}
              fill="#6b7280"
            >
              {d.date}
            </text>
          );
        })}
        {/* Y axis */}
        {yScale.ticks(5).map((tick, i) => (
          <text
            key={`yaxis-${i}`}
            x={-8}
            y={yScale(tick) + 4}
            textAnchor="end"
            fontSize={10}
            fill="#6b7280"
          >
            {tick}
          </text>
        ))}
      </Group>
    </svg>
  );
}; 