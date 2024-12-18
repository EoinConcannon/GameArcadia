import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const LoginPage = ({ setLoggedInUser }) => {
    const [username, setUsername] = useState(''); // Track the username input
    const [password, setPassword] = useState(''); // Track the password input
    const [error, setError] = useState(''); // Track any error messages
    const navigate = useNavigate(); // Hook to navigate to different pages

    const handleLogin = async () => {
        try {
            // Fetch user data from Supabase
            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username);

            if (error) {
                setError('Error fetching user data');
                console.error('Error fetching user data:', error);
                return;
            }

            // Find the user with matching username and password in supabase data
            const user = users.find(u => u.username === username && u.password === password);

            if (user) {
                setLoggedInUser(user); // Set the logged-in user state
                localStorage.setItem('loggedInUser', JSON.stringify(user)); // Save user to local storage
                navigate('/'); // Redirect to home page after login
            } else {
                setError('Invalid username or password');
            }
        } catch (err) {
            setError('An error occurred during login');
            console.error('Login error:', err);
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="border rounded p-4 shadow" style={{ width: '300px' }}>
                <h2 className="text-center">Login</h2>
                {error && <p className="text-danger text-center">{error}</p>}
                <form>
                    <div className="mb-3">
                        <label htmlFor="username" className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-control"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <button type="button" className="btn btn-primary w-100" onClick={handleLogin}>
                            Login
                        </button>
                    </div>
                    <div className="mb-3">
                        <button type="button" className="btn btn-primary w-100" onClick={() => navigate('/signup')}>
                            Sign Up
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
