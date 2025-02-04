import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const UserManagementPage = ({ loggedInUser }) => {
    const navigate = useNavigate(); // Hook to navigate to different pages
    const [users, setUsers] = useState([]); // State to store users
    const [error, setError] = useState(null); // State to handle errors

    // Fetch users and games from Supabase
    useEffect(() => {
        const fetchData = async () => {
            if (loggedInUser?.role === 'admin') {
                try {
                    // Fetch users
                    const { data: userData, error: userError } = await supabase
                        .from('users')
                        .select('username, email, role');
                    if (userError) throw userError;
                    setUsers(userData);
                } catch (err) {
                    console.error('Error fetching data:', err);
                    setError('Failed to fetch data');
                }
            }
        };
        fetchData();
    }, [loggedInUser]);

    return (
        <div className="game-management-page">
            <button className="btn btn-secondary mb-4" onClick={() => navigate('/admin')}>
                Back to Admin Page
            </button>

            {/* Display error message if there is an error */}
            {error && <p className="text-danger">{error}</p>}

            {/* User List */}
            <div className="users-list mb-5">
                <h3>List of Users</h3>
                {users.length > 0 ? (
                    <ul>
                        {users.map((user, index) => (
                            <li key={index}>
                                <strong>{user.username}</strong> - {user.email}{' '}
                                {user.role === 'admin' && (
                                    <span style={{ color: 'red', fontWeight: 'bold' }}> (Admin)</span>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No users found.</p>
                )}
            </div>
        </div>
    );
};

export default UserManagementPage;
