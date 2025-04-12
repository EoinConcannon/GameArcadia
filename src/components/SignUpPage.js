import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import bcrypt from 'bcryptjs';
import '../styles/AuthPages.css';

const SignUpPage = () => {
    const navigate = useNavigate();

    const [userData, setUserData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData((prev) => ({ ...prev, [name]: value }));

        // Clear specific field error when user starts typing again
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Validate username
        if (!userData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (userData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!userData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(userData.email)) {
            newErrors.email = 'Please enter a valid email format';
        }

        // Validate password
        if (!userData.password) {
            newErrors.password = 'Password is required';
        } else if (userData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        // Confirm passwords match
        if (userData.password !== userData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        setGeneralError('');

        // Validate form
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Check if username or email already exists
            const { data: existingUsers, error: fetchError } = await supabase
                .from('users')
                .select('username, email')
                .or(`username.eq.${userData.username},email.eq.${userData.email}`);

            if (fetchError) throw fetchError;

            if (existingUsers && existingUsers.length > 0) {
                const isUsernameTaken = existingUsers.some(user => user.username === userData.username);
                const isEmailTaken = existingUsers.some(user => user.email === userData.email);

                if (isUsernameTaken) {
                    setErrors(prev => ({ ...prev, username: 'Username already taken' }));
                }
                if (isEmailTaken) {
                    setErrors(prev => ({ ...prev, email: 'Email already in use' }));
                }

                setLoading(false);
                return;
            }

            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);

            // Insert the new user with hashed password
            const { error: insertError } = await supabase
                .from('users')
                .insert([
                    {
                        username: userData.username,
                        email: userData.email,
                        password: hashedPassword, // Store hashed password
                        role: 'user',
                        created_at: new Date()
                    },
                ]);

            if (insertError) {
                throw insertError;
            }

            // Navigate to the login page on success
            navigate('/login', { state: { message: 'Account created successfully! Please log in.' } });
        } catch (err) {
            console.error('Error creating account:', err);
            setGeneralError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (field) => {
        if (field === 'password') {
            setShowPassword(!showPassword);
        } else if (field === 'confirmPassword') {
            setShowConfirmPassword(!showConfirmPassword);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Sign Up</h2>

                {generalError && <div className="alert alert-danger">{generalError}</div>}

                <form className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username">Enter a username</label>
                        <input
                            type="text"
                            className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                            id="username"
                            name="username"
                            value={userData.username}
                            onChange={handleChange}
                        />
                        {errors.username && (
                            <div className="invalid-feedback">{errors.username}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Enter your email</label>
                        <input
                            type="email"
                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                            id="email"
                            name="email"
                            value={userData.email}
                            onChange={handleChange}
                        />
                        {errors.email && (
                            <div className="invalid-feedback">{errors.email}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Enter a password</label>
                        <div className="password-input-container">
                            <input
                                type={showPassword ? "text" : "password"}
                                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                id="password"
                                name="password"
                                value={userData.password}
                                onChange={handleChange}
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => togglePasswordVisibility('password')}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? "👁️" : "👁️‍🗨️"}
                            </button>
                        </div>
                        {errors.password && (
                            <div className="invalid-feedback">{errors.password}</div>
                        )}
                        <div className="form-text">
                            Password must be at least 6 characters
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm password</label>
                        <div className="password-input-container">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={userData.confirmPassword}
                                onChange={handleChange}
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => togglePasswordVisibility('confirmPassword')}
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <div className="invalid-feedback">{errors.confirmPassword}</div>
                        )}
                    </div>

                    <button
                        type="button"
                        className="btn btn-primary btn-block"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Creating Account...
                            </>
                        ) : 'Create Account'}
                    </button>

                    <div className="login-link">
                        Already have an account?
                        <button
                            type="button"
                            className="btn btn-link p-0 ms-1"
                            onClick={() => navigate('/login')}
                        >
                            Log in
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignUpPage;
