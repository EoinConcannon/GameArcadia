//generated with copilot, refine later
import React from 'react';
import { useNavigate } from 'react-router-dom';

const FrontPage = () => {
    const navigate = useNavigate();

    return (
        <div className="front-page">
            <div className="top-border">
                <button className="nav-button" onClick={() => navigate('/')}>Home</button>
                <button className="nav-button" onClick={() => navigate('/store')}>Store</button>
            </div>
            <div className="content">
                
            </div>
            <div className="bottom-border">
                <button className="nav-button">About</button>
            </div>
        </div>
    );
};

export default FrontPage;