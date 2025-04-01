import React, { useEffect, useState, useCallback } from 'react';
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

    // Add loading state for better UX
    const [isLoading, setIsLoading] = useState({
        inventory: false,
        userUpdate: false
    });

    // Add validation state
    const [validationErrors, setValidationErrors] = useState({});

    // Add pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const gamesPerPage = 9;

    // Calculate pagination indices
    const indexOfLastGame = currentPage * gamesPerPage;
    const indexOfFirstGame = indexOfLastGame - gamesPerPage;
    const currentGames = inventory.slice(indexOfFirstGame, indexOfLastGame);
    const totalPages = Math.ceil(inventory.length / gamesPerPage);

    // Pagination navigation function
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Fetch user inventory and order history from Supabase and RAWG API
    useEffect(() => {
        let isMounted = true;

        const fetchInventoryAndOrderHistory = async () => {
            if (!loggedInUser) return;

            setIsLoading(prev => ({ ...prev, inventory: true }));

            try {
                const { data: inventoryData, error: inventoryError } = await supabase
                    .from('user_inventory')
                    .select('game_id')
                    .eq('user_id', loggedInUser.id);

                if (inventoryError || !isMounted) {
                    if (isMounted) {
                        console.error('Error fetching inventory:', inventoryError);
                        setError('Failed to fetch inventory');
                    }
                    return;
                }

                // Fetch game details from RAWG API
                const gameDetails = await Promise.all(
                    inventoryData.map(async (game) => {
                        const gameDetails = await rawgService.getGameDetails(game.game_id);
                        return { ...gameDetails, game_id: game.game_id };
                    })
                );

                if (isMounted) {
                    setInventory(gameDetails); // Update inventory state with fetched data
                }
            } catch (error) {
                if (isMounted) {
                    console.error('Error:', error);
                    setError('Failed to fetch data');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(prev => ({ ...prev, inventory: false }));
                }
            }
        };

        fetchInventoryAndOrderHistory();

        // Cleanup function
        return () => {
            isMounted = false;
        };
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
    const handleGameClick = useCallback((gameId) => {
        navigate(`/game/${gameId}`);
    }, [navigate]);

    // Handle account deletion
    const handleDeleteAccount = useCallback(async () => {
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
    }, [loggedInUser, setLoggedInUser, navigate]);

    // Validate before saving
    const handleSave = useCallback(async () => {
        // Validate inputs
        const errors = {};

        if (!editUserData.username.trim()) {
            errors.username = "Username cannot be empty";
        }

        if (!editUserData.email.trim()) {
            errors.email = "Email cannot be empty";
        } else if (!/\S+@\S+\.\S+/.test(editUserData.email)) {
            errors.email = "Please enter a valid email";
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        setValidationErrors({});
        setIsLoading(prev => ({ ...prev, userUpdate: true }));

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

        setIsLoading(prev => ({ ...prev, userUpdate: false }));
    }, [editUserData, loggedInUser, setLoggedInUser]);

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
                                        className={`edit-input ${validationErrors.username ? 'is-invalid' : ''}`}
                                    />
                                    {validationErrors.username && (
                                        <div className="invalid-feedback">{validationErrors.username}</div>
                                    )}
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={editUserData.email}
                                        onChange={(e) =>
                                            setEditUserData({ ...editUserData, email: e.target.value })
                                        }
                                        className={`edit-input ${validationErrors.email ? 'is-invalid' : ''}`} /* Apply the edit-input class */
                                    />
                                    {validationErrors.email && (
                                        <div className="invalid-feedback">{validationErrors.email}</div>
                                    )}
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
                {isLoading.inventory ? (
                    <p className="text-center">Loading your games...</p>
                ) : inventory.length === 0 ? (
                    <p className="text-center">Your inventory is empty.</p>
                ) : (
                    <>
                        <Row xs={1} sm={2} md={3} className="g-4">
                            {currentGames.map((game) => (
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
                        {inventory.length > gamesPerPage && (
                            <div className="pagination-container mt-4">
                                <nav>
                                    <ul className="pagination justify-content-center">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => paginate(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                Previous
                                            </button>
                                        </li>
                                        {[...Array(totalPages)].map((_, index) => (
                                            <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                                                <button className="page-link" onClick={() => paginate(index + 1)}>
                                                    {index + 1}
                                                </button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => paginate(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                            >
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        )}
                    </>
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
