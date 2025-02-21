import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Card, Button, Form } from 'react-bootstrap';
import { useCart } from '../contexts/CartContext';

const FrontPage = ({ loggedInUser }) => {
    const [randomGame, setRandomGame] = useState(null); // State to store the random game
    const [inventory, setInventory] = useState([]); // State to store user's inventory
    const { addToCart } = useCart(); // Hook to access cart context

    // Fetch games from Supabase and select a random game
    useEffect(() => {
        const fetchRandomGame = async () => {
            const { data, error } = await supabase
                .from('games')
                .select('*');

            if (error) {
                console.error('Error fetching games:', error);
            } else if (data.length > 0) {
                const randomIndex = Math.floor(Math.random() * data.length);
                setRandomGame(data[randomIndex]); // Set a random game
            }
        };

        fetchRandomGame();
    }, []); // Run once when the component mounts

    // Fetch inventory from Supabase when the component displays
    useEffect(() => {
        const fetchInventory = async () => {
            if (!loggedInUser) return;

            const { data, error } = await supabase
                .from('user_inventory')
                .select('game_id')
                .eq('user_id', loggedInUser.id);

            if (error) {
                console.error('Error fetching inventory:', error);
                return;
            }

            setInventory(data.map((item) => item.game_id)); // Store game IDs of owned games
        };

        fetchInventory();
    }, [loggedInUser]);

    // Check if a game is owned by the user
    const isOwned = (gameId) => inventory.includes(gameId);

    if (!randomGame) {
        return <p>Loading featured game...</p>; // Display loading message until game is fetched
    }

    return (
        <div className="front-page text-center my-4">
            <h2>Welcome to GameArcadia</h2>
            {/* Search Bar */}
            <div className="search-bar text-center mb-4">
                <Form>
                    <Form.Control
                        type="text"
                        placeholder="Search for a game..."
                        //value={searchQuery}
                        //onChange={handleSearchChange}
                        style={{
                            maxWidth: '400px',
                            margin: '0 auto',
                            textAlign: 'center',
                        }}
                    />
                </Form>
            </div>
            <h4 className="mb-4">Featured Game</h4>
            <Card className="mx-auto" style={{ maxWidth: '400px' }}>
                <Card.Img
                    variant="top"
                    src={randomGame.image_url || 'default-image-url'} // Replace with actual image URL field
                    alt={randomGame.name}
                    className="img-fluid"
                    style={{ maxHeight: '200px', objectFit: 'cover' }}
                />
                <Card.Body>
                    <Card.Title>{randomGame.name}</Card.Title>
                    <Card.Text>{randomGame.description}</Card.Text>
                    <Card.Text>€{randomGame.price}</Card.Text>
                    <Button
                        variant="primary"
                        onClick={() => addToCart(randomGame)}
                        disabled={isOwned(randomGame.id)} // Disable button if the game is owned
                    >
                        {isOwned(randomGame.id) ? 'Owned' : 'Add to Cart'}
                    </Button>
                </Card.Body>
            </Card>
            <h4 className="my-4">Top Games</h4>
            <p>Sample text</p>

            <h4 className="my-4">Recommended Games</h4>
            <p>Sample text</p>

        </div>
    );
};

export default FrontPage;
