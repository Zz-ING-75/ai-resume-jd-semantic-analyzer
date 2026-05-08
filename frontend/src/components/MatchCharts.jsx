import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function MatchCharts({ matchedCount, missingCount }) {
  const pieData = [
    { name: "已匹配", value: matchedCount },
    { name: "缺失", value: missingCount },
  ];

  const barData = [
    { name: "已匹配", count: matchedCount },
    { name: "缺失", count: missingCount },
  ];

  const COLORS = ["#10b981", "#f59e0b"];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="h-72 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
        <p className="mb-2 text-sm font-semibold text-slate-300">技能匹配占比</p>
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
              {pieData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="h-72 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
        <p className="mb-2 text-sm font-semibold text-slate-300">技能数量对比</p>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={barData}>
            <XAxis dataKey="name" stroke="#cbd5e1" />
            <YAxis stroke="#cbd5e1" />
            <Tooltip />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {barData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default MatchCharts;
