import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useState } from 'react';
import { useNotification } from '../hooks/useNotification';
import Notification from '../components/Notification';

export default function Roles() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<any>(null);
  const [newRole, setNewRole] = useState({
    name: '',
    departmentScope: '',
    permissions: [] as string[],
  });
  const [editRole, setEditRole] = useState({
    id: '',
    name: '',
    departmentScope: '',
    permissions: [] as string[],
  });
  const [permissionInput, setPermissionInput] = useState('');
  const [editPermissionInput, setEditPermissionInput] = useState('');
  const queryClient = useQueryClient();
  const { notification, showSuccess, showError, hideNotification } = useNotification();

  const { data: roles, isLoading, error } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      try {
        const response = await api.get('/roles');
        return response.data;
      } catch (error: any) {
        console.error('Error fetching roles:', error);
        throw error;
      }
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async (roleData: any) => {
      const response = await api.post('/roles', roleData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowCreateModal(false);
      setNewRole({ name: '', departmentScope: '', permissions: [] });
      setPermissionInput('');
      showSuccess('Role created successfully!');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to create role');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, roleData }: { id: string; roleData: any }) => {
      const response = await api.patch(`/roles/${id}`, roleData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowEditModal(false);
      setEditRole({ id: '', name: '', departmentScope: '', permissions: [] });
      setEditPermissionInput('');
      showSuccess('Role updated successfully!');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to update role');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      await api.delete(`/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setRoleToDelete(null);
      showSuccess('Role deleted successfully!');
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to delete role');
    },
  });

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!newRole.name || newRole.name.trim() === '') {
      showError('Role name is required');
      return;
    }
    
    const roleData: any = {
      name: newRole.name.trim(),
    };
    if (newRole.departmentScope) {
      roleData.departmentScope = newRole.departmentScope.trim();
    }
    if (newRole.permissions.length > 0) {
      roleData.permissions = newRole.permissions;
    }
    createRoleMutation.mutate(roleData);
  };

  const handleUpdateRole = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!editRole.name || editRole.name.trim() === '') {
      showError('Role name is required');
      return;
    }
    
    const roleData: any = {};
    if (editRole.name) {
      roleData.name = editRole.name.trim();
    }
    if (editRole.departmentScope !== undefined) {
      roleData.departmentScope = editRole.departmentScope?.trim() || null;
    }
    if (editRole.permissions !== undefined) {
      roleData.permissions = editRole.permissions;
    }
    updateRoleMutation.mutate({ id: editRole.id, roleData });
  };

  const handleDeleteRole = () => {
    if (roleToDelete) {
      deleteRoleMutation.mutate(roleToDelete.id);
    }
  };

  const handleEditRole = (role: any) => {
    setEditRole({
      id: role.id,
      name: role.name,
      departmentScope: role.departmentScope || '',
      permissions: role.permissions || [],
    });
    setShowEditModal(true);
  };

  const addPermission = () => {
    if (permissionInput.trim()) {
      setNewRole({
        ...newRole,
        permissions: [...newRole.permissions, permissionInput.trim()],
      });
      setPermissionInput('');
    }
  };

  const removePermission = (index: number) => {
    setNewRole({
      ...newRole,
      permissions: newRole.permissions.filter((_, i) => i !== index),
    });
  };

  const addEditPermission = () => {
    if (editPermissionInput.trim()) {
      setEditRole({
        ...editRole,
        permissions: [...editRole.permissions, editPermissionInput.trim()],
      });
      setEditPermissionInput('');
    }
  };

  const removeEditPermission = (index: number) => {
    setEditRole({
      ...editRole,
      permissions: editRole.permissions.filter((_, i) => i !== index),
    });
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Roles</h1>
        <div className="text-center py-8">Loading roles...</div>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold text-gray-900">Roles</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Create Role
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-800">Error loading roles: {(error as any)?.response?.data?.message || (error as any)?.message || 'Unknown error'}</p>
        </div>
      )}

      {!roles || roles.length === 0 ? (
        <div className="bg-white shadow rounded-md p-8 text-center">
          <p className="text-gray-500">No roles found.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {roles?.map((role: any) => (
              <li key={role.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{role.name}</p>
                      {role.departmentScope && (
                        <p className="text-sm text-gray-500">Department: {role.departmentScope}</p>
                      )}
                      {role.permissions && role.permissions.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-2">
                            {role.permissions.map((perm: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded"
                              >
                                {perm}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {(!role.permissions || role.permissions.length === 0) && (
                        <p className="text-xs text-gray-400 mt-1">No permissions assigned</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 ml-4">
                      <button
                        onClick={() => handleEditRole(role)}
                        className="text-sm text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setRoleToDelete(role)}
                        className="text-sm text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Create New Role</h3>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Role Name *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="e.g., lab_manager"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department Scope (optional)</label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={newRole.departmentScope}
                  onChange={(e) => setNewRole({ ...newRole, departmentScope: e.target.value })}
                  placeholder="e.g., CS"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Permissions</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={permissionInput}
                    onChange={(e) => setPermissionInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addPermission();
                      }
                    }}
                    placeholder="e.g., book_equipment"
                  />
                  <button
                    type="button"
                    onClick={addPermission}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Add
                  </button>
                </div>
                {newRole.permissions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {newRole.permissions.map((perm, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                      >
                        {perm}
                        <button
                          type="button"
                          onClick={() => removePermission(idx)}
                          className="ml-2 text-blue-600 hover:text-blue-900 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={createRoleMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewRole({ name: '', departmentScope: '', permissions: [] });
                    setPermissionInput('');
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

      {/* Edit Role Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Edit Role</h3>
            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Role Name *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={editRole.name}
                  onChange={(e) => setEditRole({ ...editRole, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department Scope</label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={editRole.departmentScope}
                  onChange={(e) => setEditRole({ ...editRole, departmentScope: e.target.value })}
                  placeholder="Leave empty for global scope"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Permissions</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={editPermissionInput}
                    onChange={(e) => setEditPermissionInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addEditPermission();
                      }
                    }}
                    placeholder="e.g., book_equipment"
                  />
                  <button
                    type="button"
                    onClick={addEditPermission}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Add
                  </button>
                </div>
                {editRole.permissions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {editRole.permissions.map((perm, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                      >
                        {perm}
                        <button
                          type="button"
                          onClick={() => removeEditPermission(idx)}
                          className="ml-2 text-blue-600 hover:text-blue-900 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={updateRoleMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditRole({ id: '', name: '', departmentScope: '', permissions: [] });
                    setEditPermissionInput('');
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

      {/* Delete Role Confirmation Modal */}
      {roleToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Delete Role</h3>
            <p className="mb-4">
              Are you sure you want to delete the role <strong>{roleToDelete.name}</strong>?
              This action cannot be undone.
            </p>
            <p className="mb-4 text-sm text-red-600">
              Note: You cannot delete a role if it is assigned to any users. Remove all assignments first.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleDeleteRole}
                disabled={deleteRoleMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleteRoleMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setRoleToDelete(null)}
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

