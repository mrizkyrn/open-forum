import { useMemo } from 'react';
import {
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { TimeSeriesDto } from '@/features/admin/types';

interface LineChartProps {
  data: TimeSeriesDto[];
}

const LineChart = ({ data }: LineChartProps) => {
  // Format data for chart
  const chartData = useMemo(() => {
    const allDates = new Set<string>();
    data.forEach((series) => {
      series.data.forEach((point) => {
        allDates.add(point.date);
      });
    });

    const sortedDates = Array.from(allDates).sort();

    return sortedDates.map((date) => {
      const point: Record<string, any> = { date };

      data.forEach((series) => {
        const match = series.data.find((p) => p.date === date);
        point[series.name] = match ? match.value : 0;
      });

      return point;
    });
  }, [data]);

  // Format date for display
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Custom legend formatter
  const renderColorfulLegendText = (value: string) => {
    const series = data.find(s => s.name === value);
    return <span style={{ color: series?.color || '#000', fontWeight: 500, padding: '0 8px' }}>{value}</span>;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} axisLine={{ stroke: '#E2E8F0' }} />
        <YAxis tick={{ fontSize: 12 }} axisLine={{ stroke: '#E2E8F0' }} />
        <Tooltip formatter={(value: number) => [value, '']} labelFormatter={(label) => formatDate(label)} />
        
        <Legend 
          verticalAlign="bottom" 
          height={36} 
          formatter={renderColorfulLegendText}
          iconType="square"
          iconSize={10}
          wrapperStyle={{ paddingTop: 15 }}
        />
        
        {data.map((series) => (
          <Line
            key={series.name}
            type="monotone"
            dataKey={series.name}
            stroke={series.color}
            activeDot={{ r: 6 }}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default LineChart;