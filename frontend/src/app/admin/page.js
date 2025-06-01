"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navigation from "@/components/Navigation";
import { showSuccessToast, showErrorToast } from "@/utils/toast";

const STATUS_OPTIONS = [
  { value: "Belum Selesai", label: "Belum Selesai" },
  { value: "KIV", label: "KIV" },
  { value: "Dilupuskan", label: "Dilupuskan" },
  { value: "Selesai", label: "Selesai" },
  { value: "Berada di User", label: "Berada di User" }
];

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formDataState, setFormDataState] = useState({
    username: "",
    password: "",
    name: "",
    role: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Add logs state
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsPage, setLogsPage] = useState(1);
  const [totalLogsPages, setTotalLogsPages] = useState(1);

  // Add reset requests state
  const [resetRequests, setResetRequests] = useState([]);
  const [pendingResets, setPendingResets] = useState(0);
  const [showResetNotification, setShowResetNotification] = useState(false);

  // Add this useEffect to handle the tab parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'reset-requests') {
      setActiveTab('reset-requests');
    }
  }, [searchParams]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(
        "https://iemsweb.online/user/UserController.php?action=fetch_all",
        { credentials: "include" }
      );
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      showErrorToast("Failed to fetch users");
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const [activeTab, setActiveTab] = useState("users");
  const [currentTime, setCurrentTime] = useState("");

  // Dropdown Option Manager state
  const [dropdownType, setDropdownType] = useState("");
  const [dropdownValue, setDropdownValue] = useState("");

  // Dropdown Delete state
  const [showDeleteOptionModal, setShowDeleteOptionModal] = useState(false);
  const [optionToDelete, setOptionToDelete] = useState({ type: "", value: "" });

  // State to hold current dropdown options fetched from the backend (object with keys mapping to arrays)
  const [currentDropdownOptions, setCurrentDropdownOptions] = useState({});
  // New states for improved options management
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Add new state for validation errors
  const [validationErrors, setValidationErrors] = useState({});

  // Function to fetch current dropdown options
  const fetchDropdownData = async () => {
    try {
      const res = await fetch(
        "https://iemsweb.online/equipment/EquipmentController.php?action=fetch_dropdowns"
      );
      const data = await res.json();
      setCurrentDropdownOptions(data);

      // Initialize expanded categories (all collapsed by default)
      const initialExpanded = {};
      Object.keys(data).forEach((key) => {
        initialExpanded[key] = false;
      });
      setExpandedCategories(initialExpanded);
    } catch (err) {
      console.error("Error fetching dropdown options:", err);
    }
  };

  // Call fetchDropdownData on component mount to load current options.
  useEffect(() => {
    fetchDropdownData();
  }, []);

  const handleAddDropdownOption = async () => {
    if (!dropdownType || !dropdownValue) {
      showErrorToast("Please select a type and enter a value.");
      return;
    }

    // Check for case-insensitive duplicates
    const existingOptions = currentDropdownOptions[dropdownType] || [];
    const isDuplicate = existingOptions.some(
      option => option.toLowerCase() === dropdownValue.toLowerCase()
    );

    if (isDuplicate) {
      showErrorToast(`This ${dropdownType} already exists.`);
      return;
    }

    try {
      const res = await fetch(
        "https://iemsweb.online/equipment/EquipmentController.php?action=add_option",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: dropdownType, value: dropdownValue }),
        }
      );
      const data = await res.json();

      if (data.error) {
        showErrorToast("Failed: " + data.error);
      } else {
        showSuccessToast(data.message || "Option added!");
        setDropdownValue(""); // Clear input after successful addition.
        // Refresh the displayed options after adding a new one.
        fetchDropdownData();
      }
    } catch (err) {
      console.error("Dropdown add error:", err);
      showErrorToast("Failed to add option.");
    }
  };

  // Add function to handle option deletion with case-insensitive check
  const handleDeleteOption = async (type, value) => {
    try {
      const res = await fetch(
        "https://iemsweb.online/equipment/EquipmentController.php?action=delete_option",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, value }),
        }
      );
      const data = await res.json();

      if (data.error) {
        showErrorToast("Failed: " + data.error);
      } else {
        showSuccessToast(data.message || "Option deleted!");
        fetchDropdownData(); // Refresh options
        setShowDeleteOptionModal(false);
      }
    } catch (err) {
      console.error("Delete option error:", err);
      showErrorToast("Failed to delete option.");
    }
  };

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Function to filter options based on search and selected category
  const getFilteredOptions = () => {
    const options = {};

    Object.entries(currentDropdownOptions).forEach(([category, values]) => {
      if (selectedCategory === "all" || selectedCategory === category) {
        const filteredValues = values.filter((value) =>
          value.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredValues.length > 0) {
          options[category] = filteredValues;
        }
      }
    });

    return options;
  };

  // Modal-related states and user management states.
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states for editing user.
  const [editName, setEditName] = useState("");
  const [editNoBadan, setEditNoBadan] = useState("");
  const [editJawatan, setEditJawatan] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhoneNo, setEditPhoneNo] = useState("");
  const [editRole, setEditRole] = useState("user");

  // Form states for adding new user.
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [newNoBadan, setNewNoBadan] = useState("");
  const [newJawatan, setNewJawatan] = useState("");
  const [newPhoneNo, setNewPhoneNo] = useState("");

  // Add reset password function
  const handleResetPassword = async (userId) => {
    if (window.confirm("Are you sure you want to reset this user's password to Default123?")) {
      try {
        const res = await fetch(`https://iemsweb.online/user/UserController.php?action=reset_password`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: userId }),
        });
        const data = await res.json();
        if (data.error) {
          showErrorToast("Error: " + data.error);
        } else {
          showSuccessToast("Password has been reset to Default123");
        }
      } catch (err) {
        console.error("Reset password error:", err);
        showErrorToast("Error resetting password");
      }
    }
  };

  // Add validation functions
  const validateNoBadan = (noBadan) => {
    const regex = /^[A-Za-z0-9]{6,}$/;
    return regex.test(noBadan);
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Add toggle active status function
  const handleToggleActive = async (user) => {
    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    try {
      const res = await fetch("https://iemsweb.online/user/UserController.php?action=update_status", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          status: newStatus
        }),
      });
      const data = await res.json();
      if (data.error) {
        showErrorToast("Error: " + data.error);
      } else {
        // Update the user's status in the local state
        setUsers(users.map(u =>
          u.id === user.id ? { ...u, status: newStatus } : u
        ));
      }
    } catch (err) {
      console.error("Toggle status error:", err);
      showErrorToast("Error updating user status");
    }
  };

  // Update handleAddUser to set initial status as Active
  const handleAddUser = async (e) => {
    e.preventDefault();

    // Reset validation errors
    setValidationErrors({});

    // Validate No. Badan
    if (!validateNoBadan(newNoBadan)) {
      setValidationErrors(prev => ({
        ...prev,
        noBadan: "No. Badan must be at least 6 characters and contain only letters and numbers"
      }));
      return;
    }

    // Validate Email
    if (!validateEmail(newEmail)) {
      setValidationErrors(prev => ({
        ...prev,
        email: "Please enter a valid email address"
      }));
      return;
    }

    try {
      const res = await fetch("https://iemsweb.online/user/UserController.php?action=add", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          noBadan: newNoBadan,
          jawatan: newJawatan,
          email: newEmail,
          phoneNo: newPhoneNo,
          role: newRole,
          status: "Active" // Set initial status as Active
        }),
      });
      const data = await res.json();
      if (data.error) {
        showErrorToast("Error: " + data.error);
      } else {
        showSuccessToast(data.message || "User added.");
        setUsers([
          ...users,
          {
            id: data.id,
            name: newName,
            noBadan: newNoBadan,
            jawatan: newJawatan,
            email: newEmail,
            phoneNo: newPhoneNo,
            role: newRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: "Active", // Set initial status as Active
            approved_by: null,
          },
        ]);
        setShowAddModal(false);
        // Reset form fields
        setNewName("");
        setNewNoBadan("");
        setNewJawatan("");
        setNewEmail("");
        setNewPhoneNo("");
        setNewRole("user");
      }
    } catch (err) {
      console.error("Add user error:", err);
      showErrorToast("Error adding user.");
    }
  };

  // Fetch user list and update current time.
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditNoBadan(user.noBadan || "");
    setEditJawatan(user.jawatan || "");
    setEditEmail(user.email);
    setEditPhoneNo(user.phoneNo || "");
    setEditRole(user.role);
    setShowEditModal(true);
  };

  // Get filtered options based on search/filter state
  const filteredOptions = getFilteredOptions();

  // Add delete user function
  const handleDeleteUser = async (user) => {
    if (window.confirm(`Are you sure you want to delete user ${user.name}? This action cannot be undone.`)) {
      try {
        const res = await fetch("https://iemsweb.online/user/UserController.php?action=delete", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: user.id }),
        });
        const data = await res.json();
        if (data.error) {
          showErrorToast("Error: " + data.error);
        } else {
          showSuccessToast("User deleted successfully");
          // Remove the deleted user from the local state
          setUsers(users.filter(u => u.id !== user.id));
        }
      } catch (err) {
        console.error("Delete user error:", err);
        showErrorToast("Error deleting user");
      }
    }
  };

  // Add useEffect to watch for search term changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500); // Debounce search by 500ms

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("action", "add");
      formData.append("username", formDataState.username);
      formData.append("password", formDataState.password);
      formData.append("name", formDataState.name);
      formData.append("role", formDataState.role);

      const response = await fetch(
        "https://iemsweb.online/user/UserController.php",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        showSuccessToast("User added successfully!");
        setShowModal(false);
        fetchUsers();
        resetForm();
      } else {
        showErrorToast(result.message || "Failed to add user");
      }
    } catch (error) {
      showErrorToast("An error occurred while adding user");
      console.error("Error:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await fetch(
          `https://iemsweb.online/user/UserController.php?action=delete&id=${id}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        const result = await response.json();

        if (result.success) {
          showSuccessToast("User deleted successfully!");
          fetchUsers();
        } else {
          showErrorToast(result.message || "Failed to delete user");
        }
      } catch (error) {
        showErrorToast("An error occurred while deleting user");
        console.error("Error:", error);
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("action", "update");
      formData.append("id", editingUser.id);
      formData.append("username", formDataState.username);
      formData.append("password", formDataState.password);
      formData.append("name", formDataState.name);
      formData.append("role", formDataState.role);

      const response = await fetch(
        "https://iemsweb.online/user/UserController.php",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        showSuccessToast("User updated successfully!");
        setShowEditModal(false);
        fetchUsers();
        resetForm();
      } else {
        showErrorToast(result.message || "Failed to update user");
      }
    } catch (error) {
      showErrorToast("An error occurred while updating user");
      console.error("Error:", error);
    }
  };


  // Add fetch logs function
  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const url = new URL('https://iemsweb.online/logs/LogController.php');
      url.searchParams.append('action', 'fetch_all');
      url.searchParams.append('page', logsPage);
      url.searchParams.append('limit', 10);

      const res = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch logs');
      }

      setLogs(data.logs);
      setTotalLogsPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching logs:', error);
      showErrorToast(error.message || 'Failed to fetch logs');
    } finally {
      setLogsLoading(false);
    }
  };

  // Add useEffect for logs
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, logsPage]);

  // Add this useEffect to fetch reset requests when the tab is active
  useEffect(() => {
    if (activeTab === 'reset-requests') {
      fetchResetRequests();
    }
  }, [activeTab]);

  // Add these functions before the return statement
  const fetchResetRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://iemsweb.online/user/UserController.php?action=fetch_reset_requests', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Session data:', errorData.session);
        throw new Error(errorData.error || 'Failed to fetch reset requests');
      }
      
      const data = await response.json();
      if (data.error) {
        showErrorToast(data.error);
      } else {
        setResetRequests(data);
      }
    } catch (error) {
      console.error('Error fetching reset requests:', error);
      showErrorToast(error.message || 'Failed to fetch reset requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetRequest = async (requestId, action) => {
    try {
      const response = await fetch('https://iemsweb.online/user/UserController.php?action=handle_reset_request', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request_id: requestId, action }),
      });
      const data = await response.json();
      if (data.error) {
        showErrorToast(data.error);
      } else {
        showSuccessToast(data.message);
        fetchResetRequests(); // Refresh the list
      }
    } catch (error) {
      showErrorToast('Failed to process request');
    }
  };

  // Add useEffect to check for pending resets
  useEffect(() => {
    const checkPendingResets = async () => {
      try {
        const response = await fetch('https://iemsweb.online/user/UserController.php?action=check_pending_resets', {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.count > 0) {
          setPendingResets(data.count);
          setShowResetNotification(true);
        }
      } catch (error) {
        console.error('Error checking pending resets:', error);
      }
    };

    checkPendingResets();
    // Check every 30 seconds
    const interval = setInterval(checkPendingResets, 30000);
    return () => clearInterval(interval);
  }, []);

  // Add notification component
  const ResetNotification = () => {
    if (!showResetNotification) return null;

    return (
      <div className="fixed top-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-4 animate-fadeIn">
        <div>
          <p className="font-semibold">Password Reset Requests</p>
          <p>{pendingResets} pending request{pendingResets !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => {
            setActiveTab('reset-requests');
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
      {/* Add notification component */}
      <ResetNotification />
      
      {/* Background Image & Overlay */}
      <div
        className="absolute inset-0 bg-no-repeat bg-cover bg-center"
        style={{ backgroundImage: 'url("/images/pdrm.png")' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 to-blue-800/60" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navigation />

        {/* Tabs Navigation */}
        <div className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex space-x-4 border-b">
              <button
                onClick={() => setActiveTab("users")}
                className={`py-2 px-4 font-medium focus:outline-none ${activeTab === "users"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600"
                  }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab("manage")}
                className={`py-2 px-4 font-medium focus:outline-none ${activeTab === "manage"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600"
                  }`}
              >
                Manage
              </button>
              <button
                onClick={() => setActiveTab("reset-requests")}
                className={`py-2 px-4 font-medium focus:outline-none ${activeTab === "reset-requests"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600"
                  }`}
              >
                Reset Requests
              </button>
              <button
                onClick={() => setActiveTab("logs")}
                className={`py-2 px-4 font-medium focus:outline-none ${activeTab === "logs"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600"
                  }`}
              >
                Logs
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <main className="flex-grow p-6 bg-gray-100">
          <div className="max-w-7xl mx-auto">
            {activeTab === "users" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">User List</h2>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search users..."
                        className="border px-4 py-2 rounded text-gray-800"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <button
                        onClick={() => fetchUsers()}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        <svg xmlns="https://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                    >
                      <svg
                        xmlns="https://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add User
                    </button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : users.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-300 text-sm bg-white">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">Name</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">No. Badan</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">Jawatan</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">Role</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">Email</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">Phone No</th>
                          {/* <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">Created At</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">Updated At</th> */}
                          {/*<th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">Approved By</th> */}
                          <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">Status</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-900">{user.name}</td>
                            <td className="px-4 py-2 text-gray-900">{user.noBadan || "-"}</td>
                            <td className="px-4 py-2 text-gray-900">{user.jawatan || "-"}</td>
                            <td className="px-4 py-2 text-gray-900">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === "admin" ? "bg-blue-100 text-blue-800" :
                                  "bg-green-100 text-green-800"
                                }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-900">{user.email}</td>
                            <td className="px-4 py-2 text-gray-900">{user.phoneNo || "-"}</td>
                            {/* <td className="px-4 py-2 text-gray-900">{user.created_at}</td>
                            <td className="px-4 py-2 text-gray-900">{user.updated_at}</td> */}
                            {/* <td className="px-4 py-2 text-gray-900">{user.approved_by || "-"}</td> */}
                            <td className="px-4 py-2 text-gray-900">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === "Active" ? "bg-green-100 text-green-800" :
                                  "bg-red-100 text-red-800"
                                }`}>
                                {user.status || "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-900">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openEditModal(user)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Edit user"
                                >
                                  <svg xmlns="https://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleToggleActive(user)}
                                  className={`${user.status === "Active"
                                      ? "text-green-600 hover:text-green-800"
                                      : "text-red-600 hover:text-red-800"
                                    }`}
                                  title={user.status === "Active" ? "Deactivate user" : "Activate user"}
                                >
                                  <svg xmlns="https://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleResetPassword(user.id)}
                                  className="text-yellow-600 hover:text-yellow-800"
                                  title="Reset password"
                                >
                                  <svg xmlns="https://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete user"
                                >
                                  <svg xmlns="https://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-white p-6 text-center rounded-lg shadow-md">
                    <svg
                      xmlns="https://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto text-gray-400 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <p className="text-gray-700">No users found.</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add Your First User
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "manage" && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Manage System</h2>

                {/* Dropdown Option Manager Form */}
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow mb-6">
                  <h3 className="font-medium text-lg mb-2 text-gray-800">Dropdown Option Manager</h3>
                  <p className="text-gray-600 mb-4">
                    Add options for fields like location, branch, device, technician, etc.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Option Type</label>
                      <select
                        value={dropdownType}
                        onChange={(e) => setDropdownType(e.target.value)}
                        className="w-full border px-3 py-2 rounded text-gray-800"
                      >
                        <option value="">-- Select Type --</option>
                        <option value="location">Location</option>
                        <option value="branch">Branch</option>
                        <option value="device">Device</option>
                        <option value="deviceName">Device Name</option>
                        <option value="problem">Problem</option>
                        <option value="status">Status (Belum Selesai, KIV, Dilupuskan, Selesai, Berada di User)</option>
                        <option value="technician">Technician</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Option Value</label>
                      <input
                        type="text"
                        value={dropdownValue}
                        onChange={(e) => setDropdownValue(e.target.value)}
                        className="w-full border px-3 py-2 rounded text-gray-800"
                        placeholder="Enter new option"
                      />
                    </div>
                  </div>

                  <div className="mt-4 text-right">
                    <button
                      onClick={handleAddDropdownOption}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    >
                      Add Option
                    </button>
                  </div>
                </div>

                {/* Current Dropdown Options - Improved UI */}
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-lg text-gray-800">Current Dropdown Options</h3>
                    <button
                      onClick={fetchDropdownData}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm flex items-center"
                    >
                      <svg
                        xmlns="https://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                  </div>

                  {/* Search and Filter */}
                  <div className="mb-4 grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Search Options</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg
                            xmlns="https://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search by value..."
                          className="pl-10 w-full border px-3 py-2 rounded text-gray-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full border px-3 py-2 rounded text-gray-800"
                      >
                        <option value="all">All Types</option>
                        {Object.keys(currentDropdownOptions).map((type) => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Options by Category */}
                  {Object.keys(filteredOptions).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(filteredOptions).map(([category, options]) => (
                        <div key={category} className="border rounded-lg overflow-hidden">
                          <div
                            className="bg-gray-50 px-4 py-2 flex justify-between items-center cursor-pointer"
                            onClick={() => toggleCategory(category)}
                          >
                            <h4 className="font-medium text-gray-800 capitalize">
                              {category} ({options.length})
                            </h4>
                            <svg
                              xmlns="https://www.w3.org/2000/svg"
                              className={`h-5 w-5 transition-transform ${expandedCategories[category] ? "transform rotate-180" : ""
                                }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>

                          {expandedCategories[category] && (
                            <div className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {options.map((option, index) => (
                                  <div
                                    key={index}
                                    className="px-3 py-2 bg-gray-50 rounded flex items-center justify-between"
                                  >
                                    <span className="text-gray-800">{option}</span>
                                    <button
                                      onClick={() => {
                                        setOptionToDelete({ type: category, value: option });
                                        setShowDeleteOptionModal(true);
                                      }}
                                      className="text-red-600 hover:text-red-800 ml-2"
                                      title="Delete option"
                                    >
                                      <svg
                                        xmlns="https://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg
                        xmlns="https://www.w3.org/2000/svg"
                        className="h-12 w-12 mx-auto text-gray-400 mb-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-gray-700">No options match your search criteria.</p>
                    </div>
                  )}

                  {/* Statistics Summary */}
                  <div className="mt-4 bg-gray-50 rounded-lg p-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(currentDropdownOptions).map(([category, options]) => (
                        <div key={category} className="text-center">
                          <div className="text-xl font-semibold text-gray-800">{options.length}</div>
                          <div className="text-xs text-gray-600 capitalize">{category} Options</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reset-requests" && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Password Reset Requests</h2>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Badan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested At</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {resetRequests.map((request) => (
                            <tr key={request.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {request.user_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {request.user_noBadan}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {request.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(request.created_at).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleResetRequest(request.id, 'approve')}
                                    className="text-green-600 hover:text-green-800"
                                    title="Approve request"
                                  >
                                    <svg xmlns="https://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleResetRequest(request.id, 'reject')}
                                    className="text-red-600 hover:text-red-800"
                                    title="Reject request"
                                  >
                                    <svg xmlns="https://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "logs" && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">System Logs</h2>
                  {logsLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Badan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(log.created_at).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {log.user_name || 'System'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {log.user_noBadan || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {log.action}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {log.module}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {log.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {!logsLoading && (
                    <div className="mt-4 flex justify-between items-center">
                      <button
                        onClick={() => setLogsPage(prev => Math.max(1, prev - 1))}
                        disabled={logsPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-700">
                        Page {logsPage} of {totalLogsPages}
                      </span>
                      <button
                        onClick={() => setLogsPage(prev => Math.min(totalLogsPages, prev + 1))}
                        disabled={logsPage === totalLogsPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-600">
            <p>SERVING TECHNOLOGY BETTER</p>
            <p className="mt-1">
              &copy; {new Date().getFullYear()} PDRM Selangor ICT Equipment Maintenance System. All rights reserved.
            </p>
          </div>
        </footer>
      </div>

      {/* ---------- Modal Dialogs ---------- */}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowEditModal(false)}></div>
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg relative z-10 border border-gray-200 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Edit User</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700" aria-label="Close">
                <svg xmlns="https://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetch("https://iemsweb.online/user/UserController.php?action=update", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    id: selectedUser.id,
                    name: editName,
                    noBadan: editNoBadan,
                    jawatan: editJawatan,
                    email: editEmail,
                    phoneNo: editPhoneNo,
                    role: editRole
                  }),
                })
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.error) {
                      showErrorToast("Error: " + data.error);
                    } else {
                      showSuccessToast(data.message || "User updated successfully");
                      setUsers(users.map((u) =>
                        u.id === selectedUser.id
                          ? {
                            ...u,
                            name: editName,
                            noBadan: editNoBadan,
                            jawatan: editJawatan,
                            email: editEmail,
                            phoneNo: editPhoneNo,
                            role: editRole,
                            updated_at: new Date().toISOString()
                          }
                          : u
                      ));
                      setShowEditModal(false);
                    }
                  })
                  .catch((err) => {
                    console.error("Update error:", err);
                    showErrorToast("Error updating user");
                  });
              }}
            >
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">Name:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">No. Badan:</label>
                <input
                  type="text"
                  value={editNoBadan}
                  onChange={(e) => setEditNoBadan(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">Jawatan:</label>
                <input
                  type="text"
                  value={editJawatan}
                  onChange={(e) => setEditJawatan(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">Email:</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">Phone No:</label>
                <input
                  type="tel"
                  value={editPhoneNo}
                  onChange={(e) => setEditPhoneNo(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">Role:</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg relative z-10 border border-gray-200 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Add New User</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700" aria-label="Close">
                <svg xmlns="https://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form
              onSubmit={handleAddUser}
            >
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">Name:</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  required
                  placeholder="Enter full name"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">No. Badan:</label>
                <input
                  type="text"
                  value={newNoBadan}
                  onChange={(e) => setNewNoBadan(e.target.value)}
                  className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 ${validationErrors.noBadan ? "border-red-500" : ""
                    }`}
                  required
                  placeholder="Enter No. Badan"
                />
                {validationErrors.noBadan && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.noBadan}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">Jawatan:</label>
                <input
                  type="text"
                  value={newJawatan}
                  onChange={(e) => setNewJawatan(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  required
                  placeholder="Enter jawatan"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">Email:</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 ${validationErrors.email ? "border-red-500" : ""
                    }`}
                  required
                  placeholder="Enter email address"
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">Phone No:</label>
                <input
                  type="tel"
                  value={newPhoneNo}
                  onChange={(e) => setNewPhoneNo(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  required
                  placeholder="Enter phone number"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">Role:</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Option Confirmation Modal */}
      {showDeleteOptionModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteOptionModal(false)}></div>
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg relative z-10 border border-gray-200 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Delete Option</h2>
              <button onClick={() => setShowDeleteOptionModal(false)} className="text-gray-500 hover:text-gray-700" aria-label="Close">
                <svg xmlns="https://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mb-6 text-gray-700">
              Are you sure you want to delete the option <strong className="text-gray-900">{optionToDelete.value}</strong> from{" "}
              <strong className="text-gray-900 capitalize">{optionToDelete.type}</strong>?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
                onClick={() => setShowDeleteOptionModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                onClick={() => handleDeleteOption(optionToDelete.type, optionToDelete.value)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        /* Additional styles for smoother transitions */
        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }
        .transition-transform {
          transition-property: transform;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }
      `}</style>
    </div>
  );
};

export default AdminPage;
