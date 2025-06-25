
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PolicyComplianceDataPoint } from '../../types';

interface PolicyComplianceChartProps {
  data: PolicyComplianceDataPoint[];
}

// Updated COLORS for semantic meaning within the new brand palette
const POLICY_COMPLIANCE_COLORS: { [key: string]: string } = {
  'Compliant': '#2E8B57',             // SeaGreen (positive)
  'Missing Policy Code': '#FFA500',   // Orange (warning)
  'Invalid Policy Code': '#DC143C',   // Crimson (error)
  'Amount Violation': '#FF8C00',      // DarkOrange (significant issue)
  'Other Violations': '#708090'       // SlateGray (neutral/other)
};

const PolicyComplianceChart: React.FC<PolicyComplianceChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-center py-4">No data available for policy compliance.</p>;
  }
  
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent * 100 < 5) return null; // Don't render label for very small slices

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };


  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={100}
          fill="#8884d8" // Default fill, overridden by Cell
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={POLICY_COMPLIANCE_COLORS[entry.name] || POLICY_COMPLIANCE_COLORS['Other Violations']} />
          ))}
        </Pie>
        <Tooltip 
            formatter={(value: number, name: string) => [`${value.toLocaleString()} transactions`, name]}
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
        />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PolicyComplianceChart;