//generated temporary login from chatGPT
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = ({ setLoggedInUser }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const response = await fetch('/loginTest.json');
            const users = await response.json();

            const user = users.find(u => u.username === username && u.password === password);

            if (user) {
                setLoggedInUser(username);
                navigate('/'); //redirect to home page after login
            } else {
                setError('Invalid username or password');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('An error occurred during login');
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
                        <button type="button" className="btn btn-primary w-100" onClick={() => navigate('/signup')}>Sign Up</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
