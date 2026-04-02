/**
 * Axios instance configured with base URL and auth token interceptor.
 * All API calls go through this module.
 */

import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      // Only redirect if not already on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const login = (email, password) =>
  api.post("/auth/login", { email, password });

// ── Users ─────────────────────────────────────────────────────
export const registerUser = (formData) =>
  api.post("/register-user", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getUsers = () => api.get("/users");

// ── Recognition ───────────────────────────────────────────────
export const recognizeFace = (formData) =>
  api.post("/recognize", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ── Attendance ────────────────────────────────────────────────
export const captureAttendance = (formData) =>
  api.post("/attendance", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getAttendanceRecords = (params) =>
  api.get("/attendance-records", { params });

export const getDashboard = () => api.get("/dashboard");

// ── Extraction ────────────────────────────────────────────────
export const extractData = (formData) =>
  api.post("/extract-data", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ── Profile ──────────────────────────────────────────────────
export const getMe = () => api.get("/auth/me");
export const updateProfile = (data) => api.put("/auth/profile", data);
export const changePassword = (data) => api.put("/auth/change-password", data);

// ── Courses ──────────────────────────────────────────────────
export const getCourses = () => api.get("/courses");
export const createCourse = (data) => api.post("/courses", data);
export const updateCourse = (id, data) => api.put(`/courses/${id}`, data);
export const deleteCourse = (id) => api.delete(`/courses/${id}`);
export const enrollStudents = (courseId, userIds) =>
  api.post(`/courses/${courseId}/enroll`, { user_ids: userIds });
export const getCourseStudents = (courseId) => api.get(`/courses/${courseId}/students`);
export const unenrollStudent = (courseId, userId) =>
  api.delete(`/courses/${courseId}/students/${userId}`);

// ── Security / Keys ──────────────────────────────────────────
export const getKeys = () => api.get("/security/keys");
export const generateKey = (name) => api.post("/security/keys", { name });
export const activateKey = (id) => api.put(`/security/keys/${id}/activate`);
export const deleteKey = (id) => api.delete(`/security/keys/${id}`);

// ── Health ────────────────────────────────────────────────────
export const healthCheck = () => api.get("/health");

export default api;
