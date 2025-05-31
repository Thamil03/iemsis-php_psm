"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    belumSelesai: 0,
    kiv: 0,
    dilupuskan: 0,
    selesai: 0,
    beradaDiUser: 0
  });
  const [equipmentStats, setEquipmentStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [currentTime, setCurrentTime] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [pendingResets, setPendingResets] = useState(0);
  const [showResetNotification, setShowResetNotification] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("http://157.230.245.190:3000/auth/session.php", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.loggedIn) {
          setCurrentUser(data.user);
        } else {
          window.location.href = "/";
        }
      } catch (err) {
        console.error("Session check failed:", err);
      }
    };

    const fetchEquipmentData = async () => {
      try {
        const res = await fetch(`http://157.230.245.190:3000/equipment/EquipmentController.php?action=fetch_all&year=${selectedYear}`);
        const items = await res.json();

        let belumSelesaiCount = 0;
        let kivCount = 0;
        let dilupuskanCount = 0;
        let selesaiCount = 0;
        let beradaDiUserCount = 0;
        const deviceMap = {};

        items.forEach((eq) => {
          const status = eq.status || "";
          const deviceType = eq.device || "Unknown";

          if (status === "Belum Selesai") belumSelesaiCount++;
          else if (status === "KIV") kivCount++;
          else if (status === "Dilupuskan") dilupuskanCount++;
          else if (status === "Selesai") selesaiCount++;
          else if (status === "Berada di User") beradaDiUserCount++;

          if (!deviceMap[deviceType]) {
            deviceMap[deviceType] = {
              type: deviceType,
              belumSelesai: 0,
              kiv: 0,
              dilupuskan: 0,
              selesai: 0,
              beradaDiUser: 0
            };
          }

          if (status === "Belum Selesai") deviceMap[deviceType].belumSelesai++;
          else if (status === "KIV") deviceMap[deviceType].kiv++;
          else if (status === "Dilupuskan") deviceMap[deviceType].dilupuskan++;
          else if (status === "Selesai") deviceMap[deviceType].selesai++;
          else if (status === "Berada di User") deviceMap[deviceType].beradaDiUser++;
        });

        setStats({
          belumSelesai: belumSelesaiCount,
          kiv: kivCount,
          dilupuskan: dilupuskanCount,
          selesai: selesaiCount,
          beradaDiUser: beradaDiUserCount
        });
        setEquipmentStats(Object.values(deviceMap));
      } catch (error) {
        console.error("Error fetching equipment data:", error);
      }
    };

    const fetchActivities = () => {
      setRecentActivities([
        { id: 1, type: "MAINTENANCE", content: "Desktop PC #SC-4528 serviced", timestamp: "10:45 AM", user: "Ahmad" },
        { id: 2, type: "NEW", content: "Printer repair request submitted", timestamp: "10:30 AM", user: "Sarah" },
        { id: 3, type: "UPDATE", content: "TSM OPEN", timestamp: "09:15 AM", user: "System" },
        { id: 4, type: "ALERT", content: "Network switch failure at HQ", timestamp: "08:45 AM", user: "System" },
      ]);
    };

    fetchSession();
    fetchEquipmentData();
    fetchActivities();

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedYear]);

  useEffect(() => {
    const checkPendingResets = async () => {
      try {
        const response = await fetch('http://157.230.245.190:3000/user/UserController.php?action=check_pending_resets', {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.count > 0 && user?.role === 'admin') {
          setPendingResets(data.count);
          setShowResetNotification(true);
        }
      } catch (error) {
        console.error('Error checking pending resets:', error);
      }
    };

    checkPendingResets();
    const interval = setInterval(checkPendingResets, 30000);
    return () => clearInterval(interval);
  }, [user?.role]);

  if (!currentUser) return <div className="text-center p-10">Loading dashboard...</div>;

  const ResetNotification = () => {
    if (!showResetNotification || user?.role !== 'admin') return null;

    return (
      <div className="fixed top-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-4 animate-fadeIn">
        <div>
          <p className="font-semibold">Password Reset Requests</p>
          <p>{pendingResets} pending request{pendingResets !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => {
            router.push('/admin?tab=reset-requests');
            setShowResetNotification(false);
          }}
          className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-50 transition-colors"
        >
          View Requests
        </button>
        <button
          onClick={() => setShowResetNotification(false)}
          className="text-white hover:text-blue-100"
        >
          <svg xmlns="https://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* 1) BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 bg-no-repeat bg-cover bg-center"
        style={{ backgroundImage: 'url("/images/pdrm.png")' }}
      />
      {/* 2) SEMI-TRANSPARENT GRADIENT OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 to-blue-800/60" />

      {/* 3) DASHBOARD CONTENT (z-10 so it appears on top) */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navigation />

        {/* HEADER */}
        <header className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto py-4 px-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="border p-1 rounded text-gray-800"
                >
                  {[2021, 2022, 2023, 2024, 2025].map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-gray-500">
                Last refreshed: {currentTime}
              </div>
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-grow p-6 bg-gray-100">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="bg-blue-900 text-white rounded-lg shadow-lg p-6 mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold mb-2">
                    Welcome, {currentUser?.name || "Officer"}
                  </h2>
                  <p className="text-blue-200">
                    PDRM Selangor ICT Equipment Maintenance System
                  </p>
                </div>
                <div className="bg-blue-800 px-4 py-2 rounded-lg text-sm">
                  <div>No Badan: {currentUser?.noBadan || "USER124"}</div>
                  <div>Role: {currentUser?.role || "Maintenance Staff"}</div>
                </div>
              </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              {/* Belum Selesai */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-600">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Belum Selesai</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-2">
                      {stats.belumSelesai}
                    </h3>
                  </div>
                  
                  <div className="bg-red-100 p-3 rounded-full">
                    <svg
                      xmlns="https://www.w3.org/2000/svg"
                      className="h-6 w-6 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  
                </div>
                <div className="mt-4">
                  <Link
                    href={`/equipment?year=${selectedYear}&status=Belum Selesai`}
                    className="text-sm text-blue-600 font-medium hover:text-blue-800"
                  >
                    View Belum Selesai →
                  </Link>
                </div>
              </div>

              {/* KIV */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Keep In View (KIV)</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-2">
                      {stats.kiv}
                    </h3>
                  </div>
                  
                  <div className="bg-green-100 p-3 rounded-full">
                    <svg
                      xmlns="https://www.w3.org/2000/svg"
                      className="h-6 w-6 text-purple-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/equipment?year=${selectedYear}&status=KIV`}
                    className="text-sm text-blue-600 font-medium hover:text-blue-800"
                  >
                    View KIV →
                  </Link>
                </div>
              </div>

              {/* Dilupuskan */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Dilupuskan</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-2">
                      {stats.dilupuskan}
                    </h3>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <svg
                      xmlns="https://www.w3.org/2000/svg"
                      className="h-6 w-6 text-yellow-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/equipment?year=${selectedYear}&status=Dilupuskan`}
                    className="text-sm text-blue-600 font-medium hover:text-blue-800"
                  >
                    View Dilupuskan →
                  </Link>
                </div>
              </div>

              {/* Selesai */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Selesai</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-2">
                      {stats.selesai}
                    </h3>
                  </div>
                  
                  <div className="bg-green-100 p-3 rounded-full">
                    <svg
                      xmlns="https://www.w3.org/2000/svg"
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/equipment?year=${selectedYear}&status=Selesai`}
                    className="text-sm text-blue-600 font-medium hover:text-blue-800"
                  >
                    View Selesai →
                  </Link>
                </div>
              </div>

              {/* Berada di User */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Berada di User</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-2">
                      {stats.beradaDiUser}
                    </h3>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <svg
                      xmlns="https://www.w3.org/2000/svg"
                      className="h-6 w-6 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5.121 17.804A9 9 0 1118.879 6.196 9 9 0 015.121 17.804zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/equipment?year=${selectedYear}&status=Berada di User`}
                    className="text-sm text-blue-600 font-medium hover:text-blue-800"
                  >
                    View →
                  </Link>
                </div>
              </div>
            </div>

            {/* Equipment Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {equipmentStats.map((equipment, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md">
                  <div className="border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-bold text-gray-800">
                      {equipment.type}
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-5 gap-4 text-center">
                      {/* Belum Selesai */}
                      <div className="p-3 rounded-lg bg-gray-50">
                        <p className="text-sm font-medium text-gray-500">Belum Selesai</p>
                        <p className="mt-2 text-xl font-bold text-green-600">
                          {equipment.belumSelesai}
                        </p>
                      </div>
                      {/* KIV */}
                      <div className="p-3 rounded-lg bg-gray-50">
                        <p className="text-sm font-medium text-gray-500">KIV</p>
                        <br></br>
                        <p className="mt-2 text-xl font-bold text-purple-500">
                          {equipment.kiv}
                        </p>
                      </div>
                      {/* Dilupuskan */}
                      <div className="p-3 rounded-lg bg-gray-50">
                        <p className="text-sm font-medium text-gray-500">Dilupuskan</p>
                        <br></br>
                        <p className="mt-2 text-xl font-bold text-yellow-500">
                          {equipment.dilupuskan}
                        </p>
                      </div>
                      {/* Selesai */}
                      <div className="p-3 rounded-lg bg-gray-50">
                        <p className="text-sm font-medium text-gray-500">Selesai</p>
                        <br></br>
                        <p className="mt-2 text-xl font-bold text-green-500">
                          {equipment.selesai}
                        </p>
                      </div>
                      {/* Berada di User */}
                      <div className="p-3 rounded-lg bg-gray-50">
                        <p className="text-sm font-medium text-gray-500">Berada di User</p>
                        <p className="mt-2 text-xl font-bold text-blue-500">
                          {equipment.beradaDiUser}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-600">
            <p>SERVING TECHNOLOGY BETTER</p>
            <p className="mt-1">
              &copy; {new Date().getFullYear()} PDRM Selangor ICT Equipment Maintenance System. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
      <ResetNotification />
    </div>
  );
}
