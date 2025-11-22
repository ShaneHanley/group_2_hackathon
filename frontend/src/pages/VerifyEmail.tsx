import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('No verification token provided. Please check your email for the verification link.');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await api.get(`/auth/verify-email/${verificationToken}`);
      setStatus('success');
      setMessage(response.data.message || 'Email verified successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Email verified successfully! You can now sign in.' 
          } 
        });
      }, 3000);
    } catch (err: any) {
      setStatus('error');
      setError(
        err.response?.data?.message || 
        'Verification failed. The link may be invalid or expired.'
      );
    }
  };

  const handleResend = async () => {
    // This would need the user's email - for now, redirect to login
    navigate('/login', { 
      state: { 
        message: 'Please use the resend verification option after logging in, or contact support.' 
      } 
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>

        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
              <p className="font-semibold">✓ Verification Successful!</p>
              <p className="text-sm mt-1">{message}</p>
              <p className="text-sm mt-2">Redirecting to login page...</p>
            </div>
            <div className="mt-4 text-center">
              <Link
                to="/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Go to Login Now
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="font-semibold">Verification Failed</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600 text-center">
                Possible reasons:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>The verification link has expired (links expire after 7 days)</li>
                <li>The link has already been used</li>
                <li>The link is invalid or corrupted</li>
              </ul>
            </div>
            <div className="mt-6 space-y-2">
              <button
                onClick={handleResend}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Request New Verification Email
              </button>
              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

