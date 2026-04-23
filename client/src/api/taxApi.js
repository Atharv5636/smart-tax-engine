import axios from "axios";

function getApiBaseUrl() {
  const configuredBase = import.meta.env.VITE_API_BASE_URL;

  if (typeof configuredBase === "string" && configuredBase.trim().length > 0) {
    return configuredBase.replace(/\/+$/, "");
  }

  return "";
}

const API_BASE_URL = getApiBaseUrl();

function getAuthToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem("token") || "";
}

function attachAuth(instance) {
  instance.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    return config;
  });
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/tax`,
  headers: {
    "Content-Type": "application/json",
  },
});

const docsApi = axios.create({
  baseURL: `${API_BASE_URL}/api/docs`,
});

const aiApi = axios.create({
  baseURL: `${API_BASE_URL}/api/ai`,
  headers: {
    "Content-Type": "application/json",
  },
});

const authApi = axios.create({
  baseURL: `${API_BASE_URL}/api/auth`,
  headers: {
    "Content-Type": "application/json",
  },
});

const chatApi = axios.create({
  baseURL: `${API_BASE_URL}/api/chat`,
  headers: {
    "Content-Type": "application/json",
  },
});

const reportApi = axios.create({
  baseURL: `${API_BASE_URL}/api/report`,
  headers: {
    "Content-Type": "application/json",
  },
});

attachAuth(api);
attachAuth(docsApi);
attachAuth(aiApi);
attachAuth(chatApi);
attachAuth(reportApi);

export const calculateTax = (payload) => api.post("/calculate", payload);
export const calculateOldTax = (payload) => api.post("/calculate-old", payload);
export const calculateNewTax = (payload) => api.post("/calculate-new", payload);

export const simulateTax = (payload) => api.post("/simulate", payload);

export const optimizeTax = (payload) => api.post("/optimize", payload);

export const optimizeTaxAdvanced = (payload) =>
  api.post("/optimize-advanced", payload);

export const optimizeGoal = (payload) => api.post("/goal", payload);

export const calculateSalaryHra = (payload) =>
  api.post("/salary-structure", payload);

export const calculateCapitalGains = (payload) =>
  api.post("/capital-gains", payload);

export const uploadPdfDocument = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return docsApi.post("/upload", formData);
};

export const fetchRecentUploadedPdfs = () => docsApi.get("/uploads");
export const parseFinancialInput = (payload) => aiApi.post("/parse", payload);
export const loginUser = (payload) => authApi.post("/login", payload);
export const registerUser = (payload) => authApi.post("/register", payload);
export const chatAnalyze = async (payload) => {
  try {
    if (typeof payload === "string") {
      return chatApi.post("/analyze", { text: payload });
    }

    return chatApi.post("/analyze", payload);
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
};

export const generateTaxReportPdf = async (data) => {
  return reportApi.post("/generate", data, {
    responseType: "blob",
  });
};
