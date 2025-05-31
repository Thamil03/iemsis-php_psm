'use client';
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { showSuccessToast, showErrorToast } from "@/utils/toast";

export default function Home() {
  const router = useRouter();
  const { login } = useAuth();

  const [currentTime, setCurrentTime] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [updates, setUpdates] = useState([]);
  const [searchNumber, setSearchNumber] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("http://152.42.242.10/iemsis-php/notifications/NotificationsController.php");
        const data = await res.json();
        const now = new Date();
        const activeNotifs = data.filter((n) => {
          const start = new Date(n.startTime);
          const end = new Date(n.endTime);
          return now >= start && now < end;
        });
        setUpdates(activeNotifs);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }, 1000);

    fetchNotifications();
    return () => clearInterval(timer);
  }, []);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setIsLoading(true);

  try {
    const result = await login(email, password);
    if (result.success) {
      if (result.first_login) {
        router.push('/password-reset');
      } else {
        router.push('/dashboard');
      }
    } else {
      // ✅ Show the actual reason returned by backend
      const errorMsg = result.reason || "Failed to sign in. Please check your credentials.";
      setError(errorMsg);
    }
  } catch (err) {
    setError("Failed to sign in. Please check your credentials.");
  } finally {
    setIsLoading(false);
  }
};

  const handleSearch = async () => {
    if (!searchNumber.trim()) return alert("Please enter a number to search.");
    try {
      const res = await fetch(`http://152.42.242.10/iemsis-php/equipment/EquipmentController.php?search=${searchNumber}`);
      const data = await res.json();

      // Filter results for exact matches when searching by No. Resit
      let filteredData = data;
      if (/^\d{4}$/.test(searchNumber)) {
        filteredData = data.filter(item => item.noResit === searchNumber);
      }

      if (filteredData.length > 0) {
        setSearchResult(filteredData);
        setIsModalOpen(true);
      } else {
        alert("No equipment found.");
        setSearchResult(null);
      }
    } catch (error) {
      console.error("Search Error:", error);
      alert("Error searching equipment.");
    }
  };

  // Close the modal when clicking outside or pressing escape
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, []);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('http://152.42.242.10/IEMSIS-PHP/user/UserController.php?action=forgot_password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });
      const data = await response.json();
      if (data.error) {
        showErrorToast(data.error);
      } else {
        showSuccessToast(data.message);
        setShowForgotPasswordModal(false);
        setForgotPasswordEmail("");
      }
    } catch (error) {
      showErrorToast('Failed to submit password reset request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* background and overlay */}
      <div className="absolute inset-0 bg-no-repeat bg-cover bg-center" style={{ backgroundImage: 'url("/images/background.jpeg")' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 to-blue-800/60" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="bg-blue-900 text-white py-4 border-b border-blue-700">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/images/pdrm.png" alt="PDRM Logo" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-xl font-bold tracking-wide">EQUIPMENT MAINTENANCE SYSTEM</h1>
                <p className="text-sm font-medium">PDRM SELANGOR CONTINGENT</p>
              </div>
            </div>
            <div className="bg-blue-800 px-4 py-2 rounded-lg shadow-inner">
              <span className="text-sm font-medium">{currentTime}</span>
            </div>
          </div>
        </header>

        <main className="flex-grow flex items-center justify-center py-8 px-6">
          <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8">
            {/* LEFT PANEL */}
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
              <div className="bg-blue-800 px-6 py-4 text-white">
                <h2 className="text-lg font-semibold">System Access</h2>
              </div>
              <div className="p-6">
                {/* Search Box */}
                <div className="bg-gray-100 p-5 rounded-lg mb-6">
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Enter No. Resit / No. Siri / No. Kew PA / No. Report:
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      className="flex-grow px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter No"
                      value={searchNumber}
                      onChange={(e) => setSearchNumber(e.target.value)}
                    />
                    <button
                      onClick={handleSearch}
                      className="ml-2 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                    >
                      Submit
                    </button>
                  </div>
                </div>

                {/* Login Form */}
                <form className="space-y-5" onSubmit={handleSubmit}>
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                      <span className="block sm:inline">{error}</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">Email:</label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-bold text-gray-800 mb-2">Password:</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md"
                    >
                      Login
                    </button>
                  </div>
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => setShowForgotPasswordModal(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* RIGHT PANEL (Notifications) */}
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col">
              <div className="bg-blue-800 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">TSM (IT) Updates</h2>
                  <span className="text-xs bg-blue-700 px-2 py-1 rounded">
                    Updated Every: 30 Seconds
                  </span>
                </div>
              </div>

              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                {/* Logo / Title */}
                <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg p-6 order-2 md:order-1">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-blue-800">TSM (IT)</h3>
                    <p className="text-sm text-blue-700">IPK SELANGOR</p>
                  </div>
                  <div className="w-32 h-32 relative mb-6">
                    <div className="absolute inset-0 bg-blue-800 rounded-full opacity-10 animate-pulse" />
                    <img
                      src="/images/pdrm.png"
                      alt="PDRM Logo"
                      className="w-full h-full object-contain relative z-10"
                    />
                  </div>
                </div>

                {/* Updates List */}
                <div className="order-1 md:order-2">
                  {updates.length > 0 ? (
                    updates.map((item) => (
                      <div key={item.id} className="bg-gray-100 rounded-lg p-4 mb-4">
                        {/* header row: type + timestamp */}
                        <div className="flex justify-between items-center mb-2">
                          <span
                            className={`font-bold ${item.type === "NEW" || item.type === "ALERT"
                              ? "text-red-700"
                              : "text-blue-700"
                              }`}
                          >
                            {item.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(item.startTime)}
                          </span>
                        </div>

                        {/* content */}
                        <div className="text-gray-900">
                          {item.content}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="text-blue-700 font-bold mb-2">No Updates</div>
                      <div className="text-gray-900">
                        There are currently no active notifications.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-blue-900 text-white py-4 border-t border-blue-700 text-center">
          <p className="font-medium">SERVING TECHNOLOGY BETTER</p>
          <p className="text-sm mt-1">&copy; {new Date().getFullYear()} PDRM Selangor. All rights reserved.</p>
        </footer>
      </div>

      {/* Search Results Modal */}
      {isModalOpen && searchResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Transparent backdrop that still captures clicks */}
          <div
            className="absolute inset-0 bg-transparent"
            onClick={() => setIsModalOpen(false)}
          ></div>

          {/* Modal content with enhanced shadow */}
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-auto text-gray-800">
            <div className="bg-blue-800 px-6 py-4 text-white flex justify-between items-center sticky top-0">
              <h3 className="text-lg font-bold">Search Results</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white text-2xl hover:text-gray-200 focus:outline-none"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {Array.isArray(searchResult) ? (
                searchResult.map((item, index) => (
                  <div
                    key={index}
                    className="mb-6 pb-6 border-b border-gray-200 last:border-0"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left column */}
                      <div className="space-y-2">
                        <p><strong>No. Resit:</strong> {item.noResit}</p>
                        <p><strong>Nama:</strong> {item.name}</p>
                        <p>
                          <strong>Lokasi Cawangan:</strong>{" "}
                          {item.branch}, {item.location}
                        </p>
                        <p><strong>Nama Peralatan:</strong> {item.deviceName}</p>
                        <p><strong>No. Siri:</strong> {item.noSiri}</p>
                        <p><strong>No. Kew PA:</strong> {item.noKewPA}</p>
                        <p><strong>Masalah:</strong> {item.problem}</p>
                      </div>

                      {/* Right column */}
                      <div className="space-y-2">
                        <p><strong>No. Report:</strong> {item.noReport}</p>
                        <p><strong>Tindakan:</strong> {item.actionTaken || "None"}</p>
                        <p>
                          <strong>Status:</strong>{" "}
                          <span
                            className={`font-medium ${
                              item.status === "Selesai" ? "text-green-600" : 
                              item.status === "Belum Selesai" ? "text-red-600" : 
                              item.status === "KIV" ? "text-red-600" :
                              item.status === "Dilupuskan" ? "text-yellow-600" :
                              item.status === "Berada di User" ? "text-blue-600" :
                              "text-gray-600"
                            }`}
                          >
                            {item.status}
                          </span>
                        </p>
                        <p><strong>Technician:</strong> {item.technician}</p>
                        <p><strong>Tarikh Selesai:</strong> {item.submissionDate}</p>
                        <p><strong>Tarikh Keluar (User Ambil):</strong> {item.exitDate}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                /* single-object case */
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p><strong>No. Resit:</strong> {searchResult.noResit}</p>
                      <p><strong>Nama:</strong> {searchResult.name}</p>
                      <p>
                        <strong>Lokasi Cawangan:</strong>{" "}
                        {searchResult.branch}, {searchResult.location}
                      </p>
                      <p><strong>Nama Peralatan:</strong> {searchResult.deviceName}</p>
                      <p><strong>No. Siri:</strong> {searchResult.noSiri}</p>
                      <p><strong>No. Kew PA:</strong> {searchResult.noKewPA}</p>
                      <p><strong>Masalah:</strong> {searchResult.problem}</p>
                    </div>
                    <div className="space-y-2">
                      <p><strong>No. Report:</strong> {searchResult.noReport}</p>
                      <p><strong>Tindakan:</strong> {searchResult.actionTaken || "None"}</p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <span
                          className={`font-medium ${
                            searchResult.status === "Selesai" ? "text-green-600" :
                            searchResult.status === "Belum Selesai" ? "text-red-600" :
                            searchResult.status === "KIV" ? "text-red-600" :
                            searchResult.status === "Dilupuskan" ? "text-yellow-600" :
                            searchResult.status === "Berada di User" ? "text-blue-600" :
                            "text-gray-600"
                          }`}
                        >
                          {searchResult.status}
                        </span>
                      </p>
                      <p><strong>Technician:</strong> {searchResult.technician}</p>
                      <p><strong>Tarikh Selesai:</strong> {searchResult.submissionDate}</p>
                      <p>
                        <strong>Tarikh Keluar (User Ambil):</strong>{" "}
                        {searchResult.startTime}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowForgotPasswordModal(false)}></div>
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg relative z-10 border border-gray-200 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Forgot Password</h2>
              <button 
                onClick={() => setShowForgotPasswordModal(false)} 
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <svg xmlns="https://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleForgotPassword}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Enter your email address:
                </label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}