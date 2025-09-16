// pages/admin.js - Admin Panel Page
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';

const API = process.env.NEXT_PUBLIC_API_URL;

const AdminPanel = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/users`);
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      const response = await fetch(`${API}/users/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchStudents();
      }
    } catch (err) {
      setError('Failed to delete student');
    }
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
              <Link href="/" className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-700">
                Student Login
              </Link>
              <Link href="/admin" className="px-4 py-2 rounded bg-blue-800">
                Admin Panel
              </Link>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="container mx-auto p-4">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Admin Panel - Student Management</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Add New Student
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">{error}</p>
              </div>
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

            {/* Students List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                      Check-ins
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.pin}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.checkins?.length || 0}</div>
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
                  ))}
                </tbody>
              </table>
              
              {students.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No students found. Add your first student using the button above.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Student Form Component (for Add/Edit)
const StudentForm = ({ student, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: student?.name || '',
    pin: student?.pin || '',
    email: student?.email || '',
    phone: student?.phone || '',
    username: student?.username || '',
    roles: student?.roles || ['student'],
    games: student?.games || []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const gameOptions = ['craps', 'roulette', 'blackjack', 'baccarat', 'poker', 'pai-gow', 'keno', 'uth', 'sic-bo'];

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const url = student ? `${API}/users/${student._id}` : `${API}/users`;
      const method = student ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSave();
      } else {
        setError('Failed to save student');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleGameToggle = (game) => {
    setFormData(prev => ({
      ...prev,
      games: prev.games.includes(game)
        ? prev.games.filter(g => g !== game)
        : [...prev.games, game]
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">
        {student ? 'Edit Student' : 'Add New Student'}
      </h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PIN</label>
            <input
              type="text"
              value={formData.pin}
              onChange={(e) => setFormData(prev => ({...prev, pin: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({...prev, username: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Games</label>
          <div className="grid grid-cols-3 gap-2">
            {gameOptions.map(game => (
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
            {loading ? 'Saving...' : 'Save'}
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