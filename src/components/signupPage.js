import React from 'react';
import { useNavigate } from 'react-router-dom';

const FrontPage = () => {
    const navigate = useNavigate();

    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="border rounded p-4 shadow" style={{ width: '300px' }}>
                <h2 className="text-center">Sign up</h2>
                <form>
                    <div className="mb-3">
                        <label htmlFor="username" className="form-label">Enter a username</label>
                        <input
                            type="text"
                            className="form-control"
                            id="username"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="username" className="form-label">Enter your email</label>
                        <input
                            type="text"
                            className="form-control"
                            id="email"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Enter a password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Confirm password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="confirmpassword"
                        />
                    </div>
                    <div className="mb-3">
                        <button type="button" className="btn btn-primary w-100" onClick={() => navigate('/home')}>Create Account</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FrontPage;
