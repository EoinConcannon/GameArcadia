import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUpPage = ({ addUser }) => {
    const navigate = useNavigate();

    //this is temporary, will replace this with a database later
    //generated with chatGPT
    const [userData, setUserData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        if (userData.password !== userData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const newUser = {
            username: userData.username,
            email: userData.email,
            password: userData.password,
            role: 'user', // Default role
        };

        addUser(newUser); // Add new user to the users array
        navigate('/login'); // Redirect to login page after signing up
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
                    <button type="button" className="btn btn-primary w-100" onClick={handleSubmit}>Create Account</button>
                </form>
            </div>
        </div>
    );
};

export default SignUpPage;
