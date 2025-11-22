import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useState } from 'react';
import { useNotification } from '../hooks/useNotification';
import Notification from '../components/Notification';

export default function Users() {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [selectedStatusChange, setSelectedStatusChange] = useState<{ user: any; newStatus: string } | null>(null);
  const [selectedUsersForBulk, setSelectedUsersForBulk] = useState<string[]>([]);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    displayName: '',
    department: '',
  });
  const [editUser, setEditUser] = useState({
    id: '',
    displayName: '',
    department: '',
    status: '',
    password: '',
  });
  const queryClient = useQueryClient();
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();

  const { data: users, refetch, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/users');
        return response.data;
      } catch (error: any) {
        console.error('Error fetching users:', error);
        throw error;
      }
    },
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return response.data;
    },
  });

  const handleAssignRole = async (userId: string, roleId: string) => {
    try {
      await api.post(`/admin/users/${userId}/roles/${roleId}`);
      refetch();
      showSuccess('Role assigned successfully');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to assign role');
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    if (!confirm('Are you sure you want to remove this role?')) {
      return;
    }
    try {
      await api.delete(`/admin/users/${userId}/roles/${roleId}`);
      refetch();
      showSuccess('Role removed successfully');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to remove role');
    }
  };

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await api.post('/users', userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateModal(false);
      setNewUser({ email: '', password: '', displayName: '', department: '' });
      showSuccess('User created successfully!');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to create user');
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!newUser.email || !newUser.password || !newUser.displayName) {
      showError('Please fill in all required fields');
      return;
    }
    
    if (newUser.password.length < 8) {
      showError('Password must be at least 8 characters long');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      showError('Please enter a valid email address');
      return;
    }
    
    createUserMutation.mutate(newUser);
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await api.patch(`/users/${userId}`, { status: newStatus });
      refetch();
      const statusMessages: Record<string, string> = {
        active: 'User activated successfully',
        suspended: 'User suspended successfully',
        deactivated: 'User deactivated successfully',
        pending: 'User status set to pending',
      };
      showSuccess(statusMessages[newStatus] || 'User status updated successfully');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleBulkActivate = async () => {
    if (selectedUsersForBulk.length === 0) {
      showWarning('Please select at least one user');
      return;
    }

    if (!confirm(`Activate ${selectedUsersForBulk.length} user(s)?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedUsersForBulk.map((userId) =>
          api.patch(`/users/${userId}`, { status: 'active' })
        )
      );
      refetch();
      const count = selectedUsersForBulk.length;
      setSelectedUsersForBulk([]);
      showSuccess(`${count} user(s) activated successfully`);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to activate users');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsersForBulk((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: any }) => {
      const response = await api.patch(`/users/${id}`, userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowEditModal(false);
      setEditUser({ id: '', displayName: '', department: '', status: '', password: '' });
      showSuccess('User updated successfully!');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to update user');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserToDelete(null);
      showSuccess('User deleted successfully!');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to delete user');
    },
  });

  const handleEditUser = (user: any) => {
    setEditUser({
      id: user.id,
      displayName: user.displayName,
      department: user.department || '',
      status: user.status,
      password: '',
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!editUser.displayName) {
      showError('Display name is required');
      return;
    }
    
    if (editUser.password && editUser.password.length < 8) {
      showError('Password must be at least 8 characters long');
      return;
    }
    
    const updateData: any = {
      displayName: editUser.displayName,
      department: editUser.department,
      status: editUser.status,
    };
    if (editUser.password) {
      updateData.password = editUser.password;
    }
    updateUserMutation.mutate({ id: editUser.id, userData: updateData });
  };

  const handleDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Users</h1>
        <div className="text-center py-8">Loading users...</div>
      </div>
    );
  }

  // Don't return early on error - show the UI with error message

  return (
    <div className="px-4 py-6 sm:px-0">
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          {users && (
            <p className="text-sm text-gray-500 mt-1">
              {users.length} total • {users.filter((u: any) => u.status === 'pending').length} pending • {users.filter((u: any) => u.status === 'active').length} active
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Create User
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-800">Error loading users: {(error as any)?.response?.data?.message || (error as any)?.message || 'Unknown error'}</p>
          <p className="text-sm text-red-600 mt-2">
            Make sure you have the admin role assigned. 
            <strong> Log out and log back in</strong> to refresh your token with the admin role.
          </p>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedUsersForBulk.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedUsersForBulk.length} user(s) selected
          </span>
          <div className="flex space-x-2">
            <button
              onClick={handleBulkActivate}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
            >
              Activate Selected
            </button>
            <button
              onClick={() => setSelectedUsersForBulk([])}
              className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {!users || users.length === 0 ? (
        <div className="bg-white shadow rounded-md p-8 text-center">
          <p className="text-gray-500">No users found.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {users?.map((user: any) => {
              const isSelected = selectedUsersForBulk.includes(user.id);
              
              return (
              <li key={user.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      {/* Checkbox for bulk selection (only show for pending users) */}
                      {user.status === 'pending' && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleUserSelection(user.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : user.status === 'suspended'
                              ? 'bg-red-100 text-red-800'
                              : user.status === 'deactivated'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">{user.department || 'No department'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Quick Status Actions */}
                      {user.status === 'pending' && (
                        <button
                          onClick={() => setSelectedStatusChange({ user, newStatus: 'active' })}
                          className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md border border-green-200"
                          title="Activate user"
                        >
                          ✓ Activate
                        </button>
                      )}
                      {user.status === 'active' && (
                        <>
                          <button
                            onClick={() => setSelectedStatusChange({ user, newStatus: 'suspended' })}
                            className="px-3 py-1 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-md border border-orange-200"
                            title="Suspend user"
                          >
                            ⚠ Suspend
                          </button>
                          <button
                            onClick={() => setSelectedStatusChange({ user, newStatus: 'deactivated' })}
                            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200"
                            title="Deactivate user"
                          >
                            ⊗ Deactivate
                          </button>
                        </>
                      )}
                      {user.status === 'suspended' && (
                        <>
                          <button
                            onClick={() => setSelectedStatusChange({ user, newStatus: 'active' })}
                            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md border border-green-200"
                            title="Reactivate user"
                          >
                            ✓ Reactivate
                          </button>
                          <button
                            onClick={() => setSelectedStatusChange({ user, newStatus: 'deactivated' })}
                            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200"
                            title="Deactivate user"
                          >
                            ⊗ Deactivate
                          </button>
                        </>
                      )}
                      {user.status === 'deactivated' && (
                        <button
                          onClick={() => setSelectedStatusChange({ user, newStatus: 'active' })}
                          className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md border border-green-200"
                          title="Reactivate user"
                        >
                          ✓ Reactivate
                        </button>
                      )}
                      <button
                        onClick={() => handleEditUser(user)}
                        className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200"
                        title="Edit user"
                      >
                        ✏ Edit
                      </button>
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200"
                        title="Manage roles"
                      >
                        👤 Roles
                      </button>
                      <button
                        onClick={() => setUserToDelete(user)}
                        className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md border border-red-200"
                        title="Delete user"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                {user.userRoles && user.userRoles.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2">
                      {user.userRoles.map((ur: any) => (
                        <span
                          key={ur.role.id}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                        >
                          {ur.role.name}
                          <button
                            onClick={() => handleRemoveRole(user.id, ur.role.id)}
                            className="ml-2 text-blue-600 hover:text-blue-900 font-bold"
                            title="Remove role"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </li>
            )
            })}
          </ul>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Manage Roles for {selectedUser.displayName}</h3>
            
            {/* Assigned Roles */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Assigned Roles</h4>
              {selectedUser.userRoles && selectedUser.userRoles.length > 0 ? (
                <div className="space-y-2">
                  {selectedUser.userRoles.map((ur: any) => (
                    <div
                      key={ur.role.id}
                      className="flex items-center justify-between px-4 py-2 bg-blue-50 border border-blue-200 rounded"
                    >
                      <span className="text-sm font-medium text-blue-900">{ur.role.name}</span>
                      <button
                        onClick={() => {
                          handleRemoveRole(selectedUser.id, ur.role.id);
                          setSelectedUser(null);
                        }}
                        className="text-red-600 hover:text-red-900 font-bold text-lg"
                        title="Remove role"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No roles assigned</p>
              )}
            </div>

            {/* Available Roles to Assign */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Available Roles</h4>
              {roles && Array.isArray(roles) && roles.length > 0 ? (
                <div className="space-y-2">
                  {roles
                    .filter((role: any) => 
                      !selectedUser.userRoles?.some((ur: any) => ur.role.id === role.id)
                    )
                    .map((role: any) => (
                      <button
                        key={role.id}
                        onClick={() => {
                          handleAssignRole(selectedUser.id, role.id);
                          setSelectedUser(null);
                        }}
                        className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
                      >
                        {role.name}
                      </button>
                    ))}
                  {roles.filter((role: any) => 
                    !selectedUser.userRoles?.some((ur: any) => ur.role.id === role.id)
                  ).length === 0 && (
                    <p className="text-sm text-gray-500">All roles are assigned</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No roles available</p>
              )}
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Create New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={newUser.displayName}
                  onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department (optional)</label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewUser({ email: '', password: '', displayName: '', department: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Edit User</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={editUser.displayName}
                  onChange={(e) => setEditUser({ ...editUser, displayName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={editUser.department}
                  onChange={(e) => setEditUser({ ...editUser, department: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={editUser.status}
                  onChange={(e) => setEditUser({ ...editUser, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="deactivated">Deactivated</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  minLength={8}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={editUser.password}
                  onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditUser({ id: '', displayName: '', department: '', status: '', password: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {selectedStatusChange && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Change User Status</h3>
            <p className="mb-4">
              Are you sure you want to change <strong>{selectedStatusChange.user.displayName}</strong>'s status from{' '}
              <span className="font-semibold">{selectedStatusChange.user.status}</span> to{' '}
              <span className="font-semibold">{selectedStatusChange.newStatus}</span>?
            </p>
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>Current Status:</strong> {selectedStatusChange.user.status.charAt(0).toUpperCase() + selectedStatusChange.user.status.slice(1)}
              </p>
              <p className="text-sm text-gray-600">
                <strong>New Status:</strong> {selectedStatusChange.newStatus.charAt(0).toUpperCase() + selectedStatusChange.newStatus.slice(1)}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  handleStatusChange(selectedStatusChange.user.id, selectedStatusChange.newStatus);
                  setSelectedStatusChange(null);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Confirm
              </button>
              <button
                onClick={() => setSelectedStatusChange(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Delete User</h3>
            <p className="mb-4">
              Are you sure you want to delete <strong>{userToDelete.displayName}</strong> ({userToDelete.email})?
              This action cannot be undone.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleDeleteUser}
                disabled={deleteUserMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

