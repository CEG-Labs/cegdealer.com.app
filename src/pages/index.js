// pages/index.js - Student Login with Split Name Fields
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";

const API = process.env.NEXT_PUBLIC_API_URL;

const StudentLogin = () => {
  const [pin, setPin] = useState("");
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [settings, setSettings] = useState(null);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API}/settings`);
      const data = await response.json();
      setSettings(
        data[0] || {
          blockedStatuses: ["Suspended"],
          enforceClassEndDate: false,
          enforcePracticeEndDate: false,
        }
      );
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      setSettings({
        blockedStatuses: ["Suspended"],
        enforceClassEndDate: false,
        enforcePracticeEndDate: false,
      });
    }
  };

  const getFullName = (student) => {
    return `${student.firstName || ""} ${student.lastName || ""}`.trim();
  };

  const validateStudent = (studentData) => {
    if (!settings) return { valid: true };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check blocked statuses
    if (settings.blockedStatuses && settings.blockedStatuses.length > 0) {
      if (
        studentData.status &&
        settings.blockedStatuses.includes(studentData.status)
      ) {
        return {
          valid: false,
          message: `Students with status "${studentData.status}" are not allowed to check in.`,
        };
      }
    }

    // Check end of class date
    if (settings.enforceClassEndDate && studentData.endOfClassDate) {
      const endOfClassDate = new Date(studentData.endOfClassDate);
      endOfClassDate.setHours(0, 0, 0, 0);
      if (today > endOfClassDate) {
        return {
          valid: false,
          message:
            "Your class end date has passed. Please contact administration.",
        };
      }
    }

    // Check end of practice date
    if (settings.enforcePracticeEndDate && studentData.endOfPracticeDate) {
      const endOfPracticeDate = new Date(studentData.endOfPracticeDate);
      endOfPracticeDate.setHours(0, 0, 0, 0);
      if (today > endOfPracticeDate) {
        return {
          valid: false,
          message:
            "Your practice end date has passed. Please contact administration.",
        };
      }
    }

    return { valid: true };
  };

  const handlePinSubmit = async () => {
    if (!pin) return;

    setLoading(true);
    setError("");
    setValidationError("");

    try {
      const response = await fetch(`${API}/users?pin=${pin}`);
      const data = await response.json();

      if (response.ok && data.length > 0) {
        const foundStudent = data[0];

        // Validate student before allowing check-in/out
        const validation = validateStudent(foundStudent);
        if (!validation.valid) {
          setValidationError(validation.message);
          setStudent(null);
          setLoading(false);
          return;
        }

        setStudent(foundStudent);

        // Check if student has an active session
        const activeSessions = foundStudent.sessions?.filter(
          (session) => session.checkin && !session.checkout
        );
        setHasActiveSession(activeSessions && activeSessions.length > 0);
      } else {
        setError("Student not found. Please check your PIN.");
        setStudent(null);
      }
    } catch (err) {
      setError("Error connecting to server.");
      setStudent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (!student) return;

    // Double-check validation before check-in
    const validation = validateStudent(student);
    if (!validation.valid) {
      setValidationError(validation.message);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API}/users/${student._id}/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setSuccess("Check-in successful!");
        setStudent(null);
        setPin("");
        setHasActiveSession(false);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to check in. Please try again.");
      }
    } catch (err) {
      setError("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!student) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API}/users/${student._id}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setSuccess("Check-out successful!");
        setStudent(null);
        setPin("");
        setHasActiveSession(false);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to check out. Please try again.");
      }
    } catch (err) {
      setError("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Student Check-in</title>
        <meta name="description" content="Student check-in system" />
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Navigation */}
        <nav className="bg-blue-600 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">Student Check-in System</h1>
            <div className="space-x-4">
              <Link href="/" className="px-4 py-2 rounded bg-blue-800">
                Student Login
              </Link>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="container mx-auto p-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-center mb-6">
              Student Check-in
            </h2>

            {!student ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your PIN:
                  </label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter PIN"
                    disabled={loading}
                    onKeyPress={(e) => e.key === "Enter" && handlePinSubmit()}
                  />
                </div>
                <button
                  onClick={handlePinSubmit}
                  disabled={loading || !pin}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Checking..." : "Find Student"}
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h3 className="text-lg font-semibold text-blue-800">
                    Welcome!
                  </h3>
                  <p className="text-blue-700 text-xl font-medium">
                    {getFullName(student)}
                  </p>
                  {hasActiveSession && (
                    <p className="text-sm text-blue-600 mt-2">
                      You have an active session
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  {!hasActiveSession ? (
                    <button
                      onClick={handleCheckin}
                      disabled={loading}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
                    >
                      {loading ? "Checking in..." : "Confirm Check-in"}
                    </button>
                  ) : (
                    <button
                      onClick={handleCheckout}
                      disabled={loading}
                      className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 font-medium"
                    >
                      {loading ? "Checking out..." : "Check Out"}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setStudent(null);
                      setPin("");
                      setError("");
                      setValidationError("");
                      setHasActiveSession(false);
                    }}
                    className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {validationError && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800 text-sm font-medium">
                  {validationError}
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentLogin;
