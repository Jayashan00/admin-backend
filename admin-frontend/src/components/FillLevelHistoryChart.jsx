import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Function to generate simple simulated historical data for a bin
const generateSimulatedData = (binId, numPoints = 12) => { // Increased points for ~1 hour
  if (!binId) return []; // Return empty if no bin is selected

  const data = [];
  let currentLevel = Math.random() * 30; // Start at a lower random level
  const now = new Date();

  for (let i = numPoints - 1; i >= 0; i--) {
    // Simulate fill level change (tends to increase over time)
    currentLevel += (Math.random() * 7) - 1; // Random change, slight upward bias
    currentLevel = Math.max(0, Math.min(100, currentLevel)); // Clamp between 0-100

    // Simulate time (going back 5 minutes per data point)
    const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000);

    data.push({
      // Format time as HH:MM for X-axis label
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fillLevel: parseFloat(currentLevel.toFixed(1)), // Keep one decimal place
    });
  }
  return data;
};


function FillLevelHistoryChart({ bins }) {
  const [selectedBinId, setSelectedBinId] = useState('');
  const [chartData, setChartData] = useState([]);

  // Effect to automatically select the first bin when the component loads or bins change
  useEffect(() => {
    if (bins && bins.length > 0 && !selectedBinId) {
      // If no bin is selected yet, select the first one
      setSelectedBinId(bins[0].id);
    }
    // If a bin was selected, but it no longer exists in the 'bins' array (e.g., deleted)
    else if (selectedBinId && bins && !bins.find(b => b.id === selectedBinId)) {
        // Select the new first bin if available, otherwise clear selection
        setSelectedBinId(bins.length > 0 ? bins[0].id : '');
    }
  }, [bins, selectedBinId]); // Re-run this effect if the 'bins' array or 'selectedBinId' changes


  // Effect to regenerate the simulated chart data whenever the selected bin changes
  useEffect(() => {
    // Only generate data if a bin is actually selected
    if (selectedBinId) {
       setChartData(generateSimulatedData(selectedBinId));
    } else {
       setChartData([]); // Clear data if no bin is selected
    }
  }, [selectedBinId]); // Re-run this effect only when 'selectedBinId' changes

  // Handler for when the user selects a different bin from the dropdown
  const handleBinChange = (event) => {
    setSelectedBinId(event.target.value);
  };

  // Find the name of the currently selected bin for the chart legend
  const selectedBinName = bins.find(b => b.id === selectedBinId)?.name || 'N/A';

  return (
    <div style={{ width: '100%', height: 350 }}> {/* Container for the chart */}
      <h4>Simulated Fill Level History</h4>
      {/* Dropdown to select which bin's history to show */}
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="binSelect" style={{ marginRight: '0.5rem', fontSize: '0.9rem' }}>Select Bin:</label>
        <select id="binSelect" value={selectedBinId} onChange={handleBinChange} style={{ padding: '5px', fontSize: '0.9rem' }}>
          {/* Default option if no bins */}
          {bins.length === 0 && <option value="" disabled>No bins available</option>}
          {/* Map through available bins to create options */}
          {bins.map(bin => (
            <option key={bin.id} value={bin.id}>
              {/* Display bin name, or fallback to ID if name is missing */}
              {bin.name || bin.id}
            </option>
          ))}
        </select>
      </div>

      {/* Conditional rendering: Show chart or a message */}
      {chartData.length > 0 ? (
        <ResponsiveContainer>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }} // Adjust chart margins
          >
            <CartesianGrid strokeDasharray="3 3" /> {/* Dotted grid lines */}
            <XAxis dataKey="time" /> {/* Time labels on X-axis */}
            <YAxis domain={[0, 100]} unit="%" /> {/* Fill level (0-100%) on Y-axis */}
            <Tooltip formatter={(value) => [`${value}%`, `Fill Level`]} /> {/* Tooltip format */}
            <Legend /> {/* Show legend */}
            <Line
              type="monotone" // Smooth line
              dataKey="fillLevel" // Data key for the line
              name={`Bin: ${selectedBinName}`} // Dynamic legend name
              stroke="#8884d8" // Line color (purple)
              strokeWidth={2} // Line thickness
              activeDot={{ r: 6 }} // Make point bigger on hover/click
              dot={{ r: 3 }} // Show small dots on data points
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        // Message shown if no bin is selected or no bins exist
        <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
          {bins.length > 0 ? 'Select a bin to view simulated history.' : 'No bins to display history for.'}
        </div>
      )}
    </div>
  );
}

export default FillLevelHistoryChart;