// pages/admin/settings.js - Admin Settings Page
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";

const API = process.env.NEXT_PUBLIC_API_URL;

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    _id: null,
    blockedStatuses: [],
    enforceClassEndDate: false,
    enforcePracticeEndDate: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const allStatuses = ["Current Student", "Suspended", "Graduate", "Other"];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/settings`);
      const data = await response.json();

      if (data && data.length > 0) {
        setSettings(data[0]);
      } else {
        // No settings exist yet, will create on first save
        setSettings({
          _id: null,
          blockedStatuses: ["Suspended"],
          enforceClassEndDate: false,
          enforcePracticeEndDate: false,
        });
      }
    } catch (err) {
      setError("Failed to fetch settings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const url = settings._id
        ? `${API}/settings/${settings._id}`
        : `${API}/settings`;
      const method = settings._id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blockedStatuses: settings.blockedStatuses,
          enforceClassEndDate: settings.enforceClassEndDate,
          enforcePracticeEndDate: settings.enforcePracticeEndDate,
          updatedAt: new Date(),
        }),
      });

      if (response.ok) {
        const savedSettings = await response.json();
        setSettings(savedSettings);
        setSuccess("Settings saved successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to save settings");
      }
    } catch (err) {
      setError("Error connecting to server");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = (status) => {
    setSettings((prev) => ({
      ...prev,
      blockedStatuses: prev.blockedStatuses.includes(status)
        ? prev.blockedStatuses.filter((s) => s !== status)
        : [...prev.blockedStatuses, status],
    }));
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Settings - Admin Panel</title>
        </Head>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">Loading settings...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Settings - Admin Panel</title>
        <meta name="description" content="Configure check-in system settings" />
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
              <Link
                href="/admin/settings"
                className="px-4 py-2 rounded bg-blue-800"
              >
                Settings
              </Link>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="container mx-auto p-4">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <Link
                href="/admin"
                className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
              >
                ← Back to Admin Panel
              </Link>
              <h2 className="text-3xl font-bold text-gray-900">
                System Settings
              </h2>
              <p className="text-gray-600 mt-1">
                Configure check-in restrictions and validations
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-700">{success}</p>
              </div>
            )}

            {/* Blocked Statuses */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Blocked Statuses</h3>
              <p className="text-sm text-gray-600 mb-4">
                Students with these statuses will not be allowed to check in.
              </p>
              <div className="space-y-3">
                {allStatuses.map((status) => (
                  <label
                    key={status}
                    className="flex items-center space-x-3 p-3 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={settings.blockedStatuses.includes(status)}
                      onChange={() => toggleStatus(status)}
                      className="rounded h-5 w-5 text-blue-600"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">
                        {status}
                      </span>
                      {status === "Suspended" && (
                        <p className="text-xs text-gray-500">
                          Recommended: Block suspended students from checking in
                        </p>
                      )}
                      {status === "Graduate" && (
                        <p className="text-xs text-gray-500">
                          Optionally block graduates from checking in
                        </p>
                      )}
                    </div>
                    {settings.blockedStatuses.includes(status) && (
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                        Blocked
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Date Enforcement */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">
                Date-Based Restrictions
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Enforce end dates configured in each student&apos;s profile.
              </p>
              <div className="space-y-4">
                <label className="flex items-start space-x-3 p-4 rounded-md border-2 border-gray-200 hover:border-blue-300 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.enforceClassEndDate}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        enforceClassEndDate: e.target.checked,
                      }))
                    }
                    className="rounded h-5 w-5 text-blue-600 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      Enforce End of Class Date
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      When enabled, students cannot check in after their
                      &quot;End of Class Date&quot; has passed.
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      <strong>Example:</strong> If a student&apos;s End of Class
                      Date is Dec 31, 2024, they will be blocked from checking
                      in starting Jan 1, 2025.
                    </div>
                  </div>
                  {settings.enforceClassEndDate && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      Enabled
                    </span>
                  )}
                </label>

                <label className="flex items-start space-x-3 p-4 rounded-md border-2 border-gray-200 hover:border-blue-300 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.enforcePracticeEndDate}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        enforcePracticeEndDate: e.target.checked,
                      }))
                    }
                    className="rounded h-5 w-5 text-blue-600 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      Enforce End of Practice Date
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      When enabled, students cannot check in after their{" "}
                      <strong>End of Practice Date</strong> has passed.
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      <strong>Example:</strong> If a student&apos;s End of
                      Practice Date is Jun 30, 2025, they will be blocked from
                      checking in starting Jul 1, 2025.
                    </div>
                  </div>
                  {settings.enforcePracticeEndDate && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      Enabled
                    </span>
                  )}
                </label>
              </div>
            </div>

            {/* Settings Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                Current Configuration Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-800">Blocked Statuses:</span>
                  <span className="font-medium text-blue-900">
                    {settings.blockedStatuses.length > 0
                      ? settings.blockedStatuses.join(", ")
                      : "None"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Enforce Class End Date:</span>
                  <span className="font-medium text-blue-900">
                    {settings.enforceClassEndDate ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">
                    Enforce Practice End Date:
                  </span>
                  <span className="font-medium text-blue-900">
                    {settings.enforcePracticeEndDate ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
              <Link
                href="/admin"
                className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium text-center"
              >
                Cancel
              </Link>
            </div>

            {/* Info Box */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                ℹ️ How it works
              </h4>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>
                  Settings are applied in real-time when students attempt to
                  check in
                </li>
                <li>
                  Blocked students will see an error message explaining why they
                  cannot check in
                </li>
                <li>Date restrictions are checked against the current date</li>
                <li>
                  These settings do not affect students who are already checked
                  in
                </li>
                <li>Changes here apply to all students system-wide</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSettings;
