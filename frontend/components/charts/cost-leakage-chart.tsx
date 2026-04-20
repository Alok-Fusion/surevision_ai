"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const colors = ["#22d3ee", "#a78bfa", "#6ee7b7", "#f59e0b", "#c4b5fd"];

type Props = {
  data: { name: string; value: number }[];
};

export function CostLeakageChart({ data }: Props) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={3} stroke="rgba(2,6,23,0.8)">
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#08111f",
              border: "1px solid rgba(148,163,184,0.18)",
              borderRadius: 14,
              color: "#e5eefb"
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
