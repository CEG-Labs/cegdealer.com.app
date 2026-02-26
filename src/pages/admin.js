// pages/admin.js - Admin Panel with Filtering and Export
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";

const API = process.env.NEXT_PUBLIC_API_URL;
const ITEMS_PER_PAGE = 25;

const GAME_DISPLAY_NAMES = {
  sr: "SR",
  uth: "UTH",
};

const getGameDisplayName = (game) =>
  GAME_DISPLAY_NAMES[game] || game.charAt(0).toUpperCase() + game.slice(1);

const AdminPanel = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [gameFilter, setGameFilter] = useState("");
  const [registrationDateFilter, setRegistrationDateFilter] = useState("");
  const [endOfClassDateFilter, setEndOfClassDateFilter] = useState("");
  const [endOfPracticeDateFilter, setEndOfPracticeDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [sortColumn, setSortColumn] = useState("lastName");
  const [sortDirection, setSortDirection] = useState("asc");
  const [historyStudent, setHistoryStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, statusFilter, gameFilter, registrationDateFilter, endOfClassDateFilter, endOfPracticeDateFilter, students]);

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
    let filtered = students;

    // Text search: name or email
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          (student.firstName && student.firstName.toLowerCase().includes(term)) ||
          (student.lastName && student.lastName.toLowerCase().includes(term)) ||
          (student.email && student.email.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Game filter
    if (gameFilter) {
      filtered = filtered.filter(
        (s) => s.games && s.games.includes(gameFilter)
      );
    }

    // Registration date filter (on or after)
    if (registrationDateFilter) {
      const filterDate = new Date(registrationDateFilter);
      filterDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((s) => {
        if (!s.registrationDate) return false;
        const regDate = new Date(s.registrationDate);
        regDate.setHours(0, 0, 0, 0);
        return regDate >= filterDate;
      });
    }

    // End of class date filter (on or after)
    if (endOfClassDateFilter) {
      const filterDate = new Date(endOfClassDateFilter);
      filterDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((s) => {
        if (!s.endOfClassDate) return false;
        const classDate = new Date(s.endOfClassDate);
        classDate.setHours(0, 0, 0, 0);
        return classDate >= filterDate;
      });
    }

    // End of practice date filter (on or after)
    if (endOfPracticeDateFilter) {
      const filterDate = new Date(endOfPracticeDateFilter);
      filterDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((s) => {
        if (!s.endOfPracticeDate) return false;
        const practiceDate = new Date(s.endOfPracticeDate);
        practiceDate.setHours(0, 0, 0, 0);
        return practiceDate >= filterDate;
      });
    }

    setFilteredStudents(filtered);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || statusFilter || gameFilter || registrationDateFilter || endOfClassDateFilter || endOfPracticeDateFilter;

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setGameFilter("");
    setRegistrationDateFilter("");
    setEndOfClassDateFilter("");
    setEndOfPracticeDateFilter("");
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortedStudents = (list) => {
    return [...list].sort((a, b) => {
      let aVal, bVal;

      switch (sortColumn) {
        case "name":
          aVal = `${a.lastName || ""} ${a.firstName || ""}`.toLowerCase();
          bVal = `${b.lastName || ""} ${b.firstName || ""}`.toLowerCase();
          break;
        case "pin":
          aVal = a.pin || "";
          bVal = b.pin || "";
          break;
        case "email":
          aVal = (a.email || "").toLowerCase();
          bVal = (b.email || "").toLowerCase();
          break;
        case "status":
          aVal = (a.status || "").toLowerCase();
          bVal = (b.status || "").toLowerCase();
          break;
        case "sessions":
          aVal = a.sessions?.length || 0;
          bVal = b.sessions?.length || 0;
          break;
        case "hours":
          aVal = calculateTotalHours(a.sessions);
          bVal = calculateTotalHours(b.sessions);
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const SortHeader = ({ column, children }) => (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortColumn === column && (
          <span className="text-blue-600">{sortDirection === "asc" ? "\u25B2" : "\u25BC"}</span>
        )}
      </div>
    </th>
  );

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

  const getLastCheckoutDate = (student) => {
    if (!student.sessions || student.sessions.length === 0) return null;
    const sessionsWithCheckout = student.sessions.filter((s) => s.checkout);
    if (sessionsWithCheckout.length === 0) return null;
    const sortedSessions = sessionsWithCheckout.sort(
      (a, b) => new Date(b.checkout) - new Date(a.checkout)
    );
    return sortedSessions[0].checkout;
  };

  const exportRoster = () => {
    if (filteredStudents.length === 0) {
      alert("No students to export");
      return;
    }
    const csv = generateRosterCSV(filteredStudents);
    downloadCSV(csv, `student-roster-${new Date().toISOString().split("T")[0]}.csv`);
    setShowExportMenu(false);
  };

  const exportSessions = () => {
    if (filteredStudents.length === 0) {
      alert("No students to export");
      return;
    }
    const csv = generateSessionsCSV(filteredStudents);
    downloadCSV(csv, `student-sessions-${new Date().toISOString().split("T")[0]}.csv`);
    setShowExportMenu(false);
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
      "Registration Date",
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
        student.registrationDate
          ? new Date(student.registrationDate).toLocaleDateString()
          : "",
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

  // Sort then paginate
  const sortedStudents = getSortedStudents(filteredStudents);
  const totalPages = Math.ceil(sortedStudents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedStudents = sortedStudents.slice(startIndex, endIndex);

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
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 inline-flex items-center"
                  >
                    Export ({filteredStudents.length})
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showExportMenu && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                      <button
                        onClick={exportRoster}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md"
                      >
                        Export Roster
                      </button>
                      <button
                        onClick={exportSessions}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md"
                      >
                        Export Sessions
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setEditingStudent(null);
                    setHistoryStudent(null);
                    setShowAddForm(true);
                    setDrawerOpen(true);
                  }}
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

            {/* Slide-out Drawer */}
            <div
              className={`fixed inset-0 z-40 transition-opacity duration-300 ${
                drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/20"
                onClick={() => {
                  setDrawerOpen(false);
                  setTimeout(() => {
                    setEditingStudent(null);
                    setShowAddForm(false);
                    setHistoryStudent(null);
                  }, 300);
                }}
              />

              {/* Drawer panel */}
              <div
                className={`absolute top-0 right-0 h-full w-full max-w-2xl bg-white shadow-xl transform transition-transform duration-300 ${
                  drawerOpen ? "translate-x-0" : "translate-x-full"
                }`}
              >
                {/* Drawer header with X */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">
                    {historyStudent
                      ? `${getFullName(historyStudent)} - History`
                      : editingStudent
                      ? "Edit Student"
                      : "Add New Student"}
                  </h3>
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      setTimeout(() => {
                        setEditingStudent(null);
                        setShowAddForm(false);
                        setHistoryStudent(null);
                      }, 300);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Drawer body */}
                <div className="overflow-y-auto h-[calc(100%-65px)]">
                  {historyStudent && (
                    <StudentHistoryPanel
                      key={`history-${historyStudent._id}`}
                      studentId={historyStudent._id}
                      getFullName={getFullName}
                      onRefresh={fetchStudents}
                    />
                  )}
                  {(showAddForm || editingStudent) && !historyStudent && (
                    <StudentForm
                      key={editingStudent?._id || "new"}
                      student={editingStudent}
                      onSave={() => {
                        fetchStudents();
                        setDrawerOpen(false);
                        setTimeout(() => {
                          setEditingStudent(null);
                          setShowAddForm(false);
                        }, 300);
                      }}
                      onCancel={() => {
                        setDrawerOpen(false);
                        setTimeout(() => {
                          setEditingStudent(null);
                          setShowAddForm(false);
                        }, 300);
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 space-y-3">
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
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 whitespace-nowrap"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="Current Student">Current Student</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Graduate">Graduate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Game</label>
                  <select
                    value={gameFilter}
                    onChange={(e) => setGameFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Games</option>
                    {["craps", "roulette", "blackjack", "baccarat", "poker", "pai-gow", "keno", "uth", "sic-bo", "sr"].map((game) => (
                      <option key={game} value={game}>
                        {getGameDisplayName(game)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Registration (after)</label>
                  <input
                    type="date"
                    value={registrationDateFilter}
                    onChange={(e) => setRegistrationDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">End of Class (after)</label>
                  <input
                    type="date"
                    value={endOfClassDateFilter}
                    onChange={(e) => setEndOfClassDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">End of Practice (after)</label>
                  <input
                    type="date"
                    value={endOfPracticeDateFilter}
                    onChange={(e) => setEndOfPracticeDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Showing {filteredStudents.length} of {students.length} students
              </p>
            </div>

            {/* Students List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <SortHeader column="name">Name</SortHeader>
                      <SortHeader column="pin">PIN</SortHeader>
                      <SortHeader column="email">Email</SortHeader>
                      <SortHeader column="status">Status</SortHeader>
                      <SortHeader column="sessions">Sessions</SortHeader>
                      <SortHeader column="hours">Total Hours</SortHeader>
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
                            <button
                              onClick={() => {
                                setEditingStudent(null);
                                setShowAddForm(false);
                                setHistoryStudent(student);
                                setDrawerOpen(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              History
                            </button>
                            <button
                              onClick={() => {
                                setShowAddForm(false);
                                setHistoryStudent(null);
                                setEditingStudent(student);
                                setDrawerOpen(true);
                              }}
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
                  {hasActiveFilters
                    ? "No students found matching your filters."
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

// Student History Panel Component (for drawer)
const StudentHistoryPanel = ({ studentId, getFullName, onRefresh }) => {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    fetchStudent();
  }, [studentId]);

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/users/${studentId}`);
      if (response.ok) {
        setStudent(await response.json());
      } else {
        setError("Student not found");
      }
    } catch (err) {
      setError("Failed to fetch student data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const deleteSession = async (sessionIndex) => {
    if (!confirm("Are you sure you want to delete this session record?")) return;
    try {
      const response = await fetch(`${API}/users/${studentId}/session/${sessionIndex}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchStudent();
        onRefresh();
      } else {
        setError("Failed to delete session");
      }
    } catch (err) {
      setError("Error connecting to server");
    }
  };

  const filterSessionsByDateRange = (sessions) => {
    if (!dateRange.start && !dateRange.end) return sessions;
    return sessions.filter((session) => {
      const checkinDate = new Date(session.checkin);
      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end + "T23:59:59") : null;
      if (startDate && checkinDate < startDate) return false;
      if (endDate && checkinDate > endDate) return false;
      return true;
    });
  };

  const exportSessions = () => {
    if (!student?.sessions?.length) return;
    const sessionsToExport = filterSessionsByDateRange(student.sessions);
    if (sessionsToExport.length === 0) {
      alert("No sessions in the selected date range");
      return;
    }
    const headers = ["Check-in", "Check-out", "Hours"];
    const rows = [headers];
    sessionsToExport.forEach((s) => {
      rows.push([
        s.checkin ? new Date(s.checkin).toLocaleString() : "",
        s.checkout ? new Date(s.checkout).toLocaleString() : "In Progress",
        s.hours ? s.hours.toFixed(2) : "",
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `${getFullName(student).replace(/\s+/g, "-")}-sessions.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>;
  if (error || !student) return <div className="p-6 text-center text-red-600">{error}</div>;

  const sortedSessions = [...(student.sessions || [])].sort(
    (a, b) => new Date(b.checkin) - new Date(a.checkin)
  );
  const filteredSessions = filterSessionsByDateRange(sortedSessions);
  const totalHours = filteredSessions.reduce((sum, s) => sum + (s.hours || 0), 0);

  return (
    <div className="p-6 space-y-4">
      {/* Student info summary */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <span className="text-gray-500">PIN:</span>
          <p className="font-medium">{student.pin}</p>
        </div>
        <div>
          <span className="text-gray-500">Status:</span>
          <p className="font-medium">{student.status || "N/A"}</p>
        </div>
        <div>
          <span className="text-gray-500">Email:</span>
          <p className="font-medium">{student.email || "N/A"}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-600">{filteredSessions.length}</div>
          <div className="text-xs text-gray-600">Sessions</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-xl font-bold text-purple-600">{totalHours.toFixed(2)}</div>
          <div className="text-xs text-gray-600">Total Hours</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-xl font-bold text-green-600">
            {filteredSessions.length > 0 ? (totalHours / filteredSessions.length).toFixed(2) : "0"}
          </div>
          <div className="text-xs text-gray-600">Avg Hours</div>
        </div>
      </div>

      {/* Date filter & export */}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs text-gray-500 mb-1">Start Date</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs text-gray-500 mb-1">End Date</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={() => setDateRange({ start: "", end: "" })}
              className="px-3 py-1.5 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600"
            >
              Clear
            </button>
          )}
          <button
            onClick={exportSessions}
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Sessions table */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          {sortedSessions.length === 0 ? "No sessions recorded." : "No sessions in the selected date range."}
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check-in</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check-out</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSessions.map((session, index) => {
                const isActive = !session.checkout;
                return (
                  <tr key={index} className={index === 0 ? "bg-green-50" : ""}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {index === 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-1">
                          Latest
                        </span>
                      )}
                      {isActive && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-1">
                          Active
                        </span>
                      )}
                      {filteredSessions.length - index}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{formatDate(session.checkin)}</td>
                    <td className={`px-4 py-2 whitespace-nowrap ${isActive ? "text-yellow-600 font-medium" : ""}`}>
                      {session.checkout ? formatDate(session.checkout) : "In Progress"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap font-semibold">
                      {session.hours ? session.hours.toFixed(2) : "-"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <button
                        onClick={() => deleteSession(student.sessions.indexOf(session))}
                        className="text-red-600 hover:text-red-900 text-xs"
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
      )}
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
    registrationDate: student?.registrationDate
      ? new Date(student.registrationDate).toISOString().split("T")[0]
      : "",
    roles: student?.roles || ["student"],
    games: student?.games || [],
    notes: student?.notes || "",
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
    "sr",
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
    <div className="p-6">
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
                Drivers License / ID Number
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

        {/* Registration & Date Restrictions */}
        <div className="border-b pb-4">
          <h4 className="font-medium text-gray-700 mb-3">Dates</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Date
              </label>
              <input
                type="date"
                value={formData.registrationDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    registrationDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

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
                <span className="text-sm">{getGameDisplayName(game)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional notes about this student..."
          />
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
