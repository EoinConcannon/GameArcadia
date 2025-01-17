import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase'; // Ensure your Supabase client is initialized

const SignUpPage = () => {
    const navigate = useNavigate();

    const [userData, setUserData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setError('');
        if (!userData.username || !userData.email || !userData.password) {
            setError('All fields are required');
            return;
        }

        if (userData.password !== userData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // Check if the email already exists in the database
            const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('email')
                .eq('email', userData.email);

            if (fetchError) throw fetchError;

            if (existingUser.length > 0) {
                setError('Email is already in use');
                setLoading(false);
                return;
            }

            // Insert the new user into the `users` table
            const { error: insertError } = await supabase.from('users').insert([
                {
                    username: userData.username,
                    email: userData.email,
                    password: userData.password, // Store plaintext for simplicity, but you should hash passwords
                    role: 'user', // Default role
                },
            ]);

            if (insertError) {
                setError('Error creating account: ' + insertError.message);
                setLoading(false);
                return;
            }

            // Navigate to the login page on success
            navigate('/login');
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="border rounded p-4 shadow" style={{ width: '300px' }}>
                <h2 className="text-center">Sign Up</h2>
                <form>
                    <div className="mb-3">
                        <label htmlFor="username" className="form-label">Enter a username</label>
                        <input
                            type="text"
                            className="form-control"
                            id="username"
                            name="username"
                            value={userData.username}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Enter your email</label>
                        <input
                            type="email"
                            className="form-control"
                            id="email"
                            name="email"
                            value={userData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Enter a password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                            name="password"
                            value={userData.password}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={userData.confirmPassword}
                            onChange={handleChange}
                        />
                    </div>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <button
                        type="button"
                        className="btn btn-primary w-100"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SignUpPage;
