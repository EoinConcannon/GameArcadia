import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

const AdminPage = ({ loggedInUser }) => {
    const [users, setUsers] = useState([]); // State to store users
    const [error, setError] = useState(null); // State to handle errors

    // Fetch users from Supabase
    useEffect(() => {
        const fetchUsers = async () => {
            const { data, error } = await supabase
                .from('users') // Replace 'users' with your actual table name
                .select('username, email, role'); // Fetch 'username', 'email', and 'role'

            if (error) {
                console.error('Error fetching users:', error);
                setError('Failed to fetch users');
            } else {
                setUsers(data); // Update users state with fetched data
            }
        };

        if (loggedInUser && loggedInUser.role === 'admin') {
            fetchUsers();
        }
    }, [loggedInUser]); // Only fetch users when loggedInUser changes

    // Restrict access if the logged-in user is not an admin
    if (!loggedInUser || loggedInUser.role !== 'admin') {
        return <p className="text-danger">Access Denied</p>;
    }

    return (
        <div className="admin-page">
            <h2>Admin Page</h2>

            {error && <p className="text-danger">{error}</p>} {/* Display error message if any */}

            <div className="users-list">
                <h3>List of Users</h3>
                {users.length > 0 ? (
                    <ul>
                        {users.map((user, index) => (
                            <li key={index}>
                                <strong>{user.username}</strong> - {user.email} 
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

export default AdminPage;
