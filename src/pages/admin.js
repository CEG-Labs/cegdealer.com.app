// pages/admin.js - Admin Panel with Roster Export
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";

const API = process.env.NEXT_PUBLIC_API_URL;
const ITEMS_PER_PAGE = 25;

const AdminPanel = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showRosterExport, setShowRosterExport] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/users`);
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    if (!searchTerm.trim()) {
      setFilteredStudents(students);
      setCurrentPage(1);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = students.filter(
      (student) =>
        (student.firstName && student.firstName.toLowerCase().includes(term)) ||
        (student.lastName && student.lastName.toLowerCase().includes(term)) ||
        (student.email && student.email.toLowerCase().includes(term))
    );
    setFilteredStudents(filtered);
    setCurrentPage(1);
  };

  const calculateTotalHours = (sessions) => {
    if (!sessions || sessions.length === 0) return 0;
    return sessions.reduce((total, session) => total + (session.hours || 0), 0);
  };

  const getFullName = (student) => {
    return `${student.firstName || ""} ${student.lastName || ""}`.trim();
  };

  const deleteStudent = async (id) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
      const response = await fetch(`${API}/users/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchStudents();
      }
    } catch (err) {
      setError("Failed to delete student");
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleSelectAll = () => {
    const currentPageStudents = paginatedStudents.map((s) => s._id);
    const allSelected = currentPageStudents.every((id) =>
      selectedStudents.includes(id)
    );

    if (allSelected) {
      setSelectedStudents((prev) =>
        prev.filter((id) => !currentPageStudents.includes(id))
      );
    } else {
      setSelectedStudents((prev) => [
        ...new Set([...prev, ...currentPageStudents]),
      ]);
    }
  };

  const exportSelectedStudents = async () => {
    if (selectedStudents.length === 0) {
      alert("Please select at least one student to export");
      return;
    }

    setExporting(true);
    try {
      const studentDetailsPromises = selectedStudents.map((id) =>
        fetch(`${API}/users/${id}`).then((r) => r.json())
      );
      const studentDetails = await Promise.all(studentDetailsPromises);

      const csv = generateSessionsCSV(studentDetails);
      downloadCSV(
        csv,
        `student-sessions-${new Date().toISOString().split("T")[0]}.csv`
      );
    } catch (err) {
      setError("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const generateSessionsCSV = (students) => {
    const headers = [
      "Student Name",
      "PIN",
      "Email",
      "Check-in Date/Time",
      "Check-out Date/Time",
      "Hours",
    ];
    const rows = [headers];

    students.forEach((student) => {
      if (student.sessions && student.sessions.length > 0) {
        student.sessions.forEach((session) => {
          rows.push([
            getFullName(student),
            student.pin || "",
            student.email || "",
            session.checkin ? new Date(session.checkin).toLocaleString() : "",
            session.checkout
              ? new Date(session.checkout).toLocaleString()
              : "In Progress",
            session.hours ? session.hours.toFixed(2) : "",
          ]);
        });
      }
    });

    return rows
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getPaginationRange = () => {
    const range = [];
    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  };

  if (loading && students.length === 0) {
    return (
      <>
        <Head>
          <title>Admin Panel</title>
        </Head>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Panel - Student Management</title>
        <meta name="description" content="Admin panel for student management" />
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Navigation */}
        <nav className="bg-blue-600 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">Student Check-in System</h1>
            <div className="space-x-4">
              <Link
                href="/"
                className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-700"
              >
                Student Login
              </Link>
              <Link href="/admin" className="px-4 py-2 rounded bg-blue-800">
                Admin Panel
              </Link>
              <Link
                href="/admin/settings"
                className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-700"
              >
                Settings
              </Link>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="container mx-auto p-4">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                Admin Panel - Student Management
              </h2>
              <div className="space-x-2">
                <button
                  onClick={() => setShowRosterExport(true)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
                >
                  Roster Export
                </button>
                {selectedStudents.length > 0 && (
                  <button
                    onClick={exportSelectedStudents}
                    disabled={exporting}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
                  >
                    {exporting
                      ? "Exporting..."
                      : `Export Selected (${selectedStudents.length})`}
                  </button>
                )}
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Add New Student
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Roster Export Modal */}
            {showRosterExport && (
              <RosterExportModal
                students={students}
                onClose={() => setShowRosterExport(false)}
                getFullName={getFullName}
              />
            )}

            {/* Add/Edit Form */}
            {(showAddForm || editingStudent) && (
              <StudentForm
                student={editingStudent}
                onSave={() => {
                  fetchStudents();
                  setEditingStudent(null);
                  setShowAddForm(false);
                }}
                onCancel={() => {
                  setEditingStudent(null);
                  setShowAddForm(false);
                }}
              />
            )}

            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by first name, last name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Showing {filteredStudents.length} of {students.length} students
              </p>
            </div>

            {/* Students List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            paginatedStudents.length > 0 &&
                            paginatedStudents.every((s) =>
                              selectedStudents.includes(s._id)
                            )
                          }
                          onChange={toggleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PIN
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sessions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedStudents.map((student) => {
                      const totalHours = calculateTotalHours(student.sessions);
                      return (
                        <tr key={student._id}>
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student._id)}
                              onChange={() =>
                                toggleStudentSelection(student._id)
                              }
                              className="rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {getFullName(student)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {student.pin}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {student.email || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {student.status || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {student.sessions?.length || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {totalHours.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Link
                              href={`/admin/student/${student._id}`}
                              className="text-green-600 hover:text-green-900"
                            >
                              History
                            </Link>
                            <button
                              onClick={() => setEditingStudent(student)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteStudent(student._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {paginatedStudents.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm
                    ? "No students found matching your search."
                    : "No students found. Add your first student using the button above."}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {startIndex + 1} to{" "}
                      {Math.min(endIndex, filteredStudents.length)} of{" "}
                      {filteredStudents.length} students
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      {getPaginationRange().map((page) => (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Roster Export Modal Component
const RosterExportModal = ({ students, onClose, getFullName }) => {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [exporting, setExporting] = useState(false);

  const statusOptions = ["Current Student", "Suspended", "Graduate", "Other"];

  const getLastCheckoutDate = (student) => {
    if (!student.sessions || student.sessions.length === 0) return null;

    const sessionsWithCheckout = student.sessions.filter((s) => s.checkout);
    if (sessionsWithCheckout.length === 0) return null;

    const sortedSessions = sessionsWithCheckout.sort(
      (a, b) => new Date(b.checkout) - new Date(a.checkout)
    );

    return sortedSessions[0].checkout;
  };

  const filterStudents = () => {
    let filtered = students;

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Filter by last checkout date
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filterDate.setHours(0, 0, 0, 0);

      filtered = filtered.filter((s) => {
        const lastCheckout = getLastCheckoutDate(s);
        if (!lastCheckout) return false;

        const checkoutDate = new Date(lastCheckout);
        checkoutDate.setHours(0, 0, 0, 0);

        return checkoutDate >= filterDate;
      });
    }

    return filtered;
  };

  const exportRoster = () => {
    setExporting(true);
    const filteredStudents = filterStudents();

    if (filteredStudents.length === 0) {
      alert("No students match the selected filters");
      setExporting(false);
      return;
    }

    const csv = generateRosterCSV(filteredStudents);
    downloadCSV(
      csv,
      `student-roster-${new Date().toISOString().split("T")[0]}.csv`
    );
    setExporting(false);
    onClose();
  };

  const generateRosterCSV = (students) => {
    const headers = [
      "First Name",
      "Last Name",
      "PIN",
      "ID Number",
      "Email",
      "Phone",
      "Street",
      "City",
      "State",
      "Zip Code",
      "Foreign Address",
      "Status",
      "Source",
      "End of Class Date",
      "End of Practice Date",
      "Last Checkout Date",
    ];
    const rows = [headers];

    students.forEach((student) => {
      const lastCheckout = getLastCheckoutDate(student);

      rows.push([
        student.firstName || "",
        student.lastName || "",
        student.pin || "",
        student.idNumber || "",
        student.email || "",
        student.phone || "",
        student.street || "",
        student.city || "",
        student.state || "",
        student.zipCode || "",
        student.foreignAddress || "",
        student.status || "",
        student.source || "",
        student.endOfClassDate
          ? new Date(student.endOfClassDate).toLocaleDateString()
          : "",
        student.endOfPracticeDate
          ? new Date(student.endOfPracticeDate).toLocaleDateString()
          : "",
        lastCheckout ? new Date(lastCheckout).toLocaleString() : "Never",
      ]);
    });

    return rows
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCount = filterStudents().length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Roster Export</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Last Checkout Date (on or after)
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>{filteredCount}</strong> student
              {filteredCount !== 1 ? "s" : ""} will be exported
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={exportRoster}
              disabled={exporting || filteredCount === 0}
              className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {exporting ? "Exporting..." : "Export Roster"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Student Form Component (for Add/Edit)
const StudentForm = ({ student, onSave, onCancel }) => {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const [formData, setFormData] = useState({
    firstName: student?.firstName || "",
    lastName: student?.lastName || "",
    pin: student?.pin || "",
    idNumber: student?.idNumber || "",
    email: student?.email || "",
    phone: student?.phone || "",
    street: student?.street || "",
    city: student?.city || "",
    state: student?.state || "",
    zipCode: student?.zipCode || "",
    foreignAddress: student?.foreignAddress || "",
    status: student?.status || "",
    source: student?.source || "Regular",
    endOfClassDate: student?.endOfClassDate
      ? new Date(student.endOfClassDate).toISOString().split("T")[0]
      : "",
    endOfPracticeDate: student?.endOfPracticeDate
      ? new Date(student.endOfPracticeDate).toISOString().split("T")[0]
      : "",
    roles: student?.roles || ["student"],
    games: student?.games || [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const gameOptions = [
    "craps",
    "roulette",
    "blackjack",
    "baccarat",
    "poker",
    "pai-gow",
    "keno",
    "uth",
    "sic-bo",
  ];
  const statusOptions = [
    "Current Student",
    "Suspended",
    "Graduate",
    "Other",
    "",
  ];
  const stateOptions = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
  ];

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const url = student ? `${API}/users/${student._id}` : `${API}/users`;
      const method = student ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSave();
      } else {
        setError("Failed to save student");
      }
    } catch (err) {
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const handleGameToggle = (game) => {
    setFormData((prev) => ({
      ...prev,
      games: prev.games.includes(game)
        ? prev.games.filter((g) => g !== game)
        : [...prev.games, game],
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">
        {student ? "Edit Student" : "Add New Student"}
      </h3>

      <div className="space-y-4">
        {/* Basic Information */}
        <div className="border-b pb-4">
          <h4 className="font-medium text-gray-700 mb-3">Basic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PIN *
              </label>
              <input
                type="text"
                required
                value={formData.pin}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, pin: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver's License / ID Number
              </label>
              <input
                type="text"
                value={formData.idNumber}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, idNumber: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status || "None"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-b pb-4">
          <h4 className="font-medium text-gray-700 mb-3">
            Contact Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* US Address */}
        <div className="border-b pb-4">
          <h4 className="font-medium text-gray-700 mb-3">US Address</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, street: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, city: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                value={formData.state}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, state: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select State</option>
                {stateOptions.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zip Code
              </label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, zipCode: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Foreign Address */}
        <div className="border-b pb-4">
          <h4 className="font-medium text-gray-700 mb-3">
            Foreign Address (if applicable)
          </h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Address
            </label>
            <textarea
              value={formData.foreignAddress}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  foreignAddress: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter complete foreign address"
            />
          </div>
        </div>

        {/* Date Restrictions */}
        <div className="border-b pb-4">
          <h4 className="font-medium text-gray-700 mb-3">Date Restrictions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End of Class Date
              </label>
              <input
                type="date"
                value={formData.endOfClassDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    endOfClassDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End of Practice Date
              </label>
              <input
                type="date"
                value={formData.endOfPracticeDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    endOfPracticeDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Games */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Games
          </label>
          <div className="grid grid-cols-3 gap-2">
            {gameOptions.map((game) => (
              <label key={game} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.games.includes(game)}
                  onChange={() => handleGameToggle(game)}
                  className="rounded"
                />
                <span className="text-sm capitalize">{game}</span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
