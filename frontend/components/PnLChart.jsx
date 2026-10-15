"use client";
import { useEffect, useState } from "react";
import { getTradeHistory } from "../lib/api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function PnLChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const trades = await getTradeHistory(100);
        let cumulative = 0;
        const chartData = (trades || []).map((t, i) => {
          cumulative += t.profit || 0;
          return {
            index: i + 1,
            time: new Date(t.timestamp).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            pnl: parseFloat(cumulative.toFixed(4)),
            profit: t.profit || 0,
          };
        });
        setData(chartData.length > 0 ? chartData : generateDemoData());
      } catch {
        setData(generateDemoData());
      }
      setLoading(false);
    }
    load();
  }, []);

  function generateDemoData() {
    const points = [];
    let cumulative = 0;
    for (let i = 0; i < 30; i++) {
      const profit = (Math.random() - 0.35) * 0.5;
      cumulative += profit;
      points.push({
        index: i + 1,
        time: `Day ${i + 1}`,
        pnl: parseFloat(cumulative.toFixed(4)),
        profit: parseFloat(profit.toFixed(4)),
      });
    }
    return points;
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-dex-card border border-dex-border rounded-lg p-2.5 text-[12px] shadow-xl">
          <div className="text-dex-muted mb-1">{d.time}</div>
          <div className={`font-num font-semibold ${d.pnl >= 0 ? "text-dex-green" : "text-dex-red"}`}>
            {d.pnl >= 0 ? "+" : ""}{d.pnl} ETH
          </div>
        </div>
      );
    }
    return null;
  };

  const lastPnl = data.length > 0 ? data[data.length - 1].pnl : 0;

  return (
    <div className="bg-dex-surface border border-dex-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-dex-border flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold text-white">Cumulative P&L</div>
          <div className={`text-[18px] font-bold font-num mt-0.5 ${lastPnl >= 0 ? "text-dex-green" : "text-dex-red"}`}>
            {lastPnl >= 0 ? "+" : ""}{lastPnl.toFixed(4)} ETH
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="h-[220px] flex items-center justify-center text-dex-muted text-[13px]">Loading chart...</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lastPnl >= 0 ? "#3FB68B" : "#FF5353"} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={lastPnl >= 0 ? "#3FB68B" : "#FF5353"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: "#72768F", fontSize: 10 }}
                axisLine={{ stroke: "#1E1E2E" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#72768F", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="pnl"
                stroke={lastPnl >= 0 ? "#3FB68B" : "#FF5353"}
                strokeWidth={1.5}
                fill="url(#pnlGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
