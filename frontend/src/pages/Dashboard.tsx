import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function Dashboard() {
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/admin/users');
      return response.data;
    },
    onError: (error: any) => {
      console.error('Error fetching users:', error);
    },
    retry: false, // Don't retry if it fails (likely permission issue)
  });

  const { data: roles, isLoading: rolesLoading, error: rolesError } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return response.data;
    },
    onError: (error: any) => {
      console.error('Error fetching roles:', error);
    },
  });

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      {usersError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
          <p className="text-yellow-800 font-semibold mb-2">
            ⚠️ Admin Access Required
          </p>
          <p className="text-yellow-700 text-sm mb-2">
            Your current session doesn't have admin privileges. To fix this:
          </p>
          <ol className="text-yellow-700 text-sm list-decimal list-inside space-y-1">
            <li>Click <strong>Logout</strong> in the top right</li>
            <li>Log back in with your admin account</li>
            <li>This will refresh your token with the admin role</li>
          </ol>
          <p className="text-yellow-600 text-xs mt-2">
            Note: Your admin role is assigned in the database, but your current JWT token was issued before the role was added.
          </p>
        </div>
      )}
      {rolesError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-800">Error loading roles. Please refresh the page.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {usersLoading ? '...' : (users?.length || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Roles</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {rolesLoading ? '...' : (roles?.length || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

