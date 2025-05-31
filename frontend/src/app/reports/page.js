"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import jsPDF from "jspdf";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { utils as XLSXUtils, writeFile } from 'xlsx';

const STATUS_OPTIONS = [
  { value: "Belum Selesai", label: "Belum Selesai" },
  { value: "KIV", label: "KIV" },
  { value: "Dilupuskan", label: "Dilupuskan" },
  { value: "Selesai", label: "Selesai" },
  { value: "Berada di User", label: "Berada di User" }
];

export default function ReportsPage() {
  const { currentUser } = useAuth() || {};
  const [equipmentRecords, setEquipmentRecords] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dropdowns, setDropdowns] = useState({});

  // Filters and pagination
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const equipmentBaseUrl = "http://157.230.245.190:3000/equipment/EquipmentController.php";

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

  // Fetch dropdown options
  useEffect(() => {
    const fetchDropdownOptions = async () => {
      try {
        const res = await fetch(`${equipmentBaseUrl}?action=fetch_dropdowns`);
        const data = await res.json();
        setDropdowns(data);
      } catch (error) {
        console.error("Error fetching dropdowns:", error);
      }
    };
    fetchDropdownOptions();
  }, []);

  // Fetch equipment data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const url = `${equipmentBaseUrl}?year=${selectedYear}&search=${encodeURIComponent(
          searchTerm
        )}&status=${encodeURIComponent(selectedStatus)}`;
        const res = await fetch(url);
        const data = await res.json();
        
        // Sort the data by BIL number
        const sortedData = data.sort((a, b) => parseInt(a.bil) - parseInt(b.bil));
        
        setEquipmentRecords(sortedData);
        setCurrentPage(1); // Reset to first page when filters change
      } catch (error) {
        console.error("Error fetching equipment data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedYear, searchTerm, selectedStatus]);

  const handleCheckboxChange = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleGeneratePDF = async () => {
    const selectedRecords = equipmentRecords.filter((rec) =>
      selectedIds.includes(rec.id)
    );
    if (selectedRecords.length === 0) {
      alert("Please select at least one record to generate a report.");
      return;
    }

    // Load a logo image from your public folder and convert it to base64.
    let pdrmLogoData;
    try {
      const response = await fetch("/images/pdrm.png");
      const blob = await response.blob();
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      pdrmLogoData = await base64Promise;
    } catch (error) {
      console.error("Error loading logo:", error);
      alert("Failed to load logo.");
      return;
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    selectedRecords.forEach((record, idx) => {
      if (idx > 0) doc.addPage();

      // Add the logo.
      doc.addImage(pdrmLogoData, "PNG", 10, 10, 25, 25);

      // Header texts.
      doc.setFontSize(10).setFont("helvetica", "bold");
      doc.text("CAWANGAN TEKNOLOGI MAKLUMAT,", 40, 15);
      doc.text("BAHAGIAN TELEKOMUNIKASI SISTEM MAKLUMAT,", 40, 20);
      doc.text("JABATAN SUMBER STRATEGIK & TEKNOLOGI (StaRT),", 40, 25);
      doc.text("IPK SELANGOR.", 40, 30);

      doc.setFontSize(8).setFont("helvetica", "normal");
      doc.text("NO TEL : 03-55145347 / 03-55145288", 40, 35);
      doc.text("NO. FAX : 03-55145045", 40, 40);

      // If you wish to display RESIT NO (from equipment record)
      doc.setDrawColor(0).setLineWidth(0.5);
      doc.rect(150, 15, 40, 20);
      doc.setFontSize(8).text("RESIT NO:", 155, 20);
      doc.setFontSize(12).setFont("helvetica", "bold");
      doc.text(record.noResit || "-", 170, 28);

      // Title & underlines.
      doc.setFontSize(12).setFont("helvetica", "bold");
      doc.line(10, 48, 200, 48);
      doc.text("SERVICE REPORT", 105, 53, null, null, "center");
      doc.line(10, 58, 200, 58);

      let y = 65;
      const drawRow = (label, value, labelWidth = 40) => {
        doc.setFont("helvetica", "bold");
        doc.rect(10, y, labelWidth, 10);
        doc.rect(10 + labelWidth, y, 190 - labelWidth, 10);
        doc.text(label.toUpperCase(), 12, y + 7);
        doc.setFont("helvetica", "normal");
        
        // Handle long text by splitting into multiple lines
        const maxWidth = 190 - labelWidth - 4; // 4mm padding
        const lines = doc.splitTextToSize(value || "-", maxWidth);
        doc.text(lines, 12 + labelWidth, y + 7);
        
        // Adjust y position based on number of lines
        y += Math.max(10, lines.length * 7);
      };

      // Map equipment fields to report values.
      drawRow("Technician", record.technician);
      drawRow("Equipment", record.deviceName || record.device);
      drawRow("Date In", record.submissionDate || "N/A");
      drawRow("Job Ref", record.bil || "N/A");
      drawRow("Date Out", "N/A");
      y += 5;

      doc.setFont("helvetica", "bold");
      doc.rect(10, y, 190, 6);
      doc.text("USER INFORMATION", 105, y + 4, null, null, "center");
      y += 6;

      drawRow("Name", record.name);
      drawRow("Location", record.location);
      y += 5;

      doc.setFont("helvetica", "bold");
      doc.rect(10, y, 190, 6);
      doc.text("EQUIPMENT INFORMATION", 105, y + 4, null, null, "center");
      y += 6;

      drawRow("Device", record.device);
      drawRow("Serial No", record.noSiri || "-");
      y += 5;

      doc.setFont("helvetica", "bold");
      doc.rect(10, y, 190, 6);
      doc.text("PROBLEM/REPAIR", 105, y + 4, null, null, "center");
      y += 6;

      drawRow("Problem", record.problem || "-");
      drawRow("Action Taken", record.actionTaken || "-");
      drawRow("Result", record.status || "-");
      y += 10;

      doc.setFont("helvetica", "bold");
      doc.rect(10, y, 190, 6);
      doc.text("SIGNATORY", 105, y + 4, null, null, "center");
      y += 6;

      // Draw signature boxes.
      doc.rect(10, y, 95, 30);
      doc.rect(105, y, 95, 30);
      y += 30;
      doc.rect(10, y, 95, 10);
      doc.rect(105, y, 95, 10);
      doc.setFont("helvetica", "bold");
      doc.text("USER SIGNATURE", 57.5, y + 7, null, null, "center");
      doc.text("TECHNICIAN", 152.5, y + 7, null, null, "center");

      y += 15;
      doc.setFontSize(8).setFont("helvetica", "normal");
      doc.text("CAWANGAN TEKNOLOGI MAKLUMAT, BAHAGIAN TELEKOMUNIKASI SISTEM MAKLUMAT,", 105, y, null, null, "center");
      doc.text("JABATAN SUMBER STRATEGIK & TEKNOLOGI (StaRT),", 105, y + 4, null, null, "center");
      doc.text("IPK SELANGOR, 40100 SEKSYEN 5, SHAH ALAM, SELANGOR DARUL EHSAN", 105, y + 8, null, null, "center");
      doc.text("NO FAX: 03-55145045", 105, y + 12, null, null, "center");
    });

    doc.save("EquipmentReportPDRM.pdf");
  };

  const handleExportExcel = () => {
    // Filter records by selected year
    const filteredRecords = equipmentRecords.filter(record => 
      record.year === selectedYear
    );

    if (filteredRecords.length === 0) {
      alert("No records found for the selected year.");
      return;
    }

    // Prepare data for Excel - include all table columns
    const excelData = filteredRecords.map(record => ({
      'BIL': record.bil || '',
      'No. Resit': record.noResit || '',
      'Nama': record.name || '',
      'Lokasi': record.location || '',
      'Peralatan': record.device || '',
      'Masalah': record.problem || '',
      'Tindakan': record.actionTaken || '',
      'Status': record.status || '',
      'Technician': record.technician || '',
      'Tarikh Selesai': record.submissionDate || '',
      'Tarikh Keluar': record.exitDate || '',
      'Cawangan': record.branch || '',
      'No. Siri': record.noSiri || '',
      'No. Kew PA': record.noKewPA || '',
      'No. Report': record.noReport || '',
      'Tempoh Warranty': record.warrantyPeriod || '',
      'Tarikh Diresit': record.receiptDate || ''
    }));

    // Create worksheet
    const ws = XLSXUtils.json_to_sheet(excelData);

    // Set column widths for better readability
    const colWidths = [
      { wch: 5 },   // BIL
      { wch: 10 },  // No. Resit
      { wch: 25 },  // Nama
      { wch: 25 },  // Lokasi
      { wch: 25 },  // Peralatan
      { wch: 40 },  // Masalah
      { wch: 50 },  // Tindakan
      { wch: 15 },  // Status
      { wch: 20 },  // Technician
      { wch: 15 },  // Tarikh Selesai
      { wch: 15 },  // Tarikh Keluar
      { wch: 25 },  // Cawangan
      { wch: 15 },  // No. Siri
      { wch: 15 },  // No. Kew PA
      { wch: 15 },  // No. Report
      { wch: 15 },  // Tempoh Warranty
      { wch: 15 }   // Tarikh Diresit
    ];
    ws['!cols'] = colWidths;

    // Add header style
    const headerStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "CCCCCC" } },
      alignment: { horizontal: "center" }
    };

    // Apply header style to first row
    const range = XLSXUtils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = XLSXUtils.encode_cell({ r: 0, c: C });
      if (!ws[cell]) ws[cell] = { v: "" };
      ws[cell].s = headerStyle;
    }

    // Create workbook
    const wb = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(wb, ws, `Equipment Report ${selectedYear}`);

    // Save file
    writeFile(wb, `EquipmentReport_${selectedYear}.xlsx`);
  };

  // Pagination math
  const totalPages = Math.ceil(equipmentRecords.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = equipmentRecords.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navigation />
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-6">
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        </div>
      </header>
      <main className="flex-grow p-6">
        <div className="max-w-7xl mx-auto bg-white rounded shadow p-6">
          {/* Filters */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              ICT Equipment Reports
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

          {/* Export Buttons */}
          <div className="flex justify-end space-x-4 mb-4">
            <button
              onClick={handleExportExcel}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Export Table to Excel
            </button>
            <button
              onClick={handleGeneratePDF}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Generate Selected PDF
            </button>
          </div>
          {/* Display selected year */}
            <div className="flex-1 text-center">
              <span className="font-bold text-gray-900 text-xl">Year: {selectedYear}</span>
            </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300 text-sm bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-900 uppercase">Select</th>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                      Loading equipment...
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((eq) => (
                    <tr key={`${eq.year}-${eq.id}`} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={selectedIds.includes(eq.id)}
                          onChange={() => handleCheckboxChange(eq.id)}
                        />
                      </td>
                      <td className="px-4 py-2 text-gray-900">{eq.bil}</td>
                      <td className="px-4 py-2 text-gray-900">{eq.noResit}</td>
                      <td className="px-4 py-2 text-gray-900">{eq.name}</td>
                      <td className="px-4 py-2 text-gray-900">{eq.location}</td>
                      <td className="px-4 py-2 text-gray-900">{eq.device}</td>
                      <td className="px-4 py-2 text-gray-900">{eq.problem}</td>
                      <td className="px-4 py-2 text-gray-900">{eq.actionTaken || ""}</td>
                      <td className="px-4 py-2 text-gray-900">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          eq.status === "Operational" ? "bg-green-100 text-green-800" : 
                          eq.status === "Unserviceable" ? "bg-yellow-100 text-yellow-800" : 
                          eq.status === "Disposed" ? "bg-red-100 text-red-800" :
                          eq.status === "Fixed" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {eq.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-900">{eq.technician}</td>
                      <td className="px-4 py-2 text-gray-900">{eq.submissionDate}</td>
                      <td className="px-4 py-2 text-gray-900">{eq.exitDate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                      No equipment found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {equipmentRecords.length > itemsPerPage && (
            <div className="flex justify-center mt-4 space-x-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className={`px-4 py-2 rounded-md text-sm ${
                  currentPage === 1
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
                className={`px-4 py-2 rounded-md text-sm ${
                  currentPage === totalPages
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
      <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-600">
          <p>SERVING TECHNOLOGY BETTER</p>
          <p className="mt-1">
            &copy; {new Date().getFullYear()} PDRM Selangor ICT Equipment Maintenance System.
            All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}