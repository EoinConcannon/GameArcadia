import React from 'react';
import { useNavigate } from 'react-router-dom';

const GameManagementPage = () => {
    const navigate = useNavigate(); // Hook to navigate to different pages

    return (
        <div className="game-management-page">
            <button className="btn btn-secondary mb-4" onClick={() => navigate('/admin')}>
                Back to Admin Page
            </button>
            <p>This is the game management page</p>
        </div>
    );
};

export default GameManagementPage;
