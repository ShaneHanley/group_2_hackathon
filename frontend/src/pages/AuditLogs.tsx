import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function AuditLogs() {
  const { data: logs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const response = await api.get('/admin/audit');
      return response.data;
    },
  });

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Audit Logs</h1>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {logs?.map((log: any) => (
            <li key={log.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{log.action}</p>
                    <p className="text-sm text-gray-500">
                      {log.resourceType} {log.resourceId}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                    {log.ipAddress && (
                      <p className="text-xs text-gray-400">IP: {log.ipAddress}</p>
                    )}
                  </div>
                </div>
                {log.details && (
                  <div className="mt-2">
                    <pre className="text-xs bg-gray-50 p-2 rounded">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

