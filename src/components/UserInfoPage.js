import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabase';
import { Card, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import '../styles/UserInfoPage.css';

const UserInfoPage = ({ loggedInUser, setLoggedInUser }) => {
    const navigate = useNavigate();

    // State to control editing mode and hold the editable user data
    const [editing, setEditing] = useState(false);
    const [editUserData, setEditUserData] = useState({
        username: '',
        email: '',
    });

    // Add loading state for better UX
    const [isLoading, setIsLoading] = useState(false);

    // Add validation state
    const [validationErrors, setValidationErrors] = useState({});

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
        setIsLoading(true);

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

        setIsLoading(false);
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
        return <p className="text-center">Please log in to view your user information.</p>;
    }

    return (
        <div className="user-info-page container my-5">
            <h2 className="text-center mb-4">User Information</h2>

            {/* User Information Card */}
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
                                    className={`edit-input ${validationErrors.email ? 'is-invalid' : ''}`}
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
                    <Button variant="primary" onClick={() => setEditing(true)} disabled={isLoading}>
                        Edit
                    </Button>
                ) : (
                    <>
                        <Button variant="success" onClick={handleSave} className="me-2" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save'}
                        </Button>
                        <Button variant="secondary" onClick={handleCancel} disabled={isLoading}>
                            Cancel
                        </Button>
                    </>
                )}
            </div>

            {/* Delete Account Section */}
            <div className="text-center mt-5">
                <Button
                    variant="danger"
                    onClick={handleDeleteAccount}
                    disabled={loggedInUser.role === 'admin' || isLoading}
                >
                    Delete Account
                </Button>
                {loggedInUser.role === 'admin' && (
                    <p className="text-muted mt-2">Admin accounts cannot be deleted.</p>
                )}
            </div>

            {/* Back to Profile Link */}
            <div className="text-center mt-5">
                <Button variant="secondary" onClick={() => navigate('/profile')}>
                    Back to Profile
                </Button>
            </div>
        </div>
    );
};

export default UserInfoPage;