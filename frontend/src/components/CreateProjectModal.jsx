import React, { useState } from 'react';
import { X } from 'lucide-react';

const CreateProjectModal = ({ onClose, onCreate, darkMode }) => {
  const [formData, setFormData] = useState({
    name: '',
    metal_type: 'Steel',
    boundary: 'Cradle to Gate'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const metalOptions = ['Steel', 'Aluminium', 'Copper', 'Brass', 'Other'];
  const boundaryOptions = ['Cradle to Gate', 'Cradle to Grave', 'Gate to Gate'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (!formData.metal_type) {
      newErrors.metal_type = 'Metal type is required';
    }
    
    if (!formData.boundary) {
      newErrors.boundary = 'Boundary is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      await onCreate(formData);
      onClose();
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        submit: error.message || 'Failed to create project'
      }));
    } finally {
      setLoading(false);
    }
  };

  const theme = {
    cardBg: darkMode ? 'bg-slate-800' : 'bg-white',
    text: darkMode ? 'text-slate-100' : 'text-slate-900',
    textMuted: darkMode ? 'text-slate-400' : 'text-slate-600',
    border: darkMode ? 'border-slate-700' : 'border-slate-200',
    inputBg: darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${theme.cardBg} rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden`}>
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className={`text-xl font-bold ${theme.text}`}>Create New Project</h2>
            <p className={`text-sm ${theme.textMuted}`}>Define your LCA project details</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 ${theme.textMuted} hover:${darkMode ? 'bg-slate-700' : 'bg-slate-100'} rounded-lg transition-colors`}
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Project Name */}
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                Project Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Steel Production Analysis"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.name ? 'border-red-500' : theme.inputBg
                } ${theme.text}`}
                disabled={loading}
                autoFocus
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Metal Type */}
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                Metal Type *
              </label>
              <select
                name="metal_type"
                value={formData.metal_type}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.metal_type ? 'border-red-500' : theme.inputBg
                } ${theme.text}`}
                disabled={loading}
              >
                {metalOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.metal_type && (
                <p className="mt-1 text-sm text-red-600">{errors.metal_type}</p>
              )}
            </div>

            {/* System Boundary */}
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                System Boundary *
              </label>
              <select
                name="boundary"
                value={formData.boundary}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.boundary ? 'border-red-500' : theme.inputBg
                } ${theme.text}`}
                disabled={loading}
              >
                {boundaryOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.boundary && (
                <p className="mt-1 text-sm text-red-600">{errors.boundary}</p>
              )}
            </div>

            {/* Help text */}
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} border ${darkMode ? 'border-blue-800' : 'border-blue-200'}`}>
              <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                <span className="font-medium">System Boundaries:</span><br/>
                • <strong>Cradle to Gate:</strong> From raw material extraction to factory gate<br/>
                • <strong>Cradle to Grave:</strong> From extraction to disposal/recycling<br/>
                • <strong>Gate to Gate:</strong> Only manufacturing processes
              </p>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">{errors.submit}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;