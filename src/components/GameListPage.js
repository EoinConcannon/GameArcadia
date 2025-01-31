import React from 'react';
import { useNavigate } from 'react-router-dom';

const GameListPage = () => {
    const navigate = useNavigate(); // Hook to navigate to different pages

    return (
        <div className="game-list-page">
            <button className="btn btn-secondary mb-4" onClick={() => navigate('/admin')}>
                Back to Admin Page
            </button>
            <p>This is the game listing page</p>
        </div>
    );
};

export default GameListPage;
