"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { showSuccessToast, showErrorToast, showInfoToast } from "@/utils/toast";

const STATUS_OPTIONS = [
  { value: "Belum Selesai", label: "Belum Selesai" },
  { value: "KIV", label: "KIV" },
  { value: "Dilupuskan", label: "Dilupuskan" },
  { value: "Selesai", label: "Selesai" },
  { value: "Berada di User", label: "Berada di User" }
];

export default function MaintenancePage() {
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    noResit: "",
    name: "",
    lokasi: "",
    bil: "",
    noSiri: "",
    noKewPA: "",
    noReport: "",
    tindakan: "",
    status: "",
    teknikal: "",
    tarikhSubmission: ""
  });

  useEffect(() => {
    fetchMaintenanceRecords();
  }, []);

  const fetchMaintenanceRecords = async () => {
    try {
      const response = await fetch("http://157.230.245.190:8000/backend/maintenance/fetch_all.php");
      const data = await response.json();
      setMaintenanceRecords(data);
    } catch (error) {
      console.error("Error fetching maintenance records:", error);
    }
  };

  const handleSearchSubmit = () => {
    showInfoToast(`Searching for: ${searchInput}`);
  };

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleNewRequest = () => {
    setEditingId(null);
    resetForm();
    setShowModal(true);
  };

  const handleUpdate = (item) => {
    setEditingId(item.id);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this maintenance record?")) {
      try {
        const response = await fetch(
          `http://157.230.245.190:8000/maintenance/MaintenanceController.php?action=delete&id=${id}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        const result = await response.json();

        if (result.success) {
          showSuccessToast("Maintenance record deleted successfully!");
          fetchMaintenanceRecords();
        } else {
          showErrorToast(result.message || "Failed to delete maintenance record");
        }
      } catch (error) {
        showErrorToast("An error occurred while deleting maintenance record");
        console.error("Error:", error);
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.noResit || !formData.name || !formData.bil) {
      showErrorToast("Please fill required fields (No. Resit, Name, BIL).");
      return;
    }

    const url = editingId
      ? `http://157.230.245.190:8000/backend/maintenance/update.php?id=${editingId}`
      : "http://157.230.245.190:8000/backend/maintenance/add.php";

    try {
      await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      showSuccessToast(editingId ? "Maintenance record updated!" : "New maintenance record added!");
      fetchMaintenanceRecords();
      resetForm();
      setEditingId(null);
      setShowModal(false);
    } catch (error) {
      console.error("Error saving maintenance record:", error);
      showErrorToast("Failed to save record. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      noResit: "",
      name: "",
      lokasi: "",
      bil: "",
      noSiri: "",
      noKewPA: "",
      noReport: "",
      tindakan: "",
      status: "",
      teknikal: "",
      tarikhSubmission: ""
    });
  };

  const handleCancel = () => {
    resetForm();
    setEditingId(null);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* NAVIGATION */}
      <Navigation />

      {/* HEADER */}
      <header className="text-grey py-4 border-b">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              MAINTENANCE RECORDS - IPK SELANGOR
            </h1>
            <p className="text-sm font-medium text-gray-800">
              Enter No. Resit / No. Siri / No. Kew PA / No. Report
            </p>
          </div>
          {/* SEARCH BAR */}
          <div className="flex items-center space-x-2 mt-3 md:mt-0">
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchInputChange}
              className="px-3 py-2 rounded-l border border-gray-300 text-gray-800 focus:outline-none"
              placeholder="e.g. RESIT-123"
            />
            <button
              onClick={handleSearchSubmit}
              className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-4 py-2 rounded-r"
            >
              Submit
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow p-6">
        <div className="max-w-7xl mx-auto bg-white rounded shadow p-6">
          {/* Title & Action */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              MAINTENANCE RECORDS
            </h2>
            <button
              onClick={handleNewRequest}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              New Request
            </button>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 uppercase">
                    No. Resit
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 uppercase">
                    Lokasi
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 uppercase">
                    BIL
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 uppercase">
                    No. Siri
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 uppercase">
                    No. Kew PA
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 uppercase">
                    No. Report
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 uppercase">
                    Tindakan
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 uppercase">
                    Teknikal
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 uppercase">
                    Tarikh Submission
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700 uppercase">
                    Operations
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {maintenanceRecords.length > 0 ? (
                  maintenanceRecords.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-700">{item.noResit}</td>
                      <td className="px-4 py-2 text-gray-700">{item.name}</td>
                      <td className="px-4 py-2 text-gray-700">{item.lokasi}</td>
                      <td className="px-4 py-2 text-gray-700">{item.bil}</td>
                      <td className="px-4 py-2 text-gray-700">{item.noSiri}</td>
                      <td className="px-4 py-2 text-gray-700">{item.noKewPA}</td>
                      <td className="px-4 py-2 text-gray-700">{item.noReport}</td>
                      <td className="px-4 py-2 text-gray-700">{item.tindakan}</td>
                      <td className="px-4 py-2 text-gray-700">{item.status}</td>
                      <td className="px-4 py-2 text-gray-700">{item.teknikal}</td>
                      <td className="px-4 py-2 text-gray-700">
                        {item.tarikhSubmission}
                      </td>
                      <td className="px-4 py-2 text-right space-x-3 flex items-center justify-end">
                        {/* Update Icon (Pencil) */}
                        <button
                          onClick={() => handleUpdate(item)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Update"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        {/* Delete Icon (Trash) */}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} className="px-4 py-2 text-center text-gray-500">
                      No maintenance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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

      {/* MODAL: New / Update Maintenance Request */}
      <div
        className={`
          fixed inset-0 z-50 flex items-center justify-center 
          transition-opacity duration-300
          ${showModal ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleCancel();
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div
          className={`
            relative bg-white w-full max-w-3xl mx-auto p-6 md:p-8 rounded-lg shadow-2xl
            transform transition-all duration-300
            ${showModal ? "scale-100" : "scale-95"}
          `}
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {editingId ? "Update Maintenance Record" : "New Maintenance Request"}
          </h3>

          {/* FORM FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* No Resit */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">No. Resit:</label>
              <input
                type="text"
                name="noResit"
                value={formData.noResit}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-800"
                placeholder="e.g. RESIT-123"
              />
            </div>
            {/* Name */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-800"
                placeholder="Officer Name"
              />
            </div>
            {/* Lokasi */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">Lokasi:</label>
              <input
                type="text"
                name="lokasi"
                value={formData.lokasi}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-800"
                placeholder="IPK Selangor"
              />
            </div>
            {/* BIL */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">BIL:</label>
              <input
                type="text"
                name="bil"
                value={formData.bil}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-800"
                placeholder="e.g. 3"
              />
            </div>
            {/* No. Siri */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">No. Siri:</label>
              <input
                type="text"
                name="noSiri"
                value={formData.noSiri}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-800"
                placeholder="SN-xxx"
              />
            </div>
            {/* No. Kew PA */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">No. Kew PA:</label>
              <input
                type="text"
                name="noKewPA"
                value={formData.noKewPA}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-800"
                placeholder="KEW-xxx"
              />
            </div>
            {/* No. Report */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">No. Report:</label>
              <input
                type="text"
                name="noReport"
                value={formData.noReport}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-800"
                placeholder="RPT-xxx"
              />
            </div>
            {/* Tindakan */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">Tindakan:</label>
              <input
                type="text"
                name="tindakan"
                value={formData.tindakan}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-800"
                placeholder="REPAIR / CHECK / etc."
              />
            </div>
            {/* Status */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">Status:</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-800"
              >
                <option value="">Select Status</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Teknikal */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">Teknikal:</label>
              <input
                type="text"
                name="teknikal"
                value={formData.teknikal}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-800"
                placeholder="TECH A"
              />
            </div>
            {/* Tarikh Submission */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">
                Tarikh Submission:
              </label>
              <input
                type="date"
                name="tarikhSubmission"
                value={formData.tarikhSubmission}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-800"
              />
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
