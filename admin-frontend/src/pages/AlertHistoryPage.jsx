import React, { useState, useEffect } from 'react';
import { getResolvedAlerts } from '../services/alertService';
import { useSortableData } from '../hooks/useSortableData'; // Reuse sorting hook

// Optional: Add specific CSS if needed
// import './AlertHistoryPage.css';

function AlertHistoryPage() {
  const [resolvedLogs, setResolvedLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Use sorting hook, default sort by timestamp descending
  const { items: sortedLogs, requestSort, getClassNamesFor } = useSortableData(resolvedLogs, { key: 'timestamp', direction: 'descending' });

  // Fetch resolved logs when the component mounts
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getResolvedAlerts();
        setResolvedLogs(response.data || []); // Ensure logs is an array
      } catch (err) {
        console.error("Error fetching resolved alerts:", err);
        setError("Failed to load alert history. You may not have permission.");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []); // Fetch only on mount

  // Helper function to format timestamp string into a readable format
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
        const date = new Date(timestamp);
        // Format using locale-specific options for better readability
        return date.toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric', // e.g., Oct 24, 2025
            hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true // e.g., 10:30:15 AM
        });
    } catch (e) {
        console.error("Error formatting timestamp:", timestamp, e);
        return timestamp; // Fallback
    }
  };


  return (
    <div className="page-container"> {/* Use standard page container */}
      <h2>Resolved Alert History</h2>
      {error && <p style={{ color: 'var(--danger-color)' }}>{error}</p>}

      {loading && !error && <p>Loading alert history...</p>}
      {!loading && !error && sortedLogs.length === 0 && <p>No resolved alerts found.</p>}
      {!loading && !error && sortedLogs.length > 0 && (
        // Wrapper div to allow horizontal scrolling on smaller screens
        <div style={{ overflowX: 'auto' }}>
            <table className="data-table"> {/* Use standard data table styles */}
              <thead>
                <tr>
                  {/* Add sorting controls to table headers */}
                  <th onClick={() => requestSort('timestamp')} className={getClassNamesFor('timestamp')}>Timestamp</th>
                  <th onClick={() => requestSort('type')} className={getClassNamesFor('type')}>Type</th>
                  <th onClick={() => requestSort('message')} className={getClassNamesFor('message')}>Message</th>
                  <th onClick={() => requestSort('relatedEntityId')} className={getClassNamesFor('relatedEntityId')}>Related ID</th>
                  {/* No 'Actions' column needed for history */}
                </tr>
              </thead>
              <tbody>
                {/* Map over the sorted log entries */}
                {sortedLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatTimestamp(log.timestamp)}</td>
                     {/* Make type more readable */}
                    <td>{log.type?.replace(/_/g, ' ') || 'N/A'}</td>
                     {/* Prevent overly long messages, add tooltip for full message */}
                    <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.message}>
                        {log.message}
                    </td>
                    <td>{log.relatedEntityId || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      )}
    </div>
  );
}

export default AlertHistoryPage;