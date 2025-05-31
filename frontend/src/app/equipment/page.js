"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import { showSuccessToast, showErrorToast } from "@/utils/toast";

const currentYear = new Date().getFullYear().toString();

const STATUS_OPTIONS = [
  { value: "Belum Selesai", label: "Belum Selesai" },
  { value: "KIV", label: "KIV" },
  { value: "Dilupuskan", label: "Dilupuskan" },
  { value: "Selesai", label: "Selesai" },
  { value: "Berada di User", label: "Berada di User" }
];

export default function EquipmentPage() {
  // Equipment list + loading
  const [equipmentList, setEquipmentList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search + pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("");
  const itemsPerPage = 10;

  // Form state (add/edit)
  const [newDevice, setNewDevice] = useState({
    year: currentYear,        // default to current year
    bil: "",                  // will be fetched
    noResit: "",
    tarikhDiresit: "",
    name: "",
    location: "",
    branch: "",
    device: "",
    deviceName: "",
    noSiri: "",              // Optional
    noKewPA: "",             // Optional
    problem: "",
    noReport: "",            // Optional
    actionTaken: "",
    status: "",
    technician: "",
    tempohWarranty: "",
    submissionDate: "",
    exitDate: "",
    // Add custom input fields
    customLocation: "",
    customBranch: "",
    customDevice: "",
    customDeviceName: "",
    customProblem: "",
    customTechnician: "",
  });

  // Error state
  const [errors, setErrors] = useState({});

  // Modal flags
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdateEquipment, setStatusUpdateEquipment] = useState(null);
  const [newStatusValue, setNewStatusValue] = useState("");

  // Year filter + dropdowns
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [dropdowns, setDropdowns] = useState({});

  const equipmentBaseUrl =
    "http://152.42.242.10/iemsis-php/equipment/EquipmentController.php";

  // Read URL parameters on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const year = params.get('year');
    const status = params.get('status');
    
    if (year) {
      setSelectedYear(year);
    }
    if (status) {
      setSelectedStatus(status);
    }
  }, []);

  // 1) Fetch next BIL whenever Add-New opens or year changes
  useEffect(() => {
    if (showModal && editingId === null && newDevice.year) {
      console.log('Fetching next BIL for year:', newDevice.year);
      fetch(`${equipmentBaseUrl}?action=getNextBil&year=${newDevice.year}`)
        .then((res) => res.json())
        .then((data) => {
          console.log('Received BIL data:', data);
          const next = data.nextBil;
          if (next != null) {
            console.log('Setting BIL to:', next);
            setNewDevice((d) => ({ ...d, bil: String(next) }));
          } else {
            console.error('No BIL value received from server');
          }
        })
        .catch((error) => {
          console.error('Error fetching next BIL:', error);
        });
    }
  }, [showModal, editingId, newDevice.year]);

  // 2) Reload list when selectedYear, searchTerm, or selectedStatus change
  useEffect(() => {
    setCurrentPage(1);
    fetchEquipment();
  }, [selectedYear, searchTerm, selectedStatus]);

  // 3) Load dropdown options once
  useEffect(() => {
    fetchDropdownOptions();
  }, []);

  // Fetch equipment
  async function fetchEquipment() {
    setIsLoading(true);
    try {
      const url = `${equipmentBaseUrl}?year=${selectedYear}&search=${encodeURIComponent(
        searchTerm
      )}&status=${encodeURIComponent(selectedStatus)}`;
      const res = await fetch(url);
      const data = await res.json();
      
      // Filter results for exact matches when searching by No. Resit
      let filteredData = data;
      if (searchTerm && /^\d{4}$/.test(searchTerm)) {
        filteredData = data.filter(item => item.noResit === searchTerm);
      }
      
      // Sort the data by BIL number
      filteredData.sort((a, b) => parseInt(a.bil) - parseInt(b.bil));
      
      setEquipmentList(filteredData);
    } catch (e) {
      console.error("Fetch equipment error", e);
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch dropdowns
  async function fetchDropdownOptions() {
    try {
      const res = await fetch(`${equipmentBaseUrl}?action=fetch_dropdowns`);
      const data = await res.json();
      setDropdowns(data);
    } catch (e) {
      console.error("Fetch dropdowns error", e);
    }
  }

  // Validation rules
  const validateField = (name, value) => {
    switch (name) {
      case 'noResit':
        if (value.trim() === '') return 'No. Resit is required';
        if (!/^\d{4}$/.test(value)) return 'No. Resit must be exactly 4 digits';
        return '';
      case 'name':
        return value.trim() === '' ? 'Nama is required' : '';
      case 'location':
        return value === '' ? 'Lokasi is required' : 
               value === 'Lain-Lain' && !newDevice.customLocation ? 'Custom location is required' : '';
      case 'branch':
        return value === '' ? 'Cawangan is required' :
               value === 'Lain-Lain' && !newDevice.customBranch ? 'Custom branch is required' : '';
      case 'device':
        return value === '' ? 'Peralatan is required' :
               value === 'Lain-Lain' && !newDevice.customDevice ? 'Custom device is required' : '';
      case 'deviceName':
        return value === '' ? 'Nama Peralatan is required' :
               value === 'Lain-Lain' && !newDevice.customDeviceName ? 'Custom device name is required' : '';
      case 'problem':
        return value === '' ? 'Masalah is required' :
               value === 'Lain-Lain' && !newDevice.customProblem ? 'Custom problem is required' : '';
      case 'technician':
        return value === '' ? 'Technician is required' :
               value === 'Lain-Lain' && !newDevice.customTechnician ? 'Custom technician is required' : '';
      case 'status':
        return value === '' ? 'Status is required' : '';
      case 'tarikhDiresit':
        return value === '' ? 'Tarikh Diresit is required' : '';
      default:
        return '';
    }
  };

  // Form field change with validation
  function handleInputChange(e) {
    const { name, value } = e.target;
    
    // Special handling for No. Resit
    if (name === 'noResit') {
      // Only allow numbers and limit to 4 digits
      const numericValue = value.replace(/[^\d]/g, '').slice(0, 4);
      setNewDevice((d) => ({ ...d, [name]: numericValue }));
    } else {
      setNewDevice((d) => ({ ...d, [name]: value }));
    }
    
    // Validate field
    const error = validateField(name, name === 'noResit' ? value.replace(/[^\d]/g, '').slice(0, 4) : value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }

  // Handle dropdown change with validation
  function handleDropdownChange(e) {
    const { name, value } = e.target;
    setNewDevice((d) => ({ 
      ...d, 
      [name]: value,
      // Clear custom input if not "Lain-Lain"
      [`custom${name.charAt(0).toUpperCase() + name.slice(1)}`]: value === "Lain-Lain" ? d[`custom${name.charAt(0).toUpperCase() + name.slice(1)}`] : ""
    }));

    // Validate field
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }

  // Open Add-New
  function handleAddNew() {
    resetForm();
    setEditingId(null);
    setNewDevice(prev => ({ ...prev, year: selectedYear }));
    setShowModal(true);
  }

  // Open Edit
  function handleEdit(item) {
    console.log("Editing item:", item);
    setEditingId(item.id);
    // Ensure all fields are properly set, including empty strings for undefined values
    setNewDevice({
      year: item.year || currentYear,
      bil: item.bil || "",
      noResit: item.noResit || "",
      tarikhDiresit: item.tarikhDiresit || "",
      name: item.name || "",
      location: item.location || "",
      branch: item.branch || "",
      device: item.device || "",
      deviceName: item.deviceName || "",
      noSiri: item.noSiri || "",
      noKewPA: item.noKewPA || "",
      problem: item.problem || "",
      noReport: item.noReport || "",
      actionTaken: item.actionTaken || "",
      status: item.status || "",
      technician: item.technician || "",
      tempohWarranty: item.tempohWarranty || "",
      submissionDate: item.submissionDate || "",
      exitDate: item.exitDate || "",
    });
    setShowModal(true);
  }

  // Open Details
  function handleViewDetails(item) {
    setSelectedEquipment(item);
    setShowDetailsModal(true);
  }

  // Open Status update
  function handleOpenStatusModal(item) {
    setStatusUpdateEquipment(item);
    setNewStatusValue(item.status);
    setShowStatusModal(true);
  }

  // Delete
  async function handleDelete(year, id) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const response = await fetch(equipmentBaseUrl, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, id }),
      });
      
      const result = await response.json();
      if (result.success) {
        showSuccessToast("Equipment deleted successfully!");
        fetchEquipment();
      } else {
        showErrorToast(result.error || "Failed to delete equipment");
      }
    } catch (e) {
      console.error("Delete error", e);
      showErrorToast("An error occurred while deleting equipment");
    }
  }

  // Save (add/update) with validation
  async function handleSave() {
    console.log("🛠️ Starting save process...");
    console.log("📝 Device data to save:", newDevice);
  
    // Validate only required fields
    const newErrors = {};
    const requiredFields = [
      'noResit', 'name', 'location', 'branch', 'device', 
      'deviceName', 'problem', 'technician', 'status', 'tarikhDiresit'
    ];

    // First validate all required fields
    requiredFields.forEach(field => {
      const error = validateField(field, newDevice[field]);
      if (error) newErrors[field] = error;
    });

    // Then check custom fields if "Lain-Lain" is selected
    if (newDevice.location === 'Lain-Lain' && !newDevice.customLocation) {
      newErrors.customLocation = 'Custom location is required';
    }
    if (newDevice.branch === 'Lain-Lain' && !newDevice.customBranch) {
      newErrors.customBranch = 'Custom branch is required';
    }
    if (newDevice.device === 'Lain-Lain' && !newDevice.customDevice) {
      newErrors.customDevice = 'Custom device is required';
    }
    if (newDevice.deviceName === 'Lain-Lain' && !newDevice.customDeviceName) {
      newErrors.customDeviceName = 'Custom device name is required';
    }
    if (newDevice.problem === 'Lain-Lain' && !newDevice.customProblem) {
      newErrors.customProblem = 'Custom problem is required';
    }
    if (newDevice.technician === 'Lain-Lain' && !newDevice.customTechnician) {
      newErrors.customTechnician = 'Custom technician is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showErrorToast("Please fill in all required fields correctly");
      return;
    }

    // Prepare data with custom values
    const dataToSend = {
      ...newDevice,
      year: parseInt(newDevice.year),
      bil: parseInt(newDevice.bil),
      id: editingId || null,
      // Required fields
      noResit: newDevice.noResit,
      name: newDevice.name,
      location: newDevice.location === "Lain-Lain" ? newDevice.customLocation : newDevice.location,
      branch: newDevice.branch === "Lain-Lain" ? newDevice.customBranch : newDevice.branch,
      device: newDevice.device === "Lain-Lain" ? newDevice.customDevice : newDevice.device,
      deviceName: newDevice.deviceName === "Lain-Lain" ? newDevice.customDeviceName : newDevice.deviceName,
      problem: newDevice.problem === "Lain-Lain" ? newDevice.customProblem : newDevice.problem,
      technician: newDevice.technician === "Lain-Lain" ? newDevice.customTechnician : newDevice.technician,
      status: newDevice.status,
      tarikhDiresit: newDevice.tarikhDiresit,
      // Optional fields - ensure they're empty strings if not provided
      noSiri: newDevice.noSiri || "",
      noKewPA: newDevice.noKewPA || "",
      noReport: newDevice.noReport || "",
      actionTaken: newDevice.actionTaken || "",
      tempohWarranty: newDevice.tempohWarranty || "",
      submissionDate: newDevice.submissionDate || "",
      exitDate: newDevice.exitDate || ""
    };

    try {
      const method = editingId ? "PUT" : "POST";
      console.log(`📤 Sending ${method} request to save device...`);
      
      const response = await fetch(equipmentBaseUrl, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      
      const result = await response.json();
      console.log("📥 Server response:", result);
      
      if (response.ok) {
        console.log("✅ Save successful!");
        setErrors({}); // Clear any previous errors
        fetchEquipment(); // Refresh the list
        resetForm();
        setEditingId(null);
        setShowModal(false);
        showSuccessToast(editingId ? "Equipment updated successfully!" : "Equipment added successfully!");
      } else {
        console.error("❌ Save failed:", result.error);
        if (result.field) {
          // Set error for specific field
          setErrors({ [result.field]: result.error });
          showErrorToast(result.error);
        } else {
          showErrorToast(result.error || "An error occurred while saving. Please try again.");
        }
      }
    } catch (err) {
      console.error("❌ Save error:", err);
      showErrorToast("An error occurred while saving. Please try again.");
    }
  }
  

  // Update status only
  async function handleUpdateStatus() {
    const payload = { ...statusUpdateEquipment, status: newStatusValue };
    try {
      await fetch(equipmentBaseUrl, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      fetchEquipment();
      setShowStatusModal(false);
      setStatusUpdateEquipment(null);
      showSuccessToast("Equipment status updated successfully!");
    } catch (e) {
      console.error("Status update error", e);
      showErrorToast("An error occurred while updating equipment status");
    }
  }

  // Cancel / reset
  function handleCancel() {
    resetForm();
    setEditingId(null);
    setShowModal(false);
  }
  function resetForm() {
    setNewDevice({
      year: currentYear,
      bil: "",
      noResit: "",
      tarikhDiresit: "",
      name: "",
      location: "",
      branch: "",
      device: "",
      deviceName: "",
      noSiri: "",
      noKewPA: "",
      problem: "",
      noReport: "",
      actionTaken: "",
      status: "",
      technician: "",
      tempohWarranty: "",
      submissionDate: "",
      exitDate: "",
      // Reset custom input fields
      customLocation: "",
      customBranch: "",
      customDevice: "",
      customDeviceName: "",
      customProblem: "",
      customTechnician: "",
    });
  }

  // Pagination math
  const totalPages = Math.ceil(equipmentList.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = equipmentList.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* NAVIGATION */}
      <Navigation />

      {/* HEADER */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-6 flex flex-col sm:flex-row items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Equipment</h1>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow p-6">
        <div className="max-w-7xl mx-auto rounded shadow p-6 bg-white/90 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              ICT Maintenance Equipment
            </h2>
            {/* Display selected year */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Select Year:</span>
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

              <span className="text-gray-700">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border p-1 rounded text-gray-800"
              >
                <option value="">All</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="flex items-center justify-end space-x-4 mt-2 sm:mt-0">
            <input
              type="text"
              placeholder="Search by No. Resit / No. Siri / No. Kew PA / No. Report"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border px-3 py-2 rounded text-gray-900"
            />
            <button
              onClick={handleAddNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors duration-200"
            >
              Add New Equipment
            </button>
          </div>
          {/* Display selected year */}
            <div className="flex-1 text-center">
              <span className="font-bold text-gray-900 text-xl">Year: {selectedYear}</span>
            </div>

          {/* EQUIPMENT TABLE */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300 text-sm bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">BIL</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">No. Resit</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">Nama</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">Lokasi</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">Peralatan</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">Masalah</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">Tindakan</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">Technician</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">Tarikh Selesai</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">Tarikh Keluar</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                      Loading equipment...
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((eq) => (
                    <tr key={`${eq.year}-${eq.id}`} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{eq.bil}</td>
                      <td className="px-4 py-2 text-gray-900">{eq.noResit}</td>
                      <td className="px-4 py-2 text-gray-900">{eq.name}</td>
                      <td className="px-4 py-2 text-gray-900">{eq.location}</td>
                      <td className="px-4 py-2 text-gray-900">{eq.device}</td>
                      <td className="px-4 py-2 text-gray-900">{eq.problem}</td>
                      <td className="px-4 py-2 text-gray-900">{eq.actionTaken || ""}</td>
                      <td className="px-4 py-2 text-gray-900">{eq.status}</td>
                      <td className="px-4 py-2 text-gray-900">{eq.technician}</td>
                      <td className="px-4 py-2 text-gray-900">{eq.submissionDate}</td>
                      <td className="px-4 py-2 text-gray-900">{eq.exitDate}</td>
                      <td className="px-4 py-2 text-right flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(eq)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(eq.year, eq.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleViewDetails(eq)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleOpenStatusModal(eq)}
                          className="text-yellow-600 hover:text-yellow-800"
                        >
                          <AdjustmentsHorizontalIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                      No equipment found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {equipmentList.length > itemsPerPage && (
            <div className="flex justify-center mt-4 space-x-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className={`px-4 py-2 rounded-md text-sm ${currentPage === 1
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className={`px-4 py-2 rounded-md text-sm ${currentPage === totalPages
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
              >
                Next
              </button>
            </div>
          )}
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

      {/* MODAL OVERLAY FOR ADD/EDIT */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${showModal ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={(e) => e.target === e.currentTarget && handleCancel()}
      >
        <div className="absolute inset-0 bg-black/20" />

        <div
          className={`relative bg-white w-11/12 md:w-full max-w-2xl mx-auto
      p-6 md:p-8 rounded-lg shadow-2xl transform
      transition-all duration-300 ${showModal ? "scale-100" : "scale-95"}`}
          style={{ maxHeight: "85vh" }}
        >
          <div className="overflow-y-auto" style={{ maxHeight: "calc(85vh - 3rem)" }}>
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingId ? "Edit Device" : "Add New Device"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Year - read-only */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-800">Year</label>
                <input
                  type="text"
                  name="year"
                  value={newDevice.year}
                  readOnly
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-gray-100 cursor-not-allowed"
                />
              </div>

              {/* BIL - read-only */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-800">BIL</label>
                <input
                  type="text"
                  name="bil"
                  value={newDevice.bil}
                  readOnly
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-gray-100 cursor-not-allowed"
                />
              </div>

              {/* No. Resit */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-800">
                  No. Resit <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="noResit"
                  value={newDevice.noResit}
                  onChange={handleInputChange}
                  placeholder="Enter 4-digit number"
                  maxLength="4"
                  pattern="\d{4}"
                  className={`px-3 py-2 border rounded-md text-sm text-gray-900 ${
                    errors.noResit ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.noResit && (
                  <span className="text-red-500 text-xs mt-1">{errors.noResit}</span>
                )}
              </div>

              {/* Tarikh Diresit */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-800">
                  Tarikh Diresit <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tarikhDiresit"
                  value={newDevice.tarikhDiresit}
                  onChange={handleInputChange}
                  className={`px-3 py-2 border rounded-md text-sm text-gray-900 ${
                    errors.tarikhDiresit ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.tarikhDiresit && (
                  <span className="text-red-500 text-xs mt-1">{errors.tarikhDiresit}</span>
                )}
              </div>

              {/* Nama */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-800">
                  Nama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={newDevice.name}
                  onChange={handleInputChange}
                  placeholder="Enter Name"
                  className={`px-3 py-2 border rounded-md text-sm text-gray-900 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <span className="text-red-500 text-xs mt-1">{errors.name}</span>
                )}
              </div>

              {/* Lokasi */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-800">
                  Lokasi <span className="text-red-500">*</span>
                </label>
                <select
                  name="location"
                  value={newDevice.location}
                  onChange={handleDropdownChange}
                  className={`px-3 py-2 border rounded-md text-sm text-gray-900 ${
                    errors.location ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Location</option>
                  {dropdowns.location?.map((loc, i) => (
                    <option key={i} value={loc}>{loc}</option>
                  ))}
                  <option value="Lain-Lain">Lain-Lain</option>
                </select>
                {errors.location && (
                  <span className="text-red-500 text-xs mt-1">{errors.location}</span>
                )}
                {newDevice.location === "Lain-Lain" && (
                  <input
                    type="text"
                    name="customLocation"
                    value={newDevice.customLocation}
                    onChange={handleInputChange}
                    placeholder="Enter custom location"
                    className={`mt-2 px-3 py-2 border rounded-md text-sm text-gray-900 ${
                      errors.customLocation ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                )}
              </div>

              {/* Cawangan */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-800">Cawangan</label>
                <select
                  name="branch"
                  value={newDevice.branch}
                  onChange={handleDropdownChange}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                >
                  <option value="">Select Branch</option>
                  {dropdowns.branch?.map((br, i) => (
                    <option key={i} value={br}>{br}</option>
                  ))}
                  <option value="Lain-Lain">Lain-Lain</option>
                </select>
                {newDevice.branch === "Lain-Lain" && (
                  <input
                    type="text"
                    name="customBranch"
                    value={newDevice.customBranch}
                    onChange={handleInputChange}
                    placeholder="Enter custom branch"
                    className="mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                  />
                )}
              </div>

              {/* Peralatan */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-800">Peralatan</label>
                <select
                  name="device"
                  value={newDevice.device}
                  onChange={handleDropdownChange}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                >
                  <option value="">Select Device</option>
                  {dropdowns.device?.map((d, i) => (
                    <option key={i} value={d}>{d}</option>
                  ))}
                  <option value="Lain-Lain">Lain-Lain</option>
                </select>
                {newDevice.device === "Lain-Lain" && (
                  <input
                    type="text"
                    name="customDevice"
                    value={newDevice.customDevice}
                    onChange={handleInputChange}
                    placeholder="Enter custom device"
                    className="mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                  />
                )}
              </div>

              {/* Nama Peralatan */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-800">Nama Peralatan</label>
                <select
                  name="deviceName"
                  value={newDevice.deviceName}
                  onChange={handleDropdownChange}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                >
                  <option value="">Select Device Name</option>
                  {dropdowns.deviceName?.map((dn, i) => (
                    <option key={i} value={dn}>{dn}</option>
                  ))}
                  <option value="Lain-Lain">Lain-Lain</option>
                </select>
                {newDevice.deviceName === "Lain-Lain" && (
                  <input
                    type="text"
                    name="customDeviceName"
                    value={newDevice.customDeviceName}
                    onChange={handleInputChange}
                    placeholder="Enter custom device name"
                    className="mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                  />
                )}
              </div>

              {/* No. Siri (Optional) */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-800">
                  No. Siri
                </label>
                <input
                  type="text"
                  name="noSiri"
                  value={newDevice.noSiri}
                  onChange={handleInputChange}
                  placeholder="Serial Number"
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                />
              </div>

              {/* No. Kew PA (Optional) */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-800">
                  No. Kew PA
                </label>
                <input
                  type="text"
                  name="noKewPA"
                  value={newDevice.noKewPA}
                  onChange={handleInputChange}
                  placeholder="e.g. KEW-123"
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                />
              </div>

              {/* Masalah */}
              <div className="flex flex-col md:col-span-2">
                <label className="mb-1 text-sm font-medium text-gray-800">Masalah</label>
                <select
                  name="problem"
                  value={newDevice.problem}
                  onChange={handleDropdownChange}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                >
                  <option value="">Select Problem</option>
                  {dropdowns.problem?.map((p, i) => (
                    <option key={i} value={p}>{p}</option>
                  ))}
                  <option value="Lain-Lain">Lain-Lain</option>
                </select>
                {newDevice.problem === "Lain-Lain" && (
                  <input
                    type="text"
                    name="customProblem"
                    value={newDevice.customProblem}
                    onChange={handleInputChange}
                    placeholder="Enter custom problem"
                    className="mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                  />
                )}
              </div>

              {/* No. Report (Optional) */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-800">
                  No. Report
                </label>
                <input
                  type="text"
                  name="noReport"
                  value={newDevice.noReport}
                  onChange={handleInputChange}
                  placeholder="RPT-xxxx"
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                />
              </div>

              {/* Tindakan */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-800">Tindakan</label>
                <input
                  type="text"
                  name="actionTaken"
                  value={newDevice.actionTaken}
                  onChange={handleInputChange}
                  placeholder="Actions or notes"
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                />
              </div>

              {/* Status */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-800">Status</label>
                <select
                  name="status"
                  value={newDevice.status}
                  onChange={handleInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                >
                  <option value="">Select Status</option>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Technician */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-800">Technician</label>
                <select
                  name="technician"
                  value={newDevice.technician}
                  onChange={handleDropdownChange}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                >
                  <option value="">Select Technician</option>
                  {dropdowns.technician?.map((t, i) => (
                    <option key={i} value={t}>{t}</option>
                  ))}
                  <option value="Lain-Lain">Lain-Lain</option>
                </select>
                {newDevice.technician === "Lain-Lain" && (
                  <input
                    type="text"
                    name="customTechnician"
                    value={newDevice.customTechnician}
                    onChange={handleInputChange}
                    placeholder="Enter custom technician"
                    className="mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                  />
                )}
              </div>

              {/* Tempoh Warranty */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-800">
                  Tempoh Warranty Tamat
                </label>
                <input
                  type="date"
                  name="tempohWarranty"
                  value={newDevice.tempohWarranty}
                  onChange={handleInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                />
              </div>

              {/* Tarikh Selesai */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-800">
                  Tarikh Selesai
                </label>
                <input
                  type="date"
                  name="submissionDate"
                  value={newDevice.submissionDate}
                  onChange={handleInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                />
              </div>

              {/* Tarikh Keluar */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-800">
                  Tarikh Keluar
                </label>
                <input
                  type="date"
                  name="exitDate"
                  value={newDevice.exitDate}
                  onChange={handleInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                />
              </div>
            </div>

            {/* Save / Cancel */}
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={handleSave}
                className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* MODAL FOR STATUS UPDATE */}
      {showStatusModal && statusUpdateEquipment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowStatusModal(false);
              setStatusUpdateEquipment(null);
            }
          }}
        >
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative bg-white w-11/12 md:w-full max-w-md mx-auto p-6 rounded-lg shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Update Status</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Status
              </label>
              <select
                value={newStatusValue}
                onChange={(e) => setNewStatusValue(e.target.value)}
                className="w-full border px-3 py-2 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Status</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleUpdateStatus}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Update
              </button>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusUpdateEquipment(null);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {showDetailsModal && selectedEquipment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDetailsModal(false);
              setSelectedEquipment(null);
            }
          }}
        >
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative bg-white w-11/12 md:w-full max-w-2xl mx-auto p-6 md:p-8 rounded-lg shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">ICT Equipment Details</h3>
            <div className="space-y-2 text-gray-900">
              <div>
                <span className="font-semibold">Year:</span> {selectedEquipment.year}
              </div>
              <div>
                <span className="font-semibold">BIL:</span> {selectedEquipment.bil}
              </div>
              <div>
                <span className="font-semibold">No Resit:</span> {selectedEquipment.noResit}
              </div>
              <div>
                <span className="font-semibold">Tarikh Diresit:</span> {selectedEquipment.tarikhDiresit}
              </div>
              <div>
                <span className="font-semibold">Name:</span> {selectedEquipment.name}
              </div>
              <div>
                <span className="font-semibold">Location:</span> {selectedEquipment.location}
              </div>
              <div>
                <span className="font-semibold">Branch:</span> {selectedEquipment.branch}
              </div>
              <div>
                <span className="font-semibold">Device:</span> {selectedEquipment.device}
              </div>
              <div>
                <span className="font-semibold">Device Name:</span> {selectedEquipment.deviceName}
              </div>
              <div>
                <span className="font-semibold">No. Siri:</span> {selectedEquipment.noSiri}
              </div>
              <div>
                <span className="font-semibold">No. Kew PA:</span> {selectedEquipment.noKewPA}
              </div>
              <div>
                <span className="font-semibold">No. Report:</span> {selectedEquipment.noReport}
              </div>
              <div>
                <span className="font-semibold">Problem:</span> {selectedEquipment.problem}
              </div>
              <div>
                <span className="font-semibold">Action Taken:</span> {selectedEquipment.actionTaken}
              </div>
              <div>
                <span className="font-semibold">Status:</span> {selectedEquipment.status}
              </div>
              <div>
                <span className="font-semibold">Technician:</span> {selectedEquipment.technician}
              </div>
              <div>
                <span className="font-semibold">Tarikh Selesai:</span> {selectedEquipment.submissionDate}
              </div>
              <div>
                <span className="font-semibold">Tarikh Keluar:</span> {selectedEquipment.exitDate}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedEquipment(null);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
