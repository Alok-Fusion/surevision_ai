"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Props = {
  data: { month: string; risk: number; trust: number }[];
};

export function RiskTrendChart({ data }: Props) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="risk" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="trust" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "#08111f",
              border: "1px solid rgba(148,163,184,0.18)",
              borderRadius: 14,
              color: "#e5eefb"
            }}
          />
          <Area type="monotone" dataKey="risk" stroke="#f59e0b" strokeWidth={2.4} fill="url(#risk)" />
          <Area type="monotone" dataKey="trust" stroke="#22d3ee" strokeWidth={2.4} fill="url(#trust)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
