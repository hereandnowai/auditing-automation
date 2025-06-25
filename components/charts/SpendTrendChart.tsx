
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TimeSeriesDataPoint } from '../../types';

interface SpendTrendChartProps {
  data: TimeSeriesDataPoint[];
}

const SpendTrendChart: React.FC<SpendTrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-center py-4">No data available for spend trend.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666' }} />
        <YAxis tickFormatter={(value) => `$${(Number(value)/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#666' }} />
        <Tooltip
          formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "Monthly Spend"]}
          labelStyle={{ color: '#333', fontWeight: 'bold' }}
          itemStyle={{ color: '#004040' }} // Using secondary brand color for item text in tooltip
          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
        />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
        <Line 
            type="monotone" 
            dataKey="amount" 
            name="Spend" 
            stroke="#FFDF00" // HERE AND NOW AI Primary brand color
            strokeWidth={2} 
            activeDot={{ r: 6, fill: '#FFDF00', stroke: '#004040', strokeWidth: 2 }} 
            dot={{r:3, fill: '#FFDF00'}} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SpendTrendChart;