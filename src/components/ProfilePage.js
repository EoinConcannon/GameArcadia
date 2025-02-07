import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Card, Row, Col, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

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

    // Update editUserData when loggedInUser changes
    useEffect(() => {
        if (loggedInUser) {
            setEditUserData({
                username: loggedInUser.username,
                email: loggedInUser.email,
            });
        }
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
        <div className="profile-page container my-5">
            {/* User Information Section */}
            <div className="user-info mb-4">
                <h2 className="text-center mb-4">User Information</h2>
                <Card>
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
