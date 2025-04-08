import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import bcrypt from 'bcryptjs';
import '../styles/AuthPages.css'; // Import new shared CSS

const LoginPage = ({ setLoggedInUser }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // Check for success message from signup
    useEffect(() => {
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
        }
    }, [location]);

    const handleLogin = async (e) => {
        if (e) e.preventDefault();

        if (!username || !password) {
            setError('Please enter both username and password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Fetch user data from Supabase
            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username);

            if (error) {
                throw new Error('Error fetching user data');
            }

            if (!users || users.length === 0) {
                setError('Invalid username or password');
                setLoading(false);
                return;
            }

            const user = users[0];
            let isValidPassword = false;

            // Check if this is a legacy plaintext password (for transition period)
            if (user.password === password) {
                isValidPassword = true;

                // Update to hashed password for future logins
                try {
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(password, salt);

                    await supabase
                        .from('users')
                        .update({ password: hashedPassword })
                        .eq('id', user.id);

                    console.log("Updated legacy plaintext password to hash");
                } catch (hashError) {
                    console.error("Failed to update legacy password:", hashError);
                    // Don't prevent login if hash update fails
                }
            }
            // Check if it's a hashed password
            else if (user.password.startsWith('$2')) {
                isValidPassword = await bcrypt.compare(password, user.password);
            }

            if (isValidPassword) {
                // Remove password from user data before storing
                const { password: _password, ...safeUserData } = user;

                setLoggedInUser(safeUserData);
                localStorage.setItem('loggedInUser', JSON.stringify(safeUserData));
                navigate('/');
            } else {
                setError('Invalid username or password');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('An error occurred during login. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Login</h2>

                {successMessage && (
                    <div className="alert alert-success">{successMessage}</div>
                )}

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleLogin} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="form-control"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="form-control"
                        />
                    </div>
                    <div className="form-group">
                        <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Logging in...
                                </>
                            ) : 'Login'}
                        </button>
                    </div>
                    <div className="form-group">
                        <button
                            type="button"
                            className="btn btn-outline-primary btn-block"
                            onClick={() => navigate('/signup')}
                            disabled={loading}
                        >
                            Sign Up
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
