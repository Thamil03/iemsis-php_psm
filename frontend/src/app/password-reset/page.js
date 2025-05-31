'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PasswordReset() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if we have a token in the URL or from the login response
    const queryParams = new URLSearchParams(window.location.search);
    const urlToken = queryParams.get('token');
    
    // If we have a URL token, use that
    if (urlToken) {
      setResetToken(urlToken);
      return;
    }
    
    // Otherwise, check if this is a first login scenario (from session)
    // We'll make an API call to check if password reset is required for current session
    const checkResetStatus = async () => {
      try {
        const res = await fetch('http://188.166.198.83:8001/auth/check_reset_status.php', {
          method: 'GET',
          credentials: 'include', // Important to send cookies/session
        });
        
        const data = await res.json();
        if (data.reset_required && data.reset_token) {
          setResetToken(data.reset_token);
          setIsFirstLogin(true);
        } else if (!data.reset_required) {
          // No reset required, redirect to home
          router.push('/');
        }
      } catch (error) {
        console.error('Error checking reset status:', error);
        setMessage('Error checking reset status. Please try again.');
      }
    };
    
    checkResetStatus();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setMessage("Please fill in both fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (!resetToken) {
      setMessage('Invalid or missing reset token. Please try again.');
      return;
    }

    try {
      const res = await fetch('http://188.166.198.83:8001/auth/reset_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          token: resetToken, 
          new_password: password,
          is_first_login: isFirstLogin
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage('Password has been reset successfully!');
        setTimeout(() => {
          router.push('/'); // Redirect to home/login after success
        }, 2000);
      } else {
        setMessage(data.error || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error(error);
      setMessage('An error occurred. Please try again later.');
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="absolute inset-0 bg-no-repeat bg-cover bg-center" style={{ backgroundImage: 'url("/images/background.jpeg")' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 to-blue-800/60" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="bg-blue-900 text-white py-4 border-b border-blue-700">
          <div className="max-w-7xl mx-auto px-6 flex items-center space-x-4">
            <img src="/images/pdrm.png" alt="PDRM Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold tracking-wide">
                {isFirstLogin ? 'CREATE NEW PASSWORD' : 'RESET PASSWORD'}
              </h1>
              <p className="text-sm font-medium">PDRM SELANGOR CONTINGENT</p>
            </div>
          </div>
        </header>

        <main className="flex-grow flex items-center justify-center p-6">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
            <h2 className="text-xl font-semibold text-blue-800 mb-6">
              {isFirstLogin ? 'Create Your Password' : 'Create New Password'}
            </h2>
            {isFirstLogin && (
              <p className="text-gray-700 mb-4">
                Since this is your first login, you need to create a new password.
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm new password"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md transition-colors"
              >
                {isFirstLogin ? 'Create Password' : 'Reset Password'}
              </button>
              {message && (
                <div className={`mt-4 p-3 rounded ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message}
                </div>
              )}
            </form>
          </div>
        </main>

        <footer className="bg-blue-900 text-white py-4 border-t border-blue-700 text-center">
          <p className="font-medium">SERVING TECHNOLOGY BETTER</p>
          <p className="text-sm mt-1">&copy; {new Date().getFullYear()} PDRM Selangor. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}