import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define colors for each status (match the Pie chart where applicable)
const COLORS = {
  IDLE: '#2ecc71',         // Green
  EN_ROUTE: '#3498db',     // Blue
  COLLECTING: '#f39c12',  // Orange (Different from Filling Yellow)
  RETURNING: '#9b59b6',    // Purple
  MAINTENANCE: '#95a5a6'   // Grey
};

// Define the order and all possible statuses
const STATUS_ORDER = ['IDLE', 'EN_ROUTE', 'COLLECTING', 'RETURNING', 'MAINTENANCE'];

function TruckStatusChart({ trucks }) {
  // 1. Process truck data to count statuses
  const statusCounts = trucks.reduce((acc, truck) => {
    const status = truck.status || 'MAINTENANCE'; // Default if missing
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // 2. Format data for Recharts BarChart, ensuring all statuses are present in order
  const chartData = STATUS_ORDER.map(status => ({
    name: status,
    count: statusCounts[status] || 0, // Use count or 0
  }));

  // If no data, display a message
  if (trucks.length === 0) {
    return <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No truck status data available.</div>;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <h4>Truck Status Overview</h4>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{
            top: 5, right: 30, left: 0, bottom: 5, // Adjusted margins
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} /> {/* Ensure Y-axis shows whole numbers for counts */}
          <Tooltip formatter={(value, name) => [value, 'Trucks']} />
          <Legend />
          <Bar dataKey="count" name="Number of Trucks" fill="#8884d8">
             {/* Add individual colors to bars */}
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#bdc3c7'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Need to import Cell from recharts
import { Cell } from 'recharts';

export default TruckStatusChart;