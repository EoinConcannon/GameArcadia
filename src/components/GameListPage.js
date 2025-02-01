import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';


//maybe forget about this.
//combine this and game management page into a GamesManagementPage
//crud operations are currently used in listing
//maybe same thing for user management? Like bans and account info, UsersManagementPage
//add search bar to both page too


const GameListPage = ({ loggedInUser }) => {
    const navigate = useNavigate(); // Hook to navigate to different pages
    const [games, setGames] = useState([]); // State to store games
    const [error, setError] = useState(null); // State to handle errors

    // Fetch users and games from Supabase
    useEffect(() => {
        const fetchData = async () => {
            if (loggedInUser?.role === 'admin') {
                try {
                    // Fetch games
                    const { data: gameData, error: gameError } = await supabase
                        .from('games')
                        .select('*');
                    if (gameError) throw gameError;
                    setGames(gameData);
                } catch (err) {
                    console.error('Error fetching data:', err);
                    setError('Failed to fetch data');
                }
            }
        };

        fetchData();
    }, [loggedInUser]);

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
