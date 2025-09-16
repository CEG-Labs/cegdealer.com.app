import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';

const API = process.env.NEXT_PUBLIC_API_URL;

const StudentHistory = () => {
  const router = useRouter();
  const { id } = router.query;
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        setError('Student not found');
      }
    } catch (err) {
      setError('Failed to fetch student data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
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
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const deleteCheckin = async (checkinIndex) => {
    if (!confirm('Are you sure you want to delete this check-in record?')) return;

    try {
      const response = await fetch(`${API}/users/${id}/checkin/${checkinIndex}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchStudentHistory(); // Refresh the data
      } else {
        setError('Failed to delete check-in record');
      }
    } catch (err) {
      setError('Error connecting to server');
    }
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
                <Link href="/" className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-700">
                  Student Login
                </Link>
                <Link href="/admin" className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-700">
                  Admin Panel
                </Link>
              </div>
            </div>
          </nav>
          <div className="container mx-auto p-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
              <p className="text-gray-700 mb-4">{error}</p>
              <Link href="/admin" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Back to Admin Panel
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const sortedCheckins = [...(student.checkins || [])].sort((a, b) => new Date(b) - new Date(a));

  return (
    <>
      <Head>
        <title>{student.name} - Check-in History</title>
        <meta name="description" content={`Check-in history for ${student.name}`} />
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Navigation */}
        <nav className="bg-blue-600 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">Student Check-in System</h1>
            <div className="space-x-4">
              <Link href="/" className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-700">
                Student Login
              </Link>
              <Link href="/admin" className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-700">
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
                <Link href="/admin" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
                  ← Back to Admin Panel
                </Link>
                <h2 className="text-3xl font-bold text-gray-900">{student.name}</h2>
                <p className="text-gray-600">Check-in History</p>
              </div>
            </div>

            {/* Student Info Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Student Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Name:</span>
                  <p className="text-gray-900">{student.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">PIN:</span>
                  <p className="text-gray-900">{student.pin || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Email:</span>
                  <p className="text-gray-900">{student.email || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Phone:</span>
                  <p className="text-gray-900">{student.phone || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Total Check-ins:</span>
                  <p className="text-gray-900 font-semibold">{student.checkins?.length || 0}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Games:</span>
                  <p className="text-gray-900">{student.games?.length ? student.games.join(', ') : 'None'}</p>
                </div>
              </div>
            </div>

            {/* Check-in History */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Check-in History</h3>
              </div>
              
              {sortedCheckins.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No check-ins recorded yet.
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
                          Date & Time
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
                      {sortedCheckins.map((checkin, index) => (
                        <tr key={index} className={index === 0 ? 'bg-green-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {index === 0 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                                  Latest
                                </span>
                              )}
                              {sortedCheckins.length - index}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(checkin)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{getTimeAgo(checkin)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => deleteCheckin(student.checkins.indexOf(checkin))}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Summary Stats */}
            {sortedCheckins.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Summary Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{sortedCheckins.length}</div>
                    <div className="text-sm text-gray-600">Total Check-ins</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatDate(sortedCheckins[0]).split(',')[0]}
                    </div>
                    <div className="text-sm text-gray-600">Last Check-in</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatDate(sortedCheckins[sortedCheckins.length - 1]).split(',')[0]}
                    </div>
                    <div className="text-sm text-gray-600">First Check-in</div>
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