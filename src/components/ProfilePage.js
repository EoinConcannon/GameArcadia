import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Card, Row, Col } from 'react-bootstrap';

const ProfilePage = ({ loggedInUser }) => {
    const [inventory, setInventory] = useState([]);

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
                return;
            }

            setInventory(data); // Update inventory state with fetched data
        };

        fetchInventory();
    }, [loggedInUser]);

    if (!loggedInUser) {
        return <p className="text-center">Please log in to view your profile.</p>;
    }

    return (
        <div className="profile-page container my-5">
            {/* User Information Section */}
            {/* Temporarly using this before allowing user to edit their information */}
            <div className="user-info mb-4">
                <h2 className="text-center mb-4">User Information</h2>
                <Card>
                    <Card.Body>
                        <Card.Title>{loggedInUser.username}</Card.Title>
                        <Card.Text>Email: {loggedInUser.email}</Card.Text>
                        <Card.Text>Password: ********</Card.Text> {/* Won't be displaying this */}
                        <Card.Text>Role: {loggedInUser.role}</Card.Text>
                        <Card.Text>Joined: {new Date(loggedInUser.created_at).toLocaleString()}</Card.Text>
                    </Card.Body>
                </Card>
            </div>
            <div className="text-center mt-4">
                <button className="btn btn-danger">
                    Delete Account
                </button>
            </div>

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
