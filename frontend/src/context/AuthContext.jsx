/**
* createContext → Creates a global context.
* useContext → Reads data from the context.
* useState → Stores state.
* useEffect → Runs code after the component renders.
* api → Axios instance (usually configured with base URL and token).
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

//creates a global context called AuthContext. initially the context is null.
const AuthContext = createContext(null);

// AuthProvider component that wraps the application and provides authentication 
// state and functions to its children(everythinf inside AuthProvider can access the context).
export const AuthProvider = ({ children }) => {

  //setting up state variables for user and loading. user is initially null, and loading is initially true.
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  //runs after the component renders. it checks if a token exists in local storage. 
  // if it does, it makes an API call to get the user data and sets the user state. 
  // if the token is invalid or the API call fails, it removes the token from local storage. 
  // finally, it sets loading to false.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  //Called when the user submits the login form.
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  //Called when the user submits the registration form. 
  // It sends a POST request to the /auth/register endpoint with the user's name, email, password, and faculty_id.
  // If successful, it stores the returned token in local storage and updates the user state with the returned user data.
  const register = async (name, email, password, faculty_id) => {
    const res = await api.post('/auth/register', { name, email, password, faculty_id });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  //Called when the user clicks the logout button.
  const logout = () => { localStorage.removeItem('token'); setUser(null); };

  //This makes these values available throughout the application
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

//allows components to access the authentication context by calling useAuth().
export const useAuth = () => useContext(AuthContext);
