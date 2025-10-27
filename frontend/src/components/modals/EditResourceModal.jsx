import React, { useState } from 'react';
import api from '../../utils/api';

const EditResourceModal = ({ resource, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: resource.title || '',
    description: resource.description || '',
    resource_type: resource.resource_type,
    link: resource.link || ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (formData.title.length > 200) {
      setError('Title cannot exceed 200 characters');
      return;
    }

    if (formData.resource_type === 'link' && !formData.link.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        title: formData.title,
        description: formData.description
      };

      if (formData.resource_type === 'link') {
        submitData.link = formData.link;
      }

      await api.put(`/api/resources/${resource.id}/`, submitData);
      onSuccess();
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data) {
        const errors = Object.values(err.response.data).flat();
        setError(errors.join(', '));
      } else {
        setError('Failed to update resource. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="bg-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Edit Resource</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Resource Type (readonly) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resource Type
            </label>
            <input
              type="text"
              value={formData.resource_type === 'file' ? 'File' : 'Link'}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">Resource type cannot be changed</p>
          </div>

          {/* Link (only for link type) */}
          {formData.resource_type === 'link' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="link"
                value={formData.link}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 bg-gray-50 -mx-6 -mb-6 px-6 py-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Updating...' : 'Update Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditResourceModal;
