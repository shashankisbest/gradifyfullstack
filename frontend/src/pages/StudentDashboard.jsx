import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../utils/api';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('resources');
  const [resources, setResources] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState({
    resources: false,
    timetable: false,
    scholarships: false
  });
  const [error, setError] = useState({});

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
    setError(prev => ({ ...prev, resources: null }));
    try {
      const response = await api.get('/api/resources/');
      setResources(response.data.resources);
    } catch (err) {
      setError(prev => ({ ...prev, resources: 'Failed to load resources. Please try again.' }));
    } finally {
      setLoading(prev => ({ ...prev, resources: false }));
    }
  };

  const fetchTimetable = async () => {
    setLoading(prev => ({ ...prev, timetable: true }));
    setError(prev => ({ ...prev, timetable: null }));
    try {
      const response = await api.get('/api/timetable/');
      setTimetable(response.data.timetable);
    } catch (err) {
      setError(prev => ({ ...prev, timetable: 'Failed to load timetable. Please try again.' }));
    } finally {
      setLoading(prev => ({ ...prev, timetable: false }));
    }
  };

  const fetchScholarships = async () => {
    setLoading(prev => ({ ...prev, scholarships: true }));
    setError(prev => ({ ...prev, scholarships: null }));
    try {
      const response = await api.get('/api/scholarships/');
      setScholarships(response.data.scholarships);
    } catch (err) {
      setError(prev => ({ ...prev, scholarships: 'Failed to load scholarships. Please try again.' }));
    } finally {
      setLoading(prev => ({ ...prev, scholarships: false }));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const groupTimetableByDay = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const grouped = {};
    days.forEach(day => {
      grouped[day] = timetable
        .filter(entry => entry.day === day)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    return grouped;
  };

  const insertBreaks = (entries) => {
    const result = [];
    for (let i = 0; i < entries.length; i++) {
      result.push(entries[i]);

      // Check if there's a next entry
      if (i < entries.length - 1) {
        const currentEnd = entries[i].end_time;
        const nextStart = entries[i + 1].start_time;

        // If there's a gap, add a break
        if (currentEnd < nextStart) {
          result.push({
            isBreak: true,
            start: currentEnd,
            end: nextStart
          });
        }
      }
    }
    return result;
  };

  const renderResourcesTab = () => {
    if (loading.resources) {
      return <div className="text-center py-8">Loading resources...</div>;
    }

    if (error.resources) {
      return <div className="text-red-600 text-center py-8">{error.resources}</div>;
    }

    if (resources.length === 0) {
      return <div className="text-gray-500 text-center py-8">No resources available yet</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map(resource => (
          <div key={resource.id} className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{resource.title}</h3>
            {resource.description && (
              <p className="text-gray-600 text-sm mb-3">{resource.description}</p>
            )}
            <div className="text-xs text-gray-500 mb-3">
              <p>Uploaded by: {resource.uploaded_by.name}</p>
              <p>Date: {formatDate(resource.created_at)}</p>
              <p className="capitalize">Type: {resource.resource_type}</p>
            </div>
            {resource.resource_type === 'file' ? (
              <a
                href={`${process.env.REACT_APP_API_URL}${resource.file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Download {resource.file.split('.').pop().toUpperCase()}
              </a>
            ) : (
              <a
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Open Link
              </a>
            )}
          </div>
        ))}
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

    if (timetable.length === 0) {
      return <div className="text-gray-500 text-center py-8">No classes scheduled yet</div>;
    }

    const groupedTimetable = groupTimetableByDay();

    return (
      <div className="space-y-6">
        {Object.entries(groupedTimetable).map(([day, entries]) => {
          if (entries.length === 0) return null;

          const entriesWithBreaks = insertBreaks(entries);

          return (
            <div key={day} className="bg-gray-50 border border-gray-300 rounded-lg p-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">{day}</h3>
              <div className="space-y-2">
                {entriesWithBreaks.map((item, index) => {
                  if (item.isBreak) {
                    return (
                      <div key={`break-${index}`} className="bg-gray-200 p-3 rounded italic text-gray-600">
                        Break: {item.start} - {item.end}
                      </div>
                    );
                  }

                  return (
                    <div key={item.id} className="bg-white border border-gray-200 p-3 rounded">
                      <div className="font-semibold text-gray-800">
                        {item.start_time} - {item.end_time}: {item.subject}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Faculty: {item.faculty.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
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

    if (scholarships.length === 0) {
      return <div className="text-gray-500 text-center py-8">No scholarships available yet</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scholarships.map(scholarship => (
          <div key={scholarship.id} className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{scholarship.name}</h3>
            <p className="text-gray-600 text-sm mb-3">{scholarship.description}</p>
            <div className="text-xs text-gray-500 mb-3">
              <p>Added by: {scholarship.added_by.name}</p>
            </div>
            <a
              href={scholarship.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Learn More
            </a>
          </div>
        ))}
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
          <p className="text-gray-600 mt-2">Here's what's available for you</p>
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
    </div>
  );
};

export default StudentDashboard;
