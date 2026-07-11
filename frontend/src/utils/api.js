import axios from 'axios';


// it creates an instance of the axios library with a base URL of '/api' 
// and sets the default content type for requests to 'application/json'. 
// This instance is then used to make API requests throughout the application.
//axios.get("http://localhost:5000/api/users") is made into api.get("/users") also proxy has been set in vite.config.js to avoid CORS issues.
const api = axios.create({ baseURL: '/api', headers: { 'Content-Type': 'application/json' } });

// The request interceptor is used to attach the JWT token to the Authorization header of each request if it exists in localStorage.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


//handles the response from the server. 
// If the response status is 401 (Unauthorized) and a token exists in 
// localStorage, it removes the token and redirects the user to the login page.
api.interceptors.response.use(
  res => res,
  err => {
    const token = localStorage.getItem("token");

    if (err.response?.status === 401 && token) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(err);
  }
);

export default api;
