import React from 'react';
import './KpiWidget.css'; // Import CSS for styling

// Simple component to display a single Key Performance Indicator (KPI)
function KpiWidget({ title, value, unit = '', icon = '📊' }) {
  return (
    <div className="kpi-widget">
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-content">
        <div className="kpi-value">{value}{unit}</div>
        <div className="kpi-title">{title}</div>
      </div>
    </div>
  );
}

export default KpiWidget;