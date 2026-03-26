import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Download, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { 
  getISOCompliance, 
  updateISOCompliance, 
  getISOChecklist,
  getISOTemplate 
} from '../api/api';
import { useApp } from '../context/AppContext';

const ISOCompliance = () => {
  const { 
    user, 
    selectedProject, 
    setCurrentView,
    darkMode,
    setError
  } = useApp();
  
  const [complianceData, setComplianceData] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [editMode, setEditMode] = useState(false);
  
  const [formData, setFormData] = useState({
    goal_and_scope: '',
    functional_unit: '',
    system_boundary_justification: '',
    allocation_method: '',
    cutoff_criteria: '',
    data_quality_requirements: ''
  });
  
  const theme = {
    bg: darkMode ? 'bg-slate-900' : 'bg-slate-50',
    cardBg: darkMode ? 'bg-slate-800' : 'bg-white',
    text: darkMode ? 'text-slate-100' : 'text-slate-900',
    textMuted: darkMode ? 'text-slate-400' : 'text-slate-600',
    border: darkMode ? 'border-slate-700' : 'border-slate-200',
    hoverBg: darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50',
  };
  
  useEffect(() => {
    if (selectedProject?.id) {
      loadComplianceData();
      loadChecklist();
    }
  }, [selectedProject?.id]);
  
  useEffect(() => {
    if (complianceData && selectedProject) {
      setFormData({
        goal_and_scope: selectedProject.goal_and_scope || '',
        functional_unit: selectedProject.functional_unit || '',
        system_boundary_justification: selectedProject.system_boundary_justification || '',
        allocation_method: selectedProject.allocation_method || '',
        cutoff_criteria: selectedProject.cutoff_criteria || '',
        data_quality_requirements: selectedProject.data_quality_requirements || ''
      });
    }
  }, [complianceData, selectedProject]);
  
  const loadComplianceData = async () => {
    try {
      setLoading(true);
      const data = await getISOCompliance(selectedProject.id);  // FIXED: Removed user.token
      setComplianceData(data);
    } catch (error) {
      console.error('Failed to load compliance data:', error);
      setError('Failed to load ISO compliance data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const loadChecklist = async () => {
    try {
      const data = await getISOChecklist();  // FIXED: Removed user.token
      setChecklist(data);
      
      // Expand first section by default
      if (data.checklist && data.checklist.length > 0) {
        setExpandedSections({ [data.checklist[0].section]: true });
      }
    } catch (error) {
      console.error('Failed to load checklist:', error);
    }
  };
  
  const handleSave = async () => {
    try {
      setSaving(true);
      await updateISOCompliance(selectedProject.id, formData);  // FIXED: Removed user.token
      await loadComplianceData();
      setEditMode(false);
      setError('✓ ISO compliance updated successfully');
    } catch (error) {
      console.error('Failed to save compliance data:', error);
      setError('Failed to save: ' + error.message);
    } finally {
      setSaving(false);
    }
  };
  
  const handleDownloadTemplate = async () => {
    try {
      const template = await getISOTemplate();  // FIXED: Removed user.token
      
      // Create and download markdown file
      const blob = new Blob([template.template], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `iso_scope_template_${selectedProject.name.replace(/\s+/g, '_')}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setError('✓ Template downloaded successfully');
    } catch (error) {
      console.error('Failed to download template:', error);
      setError('Failed to download template: ' + error.message);
    }
  };
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const getScoreColor = (score) => {
    if (score >= 75) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };
  
  const getScoreBg = (score) => {
    if (score >= 75) return 'bg-emerald-100 dark:bg-emerald-900/30';
    if (score >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };
  
  if (!selectedProject) {
    return (
      <div className="p-8">
        <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-12 text-center`}>
          <AlertCircle className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`} />
          <h3 className={`text-xl font-semibold ${theme.text} mb-2`}>No Project Selected</h3>
          <p className={`${theme.textMuted} mb-6`}>Please select a project to view ISO compliance</p>
          <button 
            onClick={() => setCurrentView('projects')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Select Project
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${theme.text}`}>ISO 14040/14044 Compliance</h1>
            <p className={`${theme.textMuted} mt-1`}>
              Ensure your LCA study meets international standards
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Template</span>
            </button>
            <button
              onClick={() => setEditMode(!editMode)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editMode ? 'Cancel Edit' : 'Edit Compliance'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Compliance Score Card */}
      {complianceData && (
        <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6 mb-6`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-lg font-semibold ${theme.text}`}>Compliance Status</h2>
              <p className={`text-sm ${theme.textMuted}`}>
                {selectedProject.name} • {selectedProject.metal_type}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-lg ${getScoreBg(complianceData.score)}`}>
              <span className={`text-2xl font-bold ${getScoreColor(complianceData.score)}`}>
                {complianceData.score}%
              </span>
              <div className={`text-xs ${theme.textMuted} text-center`}>
                ISO Compliance
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className={`text-sm ${theme.text}`}>
                {complianceData.present_fields?.length || 0} of {complianceData.total_fields || 6} requirements met
              </span>
              <span className={`text-sm ${theme.textMuted}`}>
                {complianceData.score}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${
                  complianceData.score >= 75 ? 'bg-emerald-500' :
                  complianceData.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${complianceData.score}%` }}
              />
            </div>
          </div>
          
          {/* Missing Fields */}
          {complianceData.missing_fields && complianceData.missing_fields.length > 0 && (
            <div className={`p-4 rounded-lg ${
              darkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'
            } border`}>
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <span className={`font-medium ${theme.text}`}>
                  {complianceData.missing_fields.length} Missing Requirements
                </span>
              </div>
              <ul className={`text-sm ${theme.textMuted} space-y-1 list-disc list-inside`}>
                {complianceData.missing_fields.map((field, idx) => (
                  <li key={idx}>{field}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Edit Form / Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Compliance Form */}
        <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6`}>
          <h2 className={`text-lg font-semibold ${theme.text} mb-4`}>
            {editMode ? 'Edit Compliance Details' : 'Compliance Details'}
          </h2>
          
          {editMode ? (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                  Goal and Scope Definition
                </label>
                <textarea
                  value={formData.goal_and_scope}
                  onChange={(e) => setFormData({...formData, goal_and_scope: e.target.value})}
                  className={`w-full px-3 py-2 border ${theme.border} ${theme.text} ${darkMode ? 'bg-slate-700' : 'bg-white'} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  rows={4}
                  placeholder="Define the goal, scope, intended application, and target audience..."
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                  Functional Unit
                </label>
                <input
                  type="text"
                  value={formData.functional_unit}
                  onChange={(e) => setFormData({...formData, functional_unit: e.target.value})}
                  className={`w-full px-3 py-2 border ${theme.border} ${theme.text} ${darkMode ? 'bg-slate-700' : 'bg-white'} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  placeholder="e.g., '1 metric ton of hot-rolled steel'"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                  System Boundary Justification
                </label>
                <textarea
                  value={formData.system_boundary_justification}
                  onChange={(e) => setFormData({...formData, system_boundary_justification: e.target.value})}
                  className={`w-full px-3 py-2 border ${theme.border} ${theme.text} ${darkMode ? 'bg-slate-700' : 'bg-white'} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  rows={3}
                  placeholder="Justify system boundary selection and cut-off criteria..."
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                  Allocation Method
                </label>
                <input
                  type="text"
                  value={formData.allocation_method}
                  onChange={(e) => setFormData({...formData, allocation_method: e.target.value})}
                  className={`w-full px-3 py-2 border ${theme.border} ${theme.text} ${darkMode ? 'bg-slate-700' : 'bg-white'} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  placeholder="e.g., 'Mass-based allocation for co-products'"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                  Cut-off Criteria
                </label>
                <input
                  type="text"
                  value={formData.cutoff_criteria}
                  onChange={(e) => setFormData({...formData, cutoff_criteria: e.target.value})}
                  className={`w-full px-3 py-2 border ${theme.border} ${theme.text} ${darkMode ? 'bg-slate-700' : 'bg-white'} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  placeholder="e.g., 'Exclude flows contributing <1% of mass or energy'"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                  Data Quality Requirements
                </label>
                <textarea
                  value={formData.data_quality_requirements}
                  onChange={(e) => setFormData({...formData, data_quality_requirements: e.target.value})}
                  className={`w-full px-3 py-2 border ${theme.border} ${theme.text} ${darkMode ? 'bg-slate-700' : 'bg-white'} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  rows={3}
                  placeholder="Specify time, geographical, and technology coverage requirements..."
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key} className="border-b pb-4 last:border-b-0">
                  <h3 className={`font-medium ${theme.text} mb-1 capitalize`}>
                    {key.replace(/_/g, ' ')}
                  </h3>
                  <p className={`text-sm ${value ? theme.text : theme.textMuted}`}>
                    {value || 'Not specified'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Right Column: ISO Checklist */}
        <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6`}>
          <h2 className={`text-lg font-semibold ${theme.text} mb-4`}>
            ISO 14040/14044 Checklist
          </h2>
          
          {checklist && checklist.checklist ? (
            <div className="space-y-3">
              {checklist.checklist.map((section, idx) => (
                <div key={idx} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection(section.section)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-1 rounded ${
                        complianceData?.completeness?.[section.section] 
                          ? 'bg-emerald-100 dark:bg-emerald-900' 
                          : 'bg-slate-100 dark:bg-slate-700'
                      }`}>
                        {complianceData?.completeness?.[section.section] ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div className="text-left">
                        <h3 className={`font-medium ${theme.text}`}>{section.section}</h3>
                        <p className={`text-xs ${theme.textMuted}`}>
                          {section.iso_reference}
                        </p>
                      </div>
                    </div>
                    {expandedSections[section.section] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  
                  {expandedSections[section.section] && (
                    <div className="p-4 border-t">
                      <ul className="space-y-2">
                        {section.requirements.map((req, reqIdx) => (
                          <li key={reqIdx} className="flex items-start space-x-2">
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            </div>
                            <span className={`text-sm ${theme.text}`}>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className={theme.textMuted}>Loading checklist...</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Recommendations */}
      {complianceData?.recommendations && complianceData.recommendations.length > 0 && (
        <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6 mt-6`}>
          <h2 className={`text-lg font-semibold ${theme.text} mb-4`}>Recommendations</h2>
          <div className="space-y-3">
            {complianceData.recommendations.map((rec, idx) => (
              <div key={idx} className={`flex items-start space-x-3 p-3 rounded-lg ${
                rec.startsWith('✓') 
                  ? (darkMode ? 'bg-emerald-900/20 border-emerald-800' : 'bg-emerald-50 border-emerald-200')
                  : (darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200')
              } border`}>
                <div className={`flex-shrink-0 p-1 rounded ${
                  rec.startsWith('✓') 
                    ? 'bg-emerald-100 dark:bg-emerald-900' 
                    : 'bg-blue-100 dark:bg-blue-900'
                }`}>
                  {rec.startsWith('✓') ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <span className={`text-sm ${theme.text}`}>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ISOCompliance;