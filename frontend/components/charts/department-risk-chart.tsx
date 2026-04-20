"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Props = {
  data: { department: string; risk: number }[];
};

export function DepartmentRiskChart({ data }: Props) {
  const colors = ["#f59e0b", "#a78bfa", "#22d3ee", "#6ee7b7", "#c4b5fd", "#fcd34d"];

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis dataKey="department" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: "#08111f",
              border: "1px solid rgba(148,163,184,0.18)",
              borderRadius: 14,
              color: "#e5eefb"
            }}
          />
          <Bar dataKey="risk" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.department} fill={colors[index % colors.length]} opacity={0.92} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
