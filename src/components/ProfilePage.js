import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Card, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ProfilePage = ({ loggedInUser, setLoggedInUser }) => {
    const [inventory, setInventory] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Fetch user inventory from Supabase
    useEffect(() => {
        const fetchInventory = async () => {
            if (!loggedInUser) return;

            const { data, error } = await supabase
                .from('user_inventory')
                .select(`
                    game_id,
                    games (
                        name,
                        description,
                        price
                    )
                `)
                .eq('user_id', loggedInUser.id);

            if (error) {
                console.error('Error fetching inventory:', error);
                setError('Failed to fetch inventory');
                return;
            }

            setInventory(data); // Update inventory state with fetched data
        };

        fetchInventory();
    }, [loggedInUser]);

    // Handle account deletion
    const handleDeleteAccount = async () => {
        // For admins, deletion is not allowed.
        if (loggedInUser.role === 'admin') {
            alert("Admin accounts cannot be deleted.");
            return;
        }

        // Prompt the user for confirmation
        const confirmed = window.confirm(
            "Are you sure you want to delete your account? This action cannot be undone."
        );
        if (!confirmed) return;

        // Proceed with deletion from the 'users' table
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', loggedInUser.id);

        if (error) {
            console.error('Error deleting account:', error);
            alert("Failed to delete your account. Please try again later.");
            return;
        }

        alert("Your account has been deleted successfully.");

        // Clean up: remove user from local storage and update state
        localStorage.removeItem('loggedInUser');
        setLoggedInUser(null);

        // Redirect to the home page after deletion
        navigate('/');
    };

    if (!loggedInUser) {
        return <p className="text-center">Please log in to view your profile.</p>;
    }

    return (
        <div className="profile-page container my-5">
            {/* User Information Section */}
            <div className="user-info mb-4">
                <h2 className="text-center mb-4">User Information</h2>
                <Card>
                    <Card.Body>
                        <Card.Title>{loggedInUser.username}</Card.Title>
                        <Card.Text>Email: {loggedInUser.email}</Card.Text>
                        <Card.Text>Password: ********</Card.Text>
                        <Card.Text>Role: {loggedInUser.role}</Card.Text>
                        <Card.Text>
                            Joined: {new Date(loggedInUser.created_at).toLocaleString()}
                        </Card.Text>
                    </Card.Body>
                </Card>
            </div>

            {/* Display error message if there is an error */}
            {error && <p className="text-danger text-center">{error}</p>}

            {/* Delete Account Section */}
            <div className="text-center mt-4 mb-5">
                <button
                    className="btn btn-danger"
                    onClick={handleDeleteAccount}
                    disabled={loggedInUser.role === 'admin'}
                > Delete Account </button>
            </div>

            {/* Inventory Section */}
            <div className="mt-5">
                <h2 className="text-center mb-4">{loggedInUser.username}'s Inventory</h2>
                {inventory.length === 0 ? (
                    <p className="text-center">Your inventory is empty.</p>
                ) : (
                    <Row xs={1} sm={2} md={3} className="g-4">
                        {inventory.map((item) => (
                            <Col key={item.game_id}>
                                <Card>
                                    <Card.Body>
                                        <Card.Title>{item.games.name}</Card.Title>
                                        <Card.Text>{item.games.description}</Card.Text>
                                        <Card.Text>€{item.games.price}</Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
