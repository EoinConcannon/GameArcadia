import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminPage = ({ loggedInUser }) => {

    const navigate = useNavigate(); // Hook to navigate to different pages

    // Restrict access if the logged-in user is not an admin
    if (!loggedInUser || loggedInUser.role !== 'admin') {
        return <p className="text-danger">Access Denied</p>;
    }

    return (
        <div className="admin-page">
            <h2>Admin Page</h2>

            {/* Navigation Buttons */}
            <div className="admin-navigation-buttons mb-4">
                <button className="btn btn-primary me-2" onClick={() => navigate('/user-list')}>
                    User List
                </button>
                <button className="btn btn-primary me-2" onClick={() => navigate('/game-management')}>
                    Game Management
                </button>
                <button className="btn btn-primary me-2" onClick={() => navigate('/user-management')}>
                    User Management
                </button>
            </div>
        </div>
    );
};

export default AdminPage;
