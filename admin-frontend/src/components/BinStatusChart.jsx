import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define colors for each status (you can customize these)
const COLORS = {
  EMPTY: '#2ecc71',       // Green
  FILLING: '#f1c40f',    // Yellow
  FULL: '#e74c3c',       // Red
  OVERFLOWING: '#c0392b', // Dark Red
  MAINTENANCE: '#95a5a6'   // Grey
};

// Default statuses in case some bins don't have a status
const DEFAULT_STATUSES = ['EMPTY', 'FILLING', 'FULL', 'OVERFLOWING', 'MAINTENANCE'];

function BinStatusChart({ bins }) {
  // 1. Process the bin data to count statuses
  const statusCounts = bins.reduce((acc, bin) => {
    const status = bin.status || 'MAINTENANCE'; // Default to MAINTENANCE if status is missing
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // 2. Format the data for Recharts Pie component
  // Ensure all default statuses are present, even if count is 0
  const chartData = DEFAULT_STATUSES.map(status => ({
    name: status,
    value: statusCounts[status] || 0, // Use count or 0
  })).filter(entry => entry.value > 0); // Only show slices with value > 0


  // If there's no data, display a message
  if (chartData.length === 0) {
    return <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No bin status data available.</div>;
  }

  return (
    <div style={{ width: '100%', height: 300 }}> {/* Set container size */}
      <h4>Bin Status Distribution</h4>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%" // Center X
            cy="50%" // Center Y
            labelLine={false}
            outerRadius={80} // Size of the pie
            fill="#8884d8"
            dataKey="value" // Use the 'value' (count) for slice size
            nameKey="name"  // Use the 'name' (status) for labels/tooltips
          >
            {/* Map data entries to colored Cells */}
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#bdc3c7'} /> // Use defined color or fallback grey
            ))}
          </Pie>
          {/* Tooltip shows details on hover */}
          <Tooltip formatter={(value, name) => [`${value} bins`, name]} />
          {/* Legend shows status names */}
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default BinStatusChart;