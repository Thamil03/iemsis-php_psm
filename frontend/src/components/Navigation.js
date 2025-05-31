"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("https://dolphin-app-gllbf.ondigitalocean.app/iemsis-php/auth/session.php", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.loggedIn) {
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error("Error fetching user session:", err);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("https://dolphin-app-gllbf.ondigitalocean.app/iemsis-php/auth/logout.php", {
        method: "POST",
        credentials: "include",
      });
      setCurrentUser(null);
      setTimeout(() => {
        router.push("/");
      }, 100);
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const isActive = (href) => (pathname === href ? "bg-blue-800" : "");

  return (
    <nav className="bg-blue-900 text-white border-b border-blue-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="flex-shrink-0">
              <Image
                src="/images/pdrm.png"
                alt="Logo"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </Link>

            <Link
              href="/dashboard"
              className="flex-shrink-0 text-xl font-bold tracking-wide leading-5"
            >
              PDRM SELANGOR
              <span className="block text-xs font-medium text-blue-300">
                ICT Equipment Maintenance
              </span>
            </Link>

            <div className="hidden md:block">
              <div className="ml-6 flex items-baseline space-x-2">
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-blue-800 ${isActive("/dashboard")}`}
                >
                  Home
                </Link>
                {currentUser && (
                  <>
                    <Link
                      href="/equipment"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-blue-800 ${isActive("/equipment")}`}
                    >
                      Equipment
                    </Link>
                    <Link
                      href="/reports"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-blue-800 ${isActive("/reports")}`}
                    >
                      Reports
                    </Link>
                    <Link
                      href="/notifications"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-blue-800 ${isActive("/notifications")}`}
                    >
                      Notifications
                    </Link>

                    {/* only show Admin if the user is an admin */}
                    {currentUser.role === "admin" && (
                      <Link
                        href="/admin"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-blue-800 ${isActive("/admin")}`}
                      >
                        Admin
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {currentUser && (
                <div className="mr-4 py-1 px-3 bg-blue-800 rounded-full text-xs font-medium">
                  <span className="text-blue-300">User:</span> {currentUser.name || currentUser.email}
                </div>
              )}
              {currentUser ? (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-md text-sm font-medium border border-blue-700 hover:bg-blue-800 transition-colors duration-200"
                >
                  Logout
                </button>
              ) : (
                <div className="flex space-x-3">
                  {/* Login/Register if needed */}
                </div>
              )}
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-800 focus:outline-none transition-colors duration-200"
            >
              <svg className={`${isMenuOpen ? "hidden" : "block"} h-6 w-6`} xmlns="https://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg className={`${isMenuOpen ? "block" : "hidden"} h-6 w-6`} xmlns="https://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? "block" : "hidden"} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-blue-800">
          {currentUser && (
            <div className="px-3 py-2 text-sm font-medium text-blue-300">
              <span>Logged in as:</span>
              <span className="block font-bold text-white">{currentUser.name || currentUser.email}</span>
            </div>
          )}

          <Link href="/dashboard" className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800 transition-colors duration-200 ${isActive("/dashboard")}`}>Home</Link>

          {currentUser && (
            <>
              <Link href="/equipment" className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800 transition-colors duration-200 ${isActive("/equipment")}`}>Equipment</Link>
              <Link href="/maintenance" className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800 transition-colors duration-200 ${isActive("/maintenance")}`}>Maintenance</Link>
              <Link href="/reports" className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800 transition-colors duration-200 ${isActive("/reports")}`}>Reports</Link>
              <Link href="/notifications" className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800 transition-colors duration-200 ${isActive("/notifications")}`}>Notifications</Link>

              {currentUser.role === "admin" && (
                <div className="space-y-1">
                  <Link
                    href="/admin/users"
                    className={`block px-4 py-2 text-sm ${
                      pathname === "/admin/users"
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Users
                  </Link>
                  <Link
                    href="/admin/logs"
                    className={`block px-4 py-2 text-sm ${
                      pathname === "/admin/logs"
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    System Logs
                  </Link>
                </div>
              )}
            </>
          )}

          {currentUser ? (
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800 transition-colors duration-200"
            >Logout</button>
          ) : (
            <>
              <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800 transition-colors duration-200">Login</Link>
              <Link href="/register" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800 transition-colors duration-200">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
