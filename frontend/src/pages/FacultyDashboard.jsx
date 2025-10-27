import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import AddResourceModal from '../components/modals/AddResourceModal';
import EditResourceModal from '../components/modals/EditResourceModal';
import AddTimetableModal from '../components/modals/AddTimetableModal';
import EditTimetableModal from '../components/modals/EditTimetableModal';
import AddScholarshipModal from '../components/modals/AddScholarshipModal';
import EditScholarshipModal from '../components/modals/EditScholarshipModal';

const FacultyDashboard = () => {
  const [activeTab, setActiveTab] = useState('resources');
  const [resources, setResources] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});

  // Modal states
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [showEditResourceModal, setShowEditResourceModal] = useState(false);
  const [showAddTimetableModal, setShowAddTimetableModal] = useState(false);
  const [showEditTimetableModal, setShowEditTimetableModal] = useState(false);
  const [showAddScholarshipModal, setShowAddScholarshipModal] = useState(false);
  const [showEditScholarshipModal, setShowEditScholarshipModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

  useEffect(() => {
    if (activeTab === 'resources') {
      fetchResources();
    } else if (activeTab === 'timetable') {
      fetchTimetable();
    } else if (activeTab === 'scholarships') {
      fetchScholarships();
    }
  }, [activeTab]);

  const fetchResources = async () => {
    setLoading(prev => ({ ...prev, resources: true }));
    try {
      const response = await api.get('/api/resources/');
      // Filter to show only user's own resources
      const myResources = response.data.resources.filter(r => r.uploaded_by.id === userData.id);
      setResources(myResources);
    } catch (err) {
      setError(prev => ({ ...prev, resources: 'Failed to load resources' }));
    } finally {
      setLoading(prev => ({ ...prev, resources: false }));
    }
  };

  const fetchTimetable = async () => {
    setLoading(prev => ({ ...prev, timetable: true }));
    try {
      const response = await api.get('/api/timetable/');
      // Filter to show only user's own timetable entries
      const myTimetable = response.data.timetable.filter(t => t.faculty.id === userData.id);
      setTimetable(myTimetable);
    } catch (err) {
      setError(prev => ({ ...prev, timetable: 'Failed to load timetable' }));
    } finally {
      setLoading(prev => ({ ...prev, timetable: false }));
    }
  };

  const fetchScholarships = async () => {
    setLoading(prev => ({ ...prev, scholarships: true }));
    try {
      const response = await api.get('/api/scholarships/');
      // Filter to show only user's own scholarships
      const myScholarships = response.data.scholarships.filter(s => s.added_by.id === userData.id);
      setScholarships(myScholarships);
    } catch (err) {
      setError(prev => ({ ...prev, scholarships: 'Failed to load scholarships' }));
    } finally {
      setLoading(prev => ({ ...prev, scholarships: false }));
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      await api.delete(`/api/resources/${id}/`);
      fetchResources();
    } catch (err) {
      alert('Failed to delete resource');
    }
  };

  const handleDeleteTimetable = async (id) => {
    if (!window.confirm('Are you sure you want to delete this timetable entry?')) {
      return;
    }

    try {
      await api.delete(`/api/timetable/${id}/`);
      fetchTimetable();
    } catch (err) {
      alert('Failed to delete timetable entry');
    }
  };

  const handleDeleteScholarship = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scholarship?')) {
      return;
    }

    try {
      await api.delete(`/api/scholarships/${id}/`);
      fetchScholarships();
    } catch (err) {
      alert('Failed to delete scholarship');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const renderResourcesTab = () => {
    if (loading.resources) {
      return <div className="text-center py-8">Loading resources...</div>;
    }

    if (error.resources) {
      return <div className="text-red-600 text-center py-8">{error.resources}</div>;
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">My Resources</h2>
          <button
            onClick={() => setShowAddResourceModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Add Resource
          </button>
        </div>

        {resources.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            You haven't added any resources yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map(resource => (
              <div key={resource.id} className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{resource.title}</h3>
                {resource.description && (
                  <p className="text-gray-600 text-sm mb-3">{resource.description}</p>
                )}
                <div className="text-xs text-gray-500 mb-3">
                  <p>Date: {formatDate(resource.created_at)}</p>
                  <p className="capitalize">Type: {resource.resource_type}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingItem(resource);
                      setShowEditResourceModal(true);
                    }}
                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteResource(resource.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTimetableTab = () => {
    if (loading.timetable) {
      return <div className="text-center py-8">Loading timetable...</div>;
    }

    if (error.timetable) {
      return <div className="text-red-600 text-center py-8">{error.timetable}</div>;
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">My Timetable Entries</h2>
          <button
            onClick={() => setShowAddTimetableModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Add Class
          </button>
        </div>

        {timetable.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            You haven't added any classes yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {timetable.map(entry => (
              <div key={entry.id} className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {entry.day}: {entry.subject}
                </h3>
                <p className="text-gray-600 mb-3">
                  {entry.start_time} - {entry.end_time}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingItem(entry);
                      setShowEditTimetableModal(true);
                    }}
                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTimetable(entry.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderScholarshipsTab = () => {
    if (loading.scholarships) {
      return <div className="text-center py-8">Loading scholarships...</div>;
    }

    if (error.scholarships) {
      return <div className="text-red-600 text-center py-8">{error.scholarships}</div>;
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">My Scholarships</h2>
          <button
            onClick={() => setShowAddScholarshipModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Add Scholarship
          </button>
        </div>

        {scholarships.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            You haven't added any scholarships yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scholarships.map(scholarship => (
              <div key={scholarship.id} className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{scholarship.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{scholarship.description}</p>
                <div className="text-xs text-gray-500 mb-3">
                  <p>Date: {formatDate(scholarship.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingItem(scholarship);
                      setShowEditScholarshipModal(true);
                    }}
                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteScholarship(scholarship.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Welcome, {userData.name}</h1>
          <p className="text-gray-600 mt-2">Manage your academic content</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-300 mb-6">
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'resources'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Resources
          </button>
          <button
            onClick={() => setActiveTab('timetable')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'timetable'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Timetable
          </button>
          <button
            onClick={() => setActiveTab('scholarships')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'scholarships'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Scholarships
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'resources' && renderResourcesTab()}
          {activeTab === 'timetable' && renderTimetableTab()}
          {activeTab === 'scholarships' && renderScholarshipsTab()}
        </div>
      </div>

      {/* Modals */}
      {showAddResourceModal && (
        <AddResourceModal
          onClose={() => setShowAddResourceModal(false)}
          onSuccess={() => {
            setShowAddResourceModal(false);
            fetchResources();
          }}
        />
      )}

      {showEditResourceModal && editingItem && (
        <EditResourceModal
          resource={editingItem}
          onClose={() => {
            setShowEditResourceModal(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setShowEditResourceModal(false);
            setEditingItem(null);
            fetchResources();
          }}
        />
      )}

      {showAddTimetableModal && (
        <AddTimetableModal
          onClose={() => setShowAddTimetableModal(false)}
          onSuccess={() => {
            setShowAddTimetableModal(false);
            fetchTimetable();
          }}
          existingEntries={timetable}
        />
      )}

      {showEditTimetableModal && editingItem && (
        <EditTimetableModal
          entry={editingItem}
          onClose={() => {
            setShowEditTimetableModal(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setShowEditTimetableModal(false);
            setEditingItem(null);
            fetchTimetable();
          }}
          existingEntries={timetable}
        />
      )}

      {showAddScholarshipModal && (
        <AddScholarshipModal
          onClose={() => setShowAddScholarshipModal(false)}
          onSuccess={() => {
            setShowAddScholarshipModal(false);
            fetchScholarships();
          }}
        />
      )}

      {showEditScholarshipModal && editingItem && (
        <EditScholarshipModal
          scholarship={editingItem}
          onClose={() => {
            setShowEditScholarshipModal(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setShowEditScholarshipModal(false);
            setEditingItem(null);
            fetchScholarships();
          }}
        />
      )}
    </div>
  );
};

export default FacultyDashboard;
