// src/api.js
import API_CONFIG from './config';

// Базовый fetch с авторизацией
export const fetchWithAuth = async (url, options = {}) => {
  let accessToken = localStorage.getItem("accessToken");
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  
  // Формируем полный URL
  const fullUrl = url.startsWith('http') ? url : `${API_CONFIG.baseURL}${url}`;
  
  let response = await fetch(fullUrl, { ...options, headers });
  
  // Если токен протух (401)
  if (response.status === 401) {
    const refreshToken = localStorage.getItem("refreshToken");
    
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_CONFIG.baseURL}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken })
        });
        
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          
          // Повторяем запрос с новым токеном
          headers["Authorization"] = `Bearer ${data.accessToken}`;
          response = await fetch(fullUrl, { ...options, headers });
        } else {
          throw new Error("Refresh token expired");
        }
      } catch (err) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    } else {
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
    }
  }
  
  return response;
};

// Утилиты для API запросов
export const api = {
  get: (url, options = {}) => 
    fetchWithAuth(url, { ...options, method: 'GET' }),
  
  post: (url, data, options = {}) => 
    fetchWithAuth(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  put: (url, data, options = {}) => 
    fetchWithAuth(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  
  delete: (url, options = {}) => 
    fetchWithAuth(url, { ...options, method: 'DELETE' })
};