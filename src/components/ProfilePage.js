import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Card, Row, Col, Button, Form } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import rawgService from '../rawgService'; // Import the RAWG service
import '../styles/ProfilePage.css';

const ProfilePage = ({ loggedInUser, setLoggedInUser }) => {
    const [inventory, setInventory] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // State to control editing mode and hold the editable user data
    const [editing, setEditing] = useState(false);
    const [editUserData, setEditUserData] = useState({
        username: '',
        email: '',
    });

    // Fetch user inventory and order history from Supabase and RAWG API
    useEffect(() => {
        const fetchInventoryAndOrderHistory = async () => {
            if (!loggedInUser) return;

            const { data: inventoryData, error: inventoryError } = await supabase
                .from('user_inventory')
                .select('game_id')
                .eq('user_id', loggedInUser.id);

            if (inventoryError) {
                console.error('Error fetching inventory:', inventoryError);
                setError('Failed to fetch inventory');
                return;
            }

            // Fetch game details from RAWG API
            const gameDetails = await Promise.all(
                inventoryData.map(async (game) => {
                    const gameDetails = await rawgService.getGameDetails(game.game_id);
                    return { ...gameDetails, game_id: game.game_id };
                })
            );

            setInventory(gameDetails); // Update inventory state with fetched data
        };

        fetchInventoryAndOrderHistory();
    }, [loggedInUser]);

    // Update editUserData when loggedInUser changes
    useEffect(() => {
        if (loggedInUser) {
            setEditUserData({
                username: loggedInUser.username,
                email: loggedInUser.email,
            });
        }
    }, [loggedInUser]);

    // Navigate to game details page
    const handleGameClick = (gameId) => {
        navigate(`/game/${gameId}`);
    };

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

    const handleSave = async () => {
        // Update the user's information in the 'users' table (except password)
        const { data, error } = await supabase
            .from('users')
            .update({
                username: editUserData.username,
                email: editUserData.email,
            })
            .eq('id', loggedInUser.id)
            .select(); // <-- This ensures the updated record is returned

        if (error) {
            console.error('Error updating user info:', error);
            alert("Failed to update your information. Please try again later.");
            return;
        }

        // Check if updated data is returned
        if (data && data.length > 0) {
            // Merge the updated fields with the existing loggedInUser object
            const updatedUser = { ...loggedInUser, ...data[0] };
            localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
            setLoggedInUser(updatedUser);
            setEditing(false);
        } else {
            alert("Failed to update your information. Please try again later.");
        }
    };

    // Handle cancel editing: revert changes
    const handleCancel = () => {
        setEditUserData({
            username: loggedInUser.username,
            email: loggedInUser.email,
        });
        setEditing(false);
    };

    if (!loggedInUser) {
        return <p className="text-center">Please log in to view your profile.</p>;
    }

    return (
        <div className="profile-page container my-5 text-center">
            {/* User Information Section */}
            <div className="user-info mb-4">
                <h2 className="text-center mb-4">User Information</h2>
                <Card className="user-details-card">
                    <Card.Body>
                        {editing ? (
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editUserData.username}
                                        onChange={(e) =>
                                            setEditUserData({ ...editUserData, username: e.target.value })
                                        }
                                        className="edit-input"
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={editUserData.email}
                                        onChange={(e) =>
                                            setEditUserData({ ...editUserData, email: e.target.value })
                                        }
                                        className="edit-input" /* Apply the edit-input class */
                                    />
                                </Form.Group>
                            </Form>
                        ) : (
                            <>
                                <Card.Title>{loggedInUser.username}</Card.Title>
                                <Card.Text>Email: {loggedInUser.email}</Card.Text>
                                <Card.Text>Password: ********</Card.Text>
                                <Card.Text>Role: {loggedInUser.role}</Card.Text>
                                <Card.Text>
                                    Joined: {new Date(loggedInUser.created_at).toLocaleString()}
                                </Card.Text>
                            </>
                        )}
                    </Card.Body>
                </Card>
                {/* Edit Mode Buttons */}
                <div className="text-center mt-4">
                    {!editing ? (
                        <Button variant="primary" onClick={() => setEditing(true)}>
                            Edit
                        </Button>
                    ) : (
                        <>
                            <Button variant="success" onClick={handleSave} className="me-2">
                                Save
                            </Button>
                            <Button variant="secondary" onClick={handleCancel}>
                                Cancel
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Display error message if there is an error */}
            {error && <p className="text-danger text-center">{error}</p>}

            {/* Delete Account Section */}
            <div className="text-center mt-4 mb-5">
                <button
                    className="btn btn-danger"
                    onClick={handleDeleteAccount}
                    disabled={loggedInUser.role === 'admin'}
                >
                    Delete Account
                </button>
            </div>

            {/* Inventory Section */}
            <div className="mt-5">
                <h2 className="text-center mb-4">{loggedInUser.username}'s Inventory</h2>
                {inventory.length === 0 ? (
                    <p className="text-center">Your inventory is empty.</p>
                ) : (
                    <Row xs={1} sm={2} md={3} className="g-4">
                        {inventory.map((game) => (
                            <Col key={game.game_id}>
                                <Card
                                    onClick={() => handleGameClick(game.game_id)} // Navigate to game details page
                                    className="inventory-game-card"
                                >
                                    <Card.Img variant="top" src={game.background_image} alt={game.name} />
                                    <Card.Body>
                                        <Card.Title>{game.name}</Card.Title>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            <div className="mt-5">
                <h2 className="text-center mb-4">Order History</h2>
                <div className="text-center">
                    <Link to="/order-history" className="btn btn-primary">
                        View Order History
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
