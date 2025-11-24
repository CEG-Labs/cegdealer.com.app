// pages/admin/student/[id].js - Student Session History Page with Split Names
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";

const API = process.env.NEXT_PUBLIC_API_URL;

const StudentHistory = () => {
  const router = useRouter();
  const { id } = router.query;
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    if (id) {
      fetchStudentHistory();
    }
  }, [id]);

  const fetchStudentHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/users/${id}`);
      if (response.ok) {
        const data = await response.json();
        setStudent(data);
      } else {
        setError("Student not found");
      }
    } catch (err) {
      setError("Failed to fetch student data");
    } finally {
      setLoading(false);
    }
  };

  const getFullName = (student) => {
    return `${student.firstName || ""} ${student.lastName || ""}`.trim();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const checkinDate = new Date(dateString);
    const diffInMs = now - checkinDate;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  const deleteSession = async (sessionIndex) => {
    if (!confirm("Are you sure you want to delete this session record?"))
      return;

    try {
      const response = await fetch(
        `${API}/users/${id}/session/${sessionIndex}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        fetchStudentHistory();
      } else {
        setError("Failed to delete session record");
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
      const endDate = dateRange.end
        ? new Date(dateRange.end + "T23:59:59")
        : null;

      if (startDate && checkinDate < startDate) return false;
      if (endDate && checkinDate > endDate) return false;
      return true;
    });
  };

  const exportSessions = () => {
    if (!student || !student.sessions || student.sessions.length === 0) {
      alert("No sessions to export");
      return;
    }

    const sessionsToExport = filterSessionsByDateRange(student.sessions);

    if (sessionsToExport.length === 0) {
      alert("No sessions found in the selected date range");
      return;
    }

    const csv = generateCSV([
      {
        ...student,
        sessions: sessionsToExport,
      },
    ]);

    const filename = `${getFullName(student).replace(/\s+/g, "-")}-sessions-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    downloadCSV(csv, filename);
  };

  const generateCSV = (students) => {
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

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Student History...</title>
        </Head>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      </>
    );
  }

  if (error || !student) {
    return (
      <>
        <Head>
          <title>Student Not Found</title>
        </Head>
        <div className="min-h-screen bg-gray-100">
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
                <Link
                  href="/admin"
                  className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-700"
                >
                  Admin Panel
                </Link>
              </div>
            </div>
          </nav>
          <div className="container mx-auto p-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
              <p className="text-gray-700 mb-4">{error}</p>
              <Link
                href="/admin"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Back to Admin Panel
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const sortedSessions = [...(student.sessions || [])].sort(
    (a, b) => new Date(b.checkin) - new Date(a.checkin)
  );
  const filteredSessions = filterSessionsByDateRange(sortedSessions);
  const totalHours = filteredSessions.reduce(
    (sum, session) => sum + (session.hours || 0),
    0
  );

  return (
    <>
      <Head>
        <title>{getFullName(student)} - Session History</title>
        <meta
          name="description"
          content={`Session history for ${getFullName(student)}`}
        />
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
              <Link
                href="/admin"
                className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-700"
              >
                Admin Panel
              </Link>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="container mx-auto p-4">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <Link
                  href="/admin"
                  className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
                >
                  ← Back to Admin Panel
                </Link>
                <h2 className="text-3xl font-bold text-gray-900">
                  {getFullName(student)}
                </h2>
                <p className="text-gray-600">Session History</p>
              </div>
            </div>

            {/* Student Info Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">
                Student Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Name:
                  </span>
                  <p className="text-gray-900">{getFullName(student)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    PIN:
                  </span>
                  <p className="text-gray-900">{student.pin || "Not set"}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Email:
                  </span>
                  <p className="text-gray-900">
                    {student.email || "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Phone:
                  </span>
                  <p className="text-gray-900">
                    {student.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Status:
                  </span>
                  <p className="text-gray-900">{student.status || "N/A"}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Total Sessions:
                  </span>
                  <p className="text-gray-900 font-semibold">
                    {student.sessions?.length || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Date Range Filter and Export */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Filter & Export</h3>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, end: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDateRange({ start: "", end: "" })}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Clear Filter
                  </button>
                  <button
                    onClick={exportSessions}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Export to CSV
                  </button>
                </div>
              </div>
              {(dateRange.start || dateRange.end) && (
                <p className="text-sm text-gray-600 mt-2">
                  Showing {filteredSessions.length} of {sortedSessions.length}{" "}
                  sessions
                </p>
              )}
            </div>

            {/* Session History */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Session History</h3>
              </div>

              {filteredSessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {sortedSessions.length === 0
                    ? "No sessions recorded yet."
                    : "No sessions found in the selected date range."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Check-in
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Check-out
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hours
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time Ago
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSessions.map((session, index) => {
                        const originalIndex = sortedSessions.indexOf(session);
                        const isActive = !session.checkout;
                        const isLatest = index === 0;

                        return (
                          <tr
                            key={originalIndex}
                            className={isLatest ? "bg-green-50" : ""}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {isLatest && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                                    Latest
                                  </span>
                                )}
                                {isActive && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-2">
                                    Active
                                  </span>
                                )}
                                {filteredSessions.length - index}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(session.checkin)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div
                                className={`text-sm ${
                                  isActive
                                    ? "text-yellow-600 font-medium"
                                    : "text-gray-900"
                                }`}
                              >
                                {session.checkout
                                  ? formatDate(session.checkout)
                                  : "In Progress"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">
                                {session.hours ? session.hours.toFixed(2) : "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {getTimeAgo(session.checkin)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() =>
                                  deleteSession(
                                    student.sessions.indexOf(session)
                                  )
                                }
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
              )}
            </div>

            {/* Summary Stats */}
            {filteredSessions.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Summary Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {filteredSessions.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Sessions</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {totalHours.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Total Hours</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatDate(filteredSessions[0].checkin).split(",")[0]}
                    </div>
                    <div className="text-sm text-gray-600">Last Session</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {(totalHours / filteredSessions.length).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Avg Hours/Session
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentHistory;
