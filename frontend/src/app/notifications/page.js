"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { showSuccessToast, showErrorToast } from "@/utils/toast";

export default function NotificationsPage() {
  const [notificationsList, setNotificationsList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newNotification, setNewNotification] = useState({
    type: "",
    content: "",
    startTime: "",
    endTime: "",
  });

  const baseUrl =
    "https://iemsweb.online/notification/NotificationsController.php";

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(baseUrl, {
        method: "GET",
        credentials: "include",           // ← send cookies
      });
      const data = await response.json();
      setNotificationsList(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewNotification((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddNew = () => {
    setEditingId(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (notif) => {
    setEditingId(notif.id);
    setNewNotification({
      type: notif.type || "",
      content: notif.content || "",
      startTime: notif.startTime || "",
      endTime: notif.endTime || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this notification?"))
      return;
    try {
      const response = await fetch(baseUrl, {
        method: "POST",
        credentials: "include",           // ← send cookies
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          _method: "DELETE",
        }),
      });
      const data = await response.json();
      if (data.success) {
        showSuccessToast("Notification deleted successfully!");
        fetchNotifications();
      } else {
        showErrorToast("Failed to delete notification.");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      showErrorToast("Failed to delete notification.");
    }
  };

  const handleSave = async () => {
    if (!newNotification.type || !newNotification.content) {
      showErrorToast(
        "Please fill in Type and Content fields at minimum."
      );
      return;
    }
    if (!newNotification.startTime || !newNotification.endTime) {
      showErrorToast("Please select a start time and end time.");
      return;
    }

    try {
      const methodType = editingId ? "PUT" : "POST";
      const requestData = {
        ...newNotification,
        _method: methodType,
      };

      if (editingId) requestData.id = editingId;

      const response = await fetch(baseUrl, {
        method: "POST",
        credentials: "include",           // ← send cookies
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      const data = await response.json();
      if (data.success) {
        showSuccessToast("Notification saved successfully!");
        fetchNotifications();
        resetForm();
        setShowModal(false);
      } else {
        showErrorToast("Failed to save notification.");
      }
    } catch (error) {
      console.error("Error saving notification:", error);
      showErrorToast("Failed to save notification.");
    }
  };

  const handleCancel = () => {
    resetForm();
    setEditingId(null);
    setShowModal(false);
  };

  const resetForm = () => {
    setNewNotification({
      type: "",
      content: "",
      startTime: "",
      endTime: "",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navigation />

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-6">
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-sm text-gray-500">
            Manage notifications that will appear on the Home page.
          </p>
        </div>
      </header>

      <main className="flex-grow p-6">
        <div className="max-w-7xl mx-auto bg-white rounded shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Notifications List</h2>
            <button
              onClick={handleAddNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Add New
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 uppercase">
                    Content
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 uppercase">
                    Start Time
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 uppercase">
                    End Time
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {notificationsList.length > 0 ? (
                  notificationsList.map((notif) => (
                    <tr key={notif.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-700">{notif.type}</td>
                      <td className="px-4 py-2 text-gray-700">{notif.content}</td>
                      <td className="px-4 py-2 text-gray-700">{notif.startTime}</td>
                      <td className="px-4 py-2 text-gray-700">{notif.endTime}</td>
                      <td className="px-4 py-2 text-right flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(notif)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(notif.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-2 text-center text-gray-500">
                      No notifications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-600">
          <p>SERVING TECHNOLOGY BETTER</p>
          <p className="mt-1">
            &copy; {new Date().getFullYear()} PDRM Selangor ICT Equipment Maintenance
            System. All rights reserved.
          </p>
        </div>
      </footer>

      {/* MODAL OVERLAY + TRANSITIONS */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
          showModal ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCancel();
          }
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div
          className={`relative bg-white w-full max-w-xl mx-auto p-6 md:p-8 rounded-lg shadow-2xl transform transition-all duration-300 ${
            showModal ? "scale-100" : "scale-95"
          }`}
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {editingId ? "Edit Notification" : "Add Notification"}
          </h3>

          {/* FORM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TYPE */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">Type:</label>
              <select
                name="type"
                value={newNotification.type}
                onChange={handleInputChange}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
              >
                <option value="">Select Type</option>
                {["NEW", "ALERT", "UPDATE", "INFO"].map((t, idx) => (
                  <option key={idx} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* CONTENT */}
            <div className="flex flex-col md:col-span-2">
              <label className="mb-1 text-sm font-medium text-gray-800">Content:</label>
              <input
                type="text"
                name="content"
                value={newNotification.content}
                onChange={handleInputChange}
                placeholder="Notification message"
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
              />
            </div>

            {/* START TIME */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">Start Time:</label>
              <input
                type="datetime-local"
                name="startTime"
                value={newNotification.startTime}
                onChange={handleInputChange}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
              />
            </div>

            {/* END TIME */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">End Time:</label>
              <input
                type="datetime-local"
                name="endTime"
                value={newNotification.endTime}
                onChange={handleInputChange}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
              />
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}