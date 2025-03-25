import React from 'react';
import { useNavigate } from 'react-router-dom';

const GameManagementPage = () => {
    const navigate = useNavigate(); 

    return (
        <div className="game-management-page">
            <button className="btn btn-secondary mb-4" onClick={() => navigate('/admin')}>
                Back to Admin Page
            </button>
        </div>
    );
};

export default GameManagementPage;
