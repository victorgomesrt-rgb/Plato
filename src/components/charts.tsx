"use client";

import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell,
} from "recharts";

type TrendPoint = { label: string; value: number };

export function AreaTrend({
  data, color = "#FB6A1A", height = 220, gradId = "trend", suffix = "",
}: {
  data: TrendPoint[];
  color?: string;
  height?: number;
  gradId?: string;
  suffix?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6B6660" }} interval="preserveStartEnd" minTickGap={28} />
        <YAxis hide domain={[0, "dataMax + 2"]} />
        <Tooltip
          cursor={{ stroke: color, strokeOpacity: 0.25 }}
          contentStyle={{ borderRadius: 12, border: "1px solid #ECE7E1", fontSize: 12, padding: "6px 10px" }}
          labelStyle={{ color: "#6B6660" }}
          formatter={(v: number) => [`${v.toLocaleString()}${suffix}`, ""]}
        />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${gradId})`} dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export type Slice = { name: string; value: number; color: string };

export function Donut({
  data, centerValue, centerLabel, height = 200,
}: {
  data: Slice[];
  centerValue: string | number;
  centerLabel: string;
  height?: number;
}) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={total ? data : [{ name: "—", value: 1, color: "#ECE7E1" }]} dataKey="value" nameKey="name"
              innerRadius="64%" outerRadius="100%" paddingAngle={total ? 2 : 0} startAngle={90} endAngle={-270} stroke="none">
              {(total ? data : [{ color: "#ECE7E1" }]).map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-ink">{centerValue}</span>
          <span className="text-xs text-muted">{centerLabel}</span>
        </div>
      </div>
      <ul className="flex-1 space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-ink">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
              {d.name}
            </span>
            <span className="font-semibold text-ink">{d.value.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
