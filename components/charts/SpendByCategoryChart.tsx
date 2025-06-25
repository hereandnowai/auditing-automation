
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { CategorySpending } from '../../types';

interface SpendByCategoryChartProps {
  data: CategorySpending[];
}

// Updated COLORS array using brand colors and a derived palette
const CHART_COLORS = [
  '#FFDF00', // HERE AND NOW AI Primary
  '#004040', // HERE AND NOW AI Secondary
  '#FFA500', // Orange
  '#20B2AA', // LightSeaGreen (complementary to teal)
  '#FFC0CB', // Pink (for variety)
  '#4682B4', // SteelBlue
  '#DAA520', // Goldenrod (analogous to primary)
  '#008080', // Teal (darker shade of secondary)
  '#FF6347', // Tomato Red
  '#6A5ACD', // SlateBlue
];

const SpendByCategoryChart: React.FC<SpendByCategoryChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-center py-4">No data available for spend by category.</p>;
  }
  
  const chartData = data.sort((a,b) => b.amount - a.amount).slice(0,10); // Top 10 categories

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis 
            dataKey="name" 
            tick={{ fontSize: 10, fill: '#666' }} 
            interval={0} 
            angle={-30} 
            textAnchor="end" 
            height={70}
        />
        <YAxis tickFormatter={(value) => `$${(Number(value)/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#666' }} />
        <Tooltip
          formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "Amount"]}
          labelStyle={{ color: '#333', fontWeight: 'bold' }}
          itemStyle={{ color: '#555' }}
          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
        />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
        <Bar dataKey="amount" name="Spend" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SpendByCategoryChart;