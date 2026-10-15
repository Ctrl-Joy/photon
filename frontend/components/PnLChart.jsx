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
        // Build cumulative PnL from trade history
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
        <div className="bg-photon-card border border-photon-border rounded-lg p-3 text-sm shadow-xl">
          <div className="text-photon-muted mb-1">{d.time}</div>
          <div className={`stat-number font-semibold ${d.pnl >= 0 ? "text-photon-green" : "text-photon-red"}`}>
            {d.pnl >= 0 ? "+" : ""}{d.pnl} ETH
          </div>
        </div>
      );
    }
    return null;
  };

  const lastPnl = data.length > 0 ? data[data.length - 1].pnl : 0;

  return (
    <div className="bg-photon-card border border-photon-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Cumulative P&L</h3>
          <p className={`text-2xl font-bold stat-number mt-1 ${lastPnl >= 0 ? "text-photon-green" : "text-photon-red"}`}>
            {lastPnl >= 0 ? "+" : ""}{lastPnl.toFixed(4)} ETH
          </p>
        </div>
        {data === generateDemoData && (
          <span className="text-xs text-photon-muted bg-photon-bg rounded-lg px-2 py-1">Demo Data</span>
        )}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-photon-muted">Loading chart...</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lastPnl >= 0 ? "#00B894" : "#FF6B6B"} stopOpacity={0.3} />
                <stop offset="100%" stopColor={lastPnl >= 0 ? "#00B894" : "#FF6B6B"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A45" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#8B8CA7", fontSize: 11 }}
              axisLine={{ stroke: "#2A2A45" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#8B8CA7", fontSize: 11 }}
              axisLine={{ stroke: "#2A2A45" }}
              tickLine={false}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="pnl"
              stroke={lastPnl >= 0 ? "#00B894" : "#FF6B6B"}
              strokeWidth={2}
              fill="url(#pnlGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
