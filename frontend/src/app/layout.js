// src/app/layout.js
import './globals.css';
import { Inter } from 'next/font/google';
import AuthMiddleware from "@/components/AuthMiddleware";
import { AuthProvider } from "@/contexts/AuthContext";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'IEMSIS',
  description: 'Integrated Equipment Management System for Information Systems',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AuthMiddleware>
            {children}
          </AuthMiddleware>
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}