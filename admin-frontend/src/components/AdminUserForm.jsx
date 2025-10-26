import React, { useState } from 'react';

// Define roles (should match backend constants)
const ROLES = ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_OPERATOR"];

function AdminUserForm({ onUserCreated, loading }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(ROLES[2]); // Default to OPERATOR

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userData = { username, password, role };
    try {
        await onUserCreated(userData); // Pass data up to parent page
        // Reset form on success (parent should handle this based on success state)
        setUsername('');
        setPassword('');
        setRole(ROLES[2]);
    } catch (error) {
        // Error is usually handled/displayed in the parent component
        console.error("Form submission failed:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bin-form"> {/* Reuse styles */}
      <h3>Create New Admin User</h3>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        required
        disabled={loading}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password (min 6 chars)"
        required
        minLength={6} // Basic validation
        disabled={loading}
      />
      <select value={role} onChange={(e) => setRole(e.target.value)} disabled={loading}>
        {ROLES.map(r => (
          <option key={r} value={r}>{r.replace('ROLE_', '')}</option> // Display cleaner role name
        ))}
      </select>
      <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}

export default AdminUserForm;