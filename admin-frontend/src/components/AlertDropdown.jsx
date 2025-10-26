import React from 'react';
import './AlertDropdown.css'; // We'll create this CSS

function AlertDropdown({ alerts, error, onResolve, onClose }) {

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click target is outside the dropdown container
      // (This requires a ref on the container, adding complexity - skip for now)
      // A simpler approach is just closing when clicking resolve or a link
      // For a robust solution, you'd add a ref and check event.target
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]); // Dependency array includes onClose


  return (
    <div className="alert-dropdown">
      <div className="alert-dropdown-header">
        <h4>Active Alerts</h4>
        {/* Simple close button for now */}
        {/* <button onClick={onClose} className="alert-close-btn">&times;</button> */}
      </div>
      <div className="alert-dropdown-list">
        {error && <div className="alert-error">{error}</div>}
        {!error && alerts.length === 0 && <div className="no-alerts">No active alerts.</div>}
        {!error && alerts.map(alert => (
          <div key={alert.id} className={`alert-item alert-${alert.type?.toLowerCase().replace(/_/g, '-') || 'generic'}`}>
            <span className="alert-icon">⚠️</span>
            <div className="alert-content">
              <span className="alert-message">{alert.message}</span>
              <span className="alert-timestamp">{new Date(alert.timestamp).toLocaleString()}</span>
            </div>
            <button
              className="alert-resolve-btn"
              onClick={() => onResolve(alert.id)}
              title="Mark as Resolved"
            >
              ✓
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Need useEffect for click outside listener
import { useEffect } from 'react';

export default AlertDropdown;