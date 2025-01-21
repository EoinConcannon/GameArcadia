import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Card, Button } from 'react-bootstrap';
import { useCart } from '../contexts/CartContext';

const FrontPage = () => {
    const [randomGame, setRandomGame] = useState(null); // State to store the random game
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

    if (!randomGame) {
        return <p>Loading featured game...</p>; // Display loading message until game is fetched
    }

    return (
        <div className="front-page text-center my-4">
            <h2>Welcome to GameArcadia</h2>
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
                    >
                        Add to Cart
                    </Button>
                </Card.Body>
            </Card>
        </div>
    );
};

export default FrontPage;
