import React, { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';

const API = process.env.NEXT_PUBLIC_API_URL;

const StudentLogin = () => {
  const [pin, setPin] = useState('');
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePinSubmit = async () => {
    if (!pin) return;

    setLoading(true);
    setError('');
    
    try {
      // Find student by PIN
      const response = await fetch(`${API}/users?pin=${pin}`);
      const data = await response.json();
      
      if (response.ok && data.length > 0) {
        setStudent(data[0]);
      } else {
        setError('Student not found. Please check your PIN.');
        setStudent(null);
      }
    } catch (err) {
      setError('Error connecting to server.');
      setStudent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (!student) return;

    setLoading(true);
    setError('');
    setSuccess('');

    const updatedStudent = {...student, checkins: [...(student.checkins || []), new Date()]};
    const body = JSON.stringify(updatedStudent);
    try {
      // Add new checkin
      const response = await fetch(`${API}/users/${student._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body
      });

      if (response.ok) {
        setSuccess('Check-in successful!');
        setStudent(null);
        setPin('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to check in. Please try again.');
      }
    } catch (err) {
      setError('Error connecting to server.');
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
              CEG Dealer School
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="container mx-auto p-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-center mb-6">Student Check-in</h2>
            
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
                    onKeyPress={(e) => e.key === 'Enter' && handlePinSubmit()}
                  />
                </div>
                <button
                  onClick={handlePinSubmit}
                  disabled={loading || !pin}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Checking...' : 'Find Student'}
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="text-lg font-semibold text-green-800">Welcome!</h3>
                  <p className="text-green-700">{student.name}</p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={handleCheckin}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Checking in...' : 'Confirm Check-in'}
                  </button>
                  <button
                    onClick={() => {
                      setStudent(null);
                      setPin('');
                      setError('');
                    }}
                    className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
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