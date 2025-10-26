import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';

// Define roles (should match backend constants)
const ROLES = ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_OPERATOR"];

function AdminUserEditModal({ isOpen, onRequestClose, user, onSaveRole, loading }) {
  const [selectedRole, setSelectedRole] = useState('');

  // Update state when the selected user changes
  useEffect(() => {
    if (user) {
      setSelectedRole(user.role || ROLES[2]); // Default to OPERATOR if role is missing
    }
  }, [user]); // Re-run effect when 'user' prop changes

  const handleSave = (e) => {
      e.preventDefault();
      if (user) {
          onSaveRole(user.id, selectedRole); // Pass ID and new role up
      }
  };

  // If no user is selected, don't render the modal content (or show loading)
  if (!user) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Edit User Role"
      // Ensure modal styles from App.css apply
    >
      <div className="modal-header">
        <h2>Edit Role: {user.username}</h2>
        <button className="modal-close-btn" onClick={onRequestClose} disabled={loading}>&times;</button>
      </div>
      <form className="modal-form" onSubmit={handleSave}>
        <label>
          Role:
          <select
             value={selectedRole}
             onChange={(e) => setSelectedRole(e.target.value)}
             disabled={loading}
          >
            {ROLES.map(r => (
              <option key={r} value={r}>{r.replace('ROLE_', '')}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={loading}>
           {loading ? 'Saving...' : 'Save Role'}
        </button>
      </form>
    </Modal>
  );
}

export default AdminUserEditModal;