'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      alert("Please enter your email.");
      return;
    }
    try {
      const res = await fetch('http://188.166.198.83:8001/auth/forgot_password.php', {
        method: 'POST',
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Password reset instructions have been sent to your email.');
      } else {
        setMessage('Failed to send password reset. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
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
              <h1 className="text-xl font-bold tracking-wide">FORGOT PASSWORD</h1>
              <p className="text-sm font-medium">PDRM SELANGOR CONTINGENT</p>
            </div>
          </div>
        </header>

        <main className="flex-grow flex items-center justify-center p-6">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
            <h2 className="text-xl font-semibold text-blue-800 mb-6">Reset Your Password</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your registered email"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md transition-colors"
              >
                Send Reset Link
              </button>
              {message && <p className="text-sm text-blue-700 font-medium">{message}</p>}
              <div className="text-center pt-4">
                <Link href="/" className="text-sm text-blue-600 hover:underline">
                  Back to Login
                </Link>
              </div>
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
