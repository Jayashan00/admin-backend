import React, { useState, useEffect } from 'react';
import {
    getAllAdminUsers,
    createAdminUser,
    deleteAdminUser,
    updateAdminUserRole
} from '../services/adminUserService';
import AdminUserForm from '../components/AdminUserForm.jsx';
import AdminUserEditModal from '../components/AdminUserEditModal.jsx';

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false); // Loading state for create form
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // User to edit
  const [editLoading, setEditLoading] = useState(false); // Loading state for edit modal

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAllAdminUsers();
      setUsers(response.data);
    } catch (err) {
      console.error("Error fetching admin users:", err);
      setError("Failed to load users. You may not have permission.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []); // Fetch on mount

  const handleCreateUser = async (userData) => {
    setFormLoading(true);
    setError('');
    try {
        await createAdminUser(userData);
        alert('User created successfully!');
        await fetchUsers(); // Refresh the list
        // Form fields are reset within AdminUserForm on success passed up
        return Promise.resolve(); // Indicate success to form
    } catch (err) {
        console.error("Error creating user:", err);
        const message = err.response?.data?.message || "Failed to create user.";
        setError(message); // Show specific error from backend if available
        alert(`Error: ${message}`);
        return Promise.reject(err); // Indicate failure to form
    } finally {
        setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) {
      setLoading(true); // Use main loading indicator for delete
      setError('');
      try {
        await deleteAdminUser(userId);
        alert('User deleted successfully!');
        await fetchUsers(); // Refresh list
      } catch (err) {
        console.error("Error deleting user:", err);
        const message = err.response?.status === 404 ? "User not found." : "Failed to delete user. Cannot delete the last Super Admin.";
        setError(message);
        alert(`Error: ${message}`);
        setLoading(false); // Ensure loading is turned off on error
      }
      // setLoading(false) is handled by fetchUsers on success
    }
  };

  const openEditModal = (user) => {
      setSelectedUser(user);
      setEditModalOpen(true);
  };

  const closeEditModal = () => {
      setEditModalOpen(false);
      setSelectedUser(null);
  };

  const handleSaveRole = async (userId, newRole) => {
      setEditLoading(true);
      setError('');
      try {
          await updateAdminUserRole(userId, newRole);
          alert('User role updated successfully!');
          closeEditModal();
          await fetchUsers(); // Refresh list
      } catch (err) {
           console.error("Error updating role:", err);
           const message = err.response?.data?.message || "Failed to update role.";
           setError(message); // Show error potentially inside modal or page
           alert(`Error: ${message}`);
           // Keep modal open on error? Or close? User decision.
           // closeEditModal();
      } finally {
          setEditLoading(false);
      }
  };


  return (
    <div className="page-container">
      <h2>Admin User Management</h2>
      {error && <p className="page-error" style={{color: 'red', marginBottom: '1rem'}}>{error}</p>}

      {/* Only show create form if not loading initial user list */}
       {!loading && <AdminUserForm onUserCreated={handleCreateUser} loading={formLoading} />}

      <h3>All Admin Users ({users.length})</h3>
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>User ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.role?.replace('ROLE_', '')}</td>
                <td>{user.id}</td>
                <td>
                  <button
                    className="btn-edit"
                    style={{ marginRight: '10px' }}
                    onClick={() => openEditModal(user)}
                    disabled={loading} // Disable if main list is loading
                  >
                    Edit Role
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteUser(user.id, user.username)}
                    disabled={loading} // Disable if main list is loading
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

       {/* Edit User Modal */}
       <AdminUserEditModal
           isOpen={editModalOpen}
           onRequestClose={closeEditModal}
           user={selectedUser}
           onSaveRole={handleSaveRole}
           loading={editLoading}
       />
    </div>
  );
}

export default AdminUsersPage;