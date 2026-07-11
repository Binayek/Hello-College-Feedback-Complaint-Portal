//registeration is only available for students.
/**
* React: Required for creating React components.
* useState: Stores component state.
* Link: Creates navigation links without reloading the page.
* useNavigate: Redirects users programmatically.
* useAuth: Accesses authentication functions from AuthContext.
* toast: Displays popup notifications (success or error messages).
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

//register component
export default function Register() {

  //set up state variables and functions from the AuthContext.
  const { register } = useAuth();
  const navigate = useNavigate();
  const [faculties, setFaculties] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', faculty_id: '' });
  const [loading, setLoading] = useState(false);


  //fetches the list of faculties from the API when the component mounts and sets the faculties state.
  useEffect(() => {
    api.get('/users/faculties').then(res => setFaculties(res.data.faculties)).catch(() => {});
  }, []);


  //handles register form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      //calls the register function from AuthContext
      await register(form.name, form.email, form.password, form.faculty_id || null);
      toast.success('Account created! Welcome.');
      navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  //describes the structure and styling of the registration page
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">💬 Hello College</div>
        <p className="auth-tagline">Create your student account</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" placeholder="Your full name"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">College Email</label>
            <input type="email" className="form-input" placeholder="you@college.edu.np"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Faculty / Department</label>
            <select className="form-select" value={form.faculty_id}
              onChange={e => setForm(f => ({ ...f, faculty_id: e.target.value }))}>
              <option value="">Select your faculty</option>
              {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" placeholder="Min. 8 characters"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} minLength={8} required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <p className="auth-footer">Already registered? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
