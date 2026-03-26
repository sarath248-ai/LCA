// Base URLs with fallback
const API_BASE_URL = "http://127.0.0.1:8000/api";

/**
 * Generic API fetch wrapper with error handling and auth redirect
 * Now accepts relative URLs and automatically injects token
 */
export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("access_token");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || errorData.message || "API request failed"
    );
  }

  return response.json();
};

/**
 * Helper for fetching blob data
 */
const fetchBlob = async (endpoint) => {
  const token = localStorage.getItem("access_token");

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Download failed");
  }

  return response.blob();
};

/**
 * ================================
 * AUTHENTICATION API
 * ================================
 */
export const registerUser = async (payload) => {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const loginUser = async (payload) => {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * ================================
 * PROJECTS API
 * ================================
 */
export const getProjects = async () => {
  return apiFetch("/projects/");
};

export const createProject = async (payload) => {
  return apiFetch("/projects/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getProject = async (projectId) => {
  return apiFetch(`/projects/${projectId}`);
};

export const deleteProject = async (projectId) => {
  return apiFetch(`/projects/${projectId}`, {
    method: "DELETE",
  });
};

/**
 * ================================
 * PROCESS DATA API
 * ================================
 */
export const createProcessData = async (payload) => {
  return apiFetch("/process-data/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getBatchesByProject = async (projectId) => {
  return apiFetch(`/process-data/project/${projectId}`);
};

export const getBatchDetails = async (batchId) => {
  return apiFetch(`/process-data/${batchId}`);
};

export const getBatchExplanation = async (batchId) => {
  return apiFetch(`/process-data/${batchId}/explain`);
};

/**
 * ================================
 * ANALYTICS API
 * ================================
 */
export const getEmissionsSummary = async (projectId) => {
  return apiFetch(`/analytics/emissions/summary/${projectId}`);
};

export const getEmissionsTrend = async (projectId) => {
  return apiFetch(`/analytics/emissions/trend/${projectId}`);
};

export const getImpactSummary = async (projectId) => {
  return apiFetch(`/analytics/impact-summary/${projectId}`);
};

export const getLCAMetrics = async (batchId) => {
  return apiFetch(`/analytics/lca/metrics/${batchId}`);
};

export const getLCAHotspots = async (batchId) => {
  return apiFetch(`/analytics/lca/hotspots/${batchId}`);
};

export const getLCAImpacts = async (batchId) => {
  return apiFetch(`/analytics/lca/impacts/${batchId}`);
};

export const getLCAUncertainty = async (batchId) => {
  return apiFetch(`/analytics/lca/uncertainty/${batchId}`);
};

export const getHotspots = async (batchId) => {
  return apiFetch(`/analytics/hotspots/${batchId}`);
};

export const getScenarioIntelligence = async (batchId) => {
  return apiFetch(`/analytics/scenario-intelligence/${batchId}`);
};

/**
 * ================================
 * OPTIMIZATION API
 * ================================
 */
export const getOptimizationSuggestions = async (batchId) => {
  return apiFetch(`/optimization/suggestions/${batchId}`);
};

/**
 * ================================
 * SCENARIO API
 * ================================
 */
export const simulateScenario = async (processId, payload) => {
  return apiFetch(`/scenario/simulate/${processId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const sensitivityAnalysis = async (batchId) => {
  return apiFetch(`/scenario/sensitivity/${batchId}`, {
    method: "POST",
  });
};

/**
 * ================================
 * REPORTS API
 * ================================
 */
export const downloadPdfReport = async (batchId) => {
  return fetchBlob(`/reports/pdf/${batchId}`);
};

export const downloadExcelReport = async (batchId) => {
  return fetchBlob(`/reports/excel/${batchId}`);
};

export const downloadComparisonExcel = async (batchId) => {
  return fetchBlob(`/comparison/excel/${batchId}`);
};

/**
 * ================================
 * CHAT API
 * ================================
 */
export const chatWithAI = async (projectId, message) => {
  return apiFetch(`/chat/${projectId}`, {
    method: "POST",
    body: JSON.stringify({ question: message }),
  });
};

/**
 * ================================
 * UPLOADS API
 * ================================
 */
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch("/uploads/", {
    method: "POST",
    headers: {}, // Override default Content-Type for FormData
    body: formData,
  });
};

export const getUploads = async () => {
  return apiFetch("/uploads/");
};

export const deleteUpload = async (fileId) => {
  return apiFetch(`/uploads/${fileId}`, {
    method: "DELETE",
  });
};

export const processUploadedFile = async (fileId, projectId) => {
  return apiFetch(`/uploads/process/${fileId}`, {
    method: "POST",
    body: JSON.stringify({ project_id: projectId }),
  });
};

export const downloadExcelTemplate = async () => {
  return fetchBlob("/uploads/template/excel");
};

export const downloadCsvTemplate = async () => {
  return fetchBlob("/uploads/template/csv");
};

/**
 * ================================
 * PROFILE API
 * ================================
 */
export const getProfile = async () => {
  return apiFetch("/profile/");
};

export const updateProfile = async (payload) => {
  return apiFetch("/profile/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

/**
 * ================================
 * ISO COMPLIANCE API
 * ================================
 */
export const getISOCompliance = async (projectId) => {
  return apiFetch(`/iso-compliance/project/${projectId}`);
};

export const updateISOCompliance = async (projectId, payload) => {
  return apiFetch(`/iso-compliance/project/${projectId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getISOChecklist = async () => {
  return apiFetch("/iso-compliance/checklist");
};

export const getISOTemplate = async () => {
  return apiFetch("/iso-compliance/template");
};

/**
 * ================================
 * CHAT ENHANCED API
 * ================================
 */
export const chatWithAIEnhanced = async (projectId, message, mode = 'context_aware', temperature = 0.7) => {
  return apiFetch(`/chat-enhanced/${projectId}`, {
    method: "POST",
    body: JSON.stringify({ 
      question: message,
      mode: mode,
      temperature: temperature
    }),
  });
};

export const getAvailableChatModels = async () => {
  return apiFetch("/chat-enhanced/models/available");
};