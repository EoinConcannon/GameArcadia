import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Card, Button, Form } from 'react-bootstrap';
import { useCart } from '../contexts/CartContext';
import '../styles/FrontPage.css';

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
        <div className="front-page">
            <h2>Welcome to GameArcadia</h2>
            {/* Search Bar */}
            <div className="search-bar">
                <Form>
                    <Form.Control
                        type="text"
                        placeholder="Search for a game..."
                        //value={searchQuery}
                        //onChange={handleSearchChange}
                    />
                </Form>
            </div>
            <h4 className="section-title">Featured Game</h4>
            <Card className="card">
                <Card.Img
                    variant="top"
                    src={randomGame.image_url || 'default-image-url'} // Replace with actual image URL field
                    alt={randomGame.name}
                    className="img-fluid"
                />
                <Card.Body>
                    <Card.Title className="card-title">{randomGame.name}</Card.Title>
                    <Card.Text className="card-text">{randomGame.description}</Card.Text>
                    <Card.Text className="card-text">€{randomGame.price}</Card.Text>
                    <Button
                        variant="primary"
                        onClick={() => addToCart(randomGame)}
                        disabled={isOwned(randomGame.id)} // Disable button if the game is owned
                        className="card-button"
                    >
                        {isOwned(randomGame.id) ? 'Owned' : 'Add to Cart'}
                    </Button>
                </Card.Body>
            </Card>
            <h4 className="section-title">Recommended Games</h4>
            <p>Sample text</p>

            <h4 className="section-title">Top Games</h4>
            <p>Sample text</p>
        </div>
    );
};

export default FrontPage;
