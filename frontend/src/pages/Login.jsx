/**
* React: Required for creating React components.
* useState: Stores component state.
* Link: Creates navigation links without reloading the page.
* useNavigate: Redirects users programmatically.
* useAuth: Accesses authentication functions from AuthContext.
* toast: Displays popup notifications (success or error messages).
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

//defines the Login component.
export default function Login() {

  //set up state variables and functions from the AuthContext.
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  //Runs when the form is submitted
  const handleSubmit = async (e) => {

    //prevent Page Reload
    e.preventDefault();
    setLoading(true);
    try {

      //calls the login function from AuthContext with the email and password from the form.
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);

      //navigates to a route based on the user's role (e.g., /student, /faculty, etc.).
      navigate(`/${user.role}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    //describes the structure and styling of the login page, including a form for email and password input, a submit button, and a link to the registration page.
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"> Hello College</div>
        <p className="auth-tagline">Student Feedback & Complaint Portal</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">College Email</label>
            <input type="email" className="form-input" placeholder="...@college.edu.np"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" placeholder="********"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="auth-footer">New student? <Link to="/register">Create an account</Link></p>
      </div>
    </div>
  );
}
