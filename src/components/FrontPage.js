import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Card, Button, Form } from 'react-bootstrap';
import { useCart } from '../contexts/CartContext';
import '../styles/FrontPage.css';
import testImage from './temp_image/image.jpg';

const FrontPage = ({ loggedInUser }) => {
    const [randomGame, setRandomGame] = useState(null); // State to store the random game
    const [inventory, setInventory] = useState([]); // State to store user's inventory
    const { addToCart } = useCart(); // Hook to access cart context

    // Mock data for recommended and top games
    const recommendedGames = [
        { id: 1, name: 'Game 1', description: 'Description 1', price: 10, image_url: testImage },
        { id: 2, name: 'Game 2', description: 'Description 2', price: 20, image_url: testImage },
        { id: 3, name: 'Game 3', description: 'Description 3', price: 30, image_url: testImage },
        { id: 4, name: 'Game 4', description: 'Description 4', price: 40, image_url: testImage },
    ];

    const topGames = [
        { id: 5, name: 'Game 5', description: 'Description 5', price: 50, image_url: testImage },
        { id: 6, name: 'Game 6', description: 'Description 6', price: 60, image_url: testImage },
        { id: 7, name: 'Game 7', description: 'Description 7', price: 70, image_url: testImage },
        { id: 8, name: 'Game 8', description: 'Description 8', price: 80, image_url: testImage },
    ];

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
                    src={randomGame.image_url || 'components/temp_image/image.jpg'} // Replace with actual image URL field
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
            <div className="game-list">
                {recommendedGames.map((game) => (
                    <Card key={game.id} className="card">
                        <Card.Img
                            variant="top"
                            src={game.image_url}
                            alt={game.name}
                            className="img-fluid"
                        />
                        <Card.Body>
                            <Card.Title className="card-title">{game.name}</Card.Title>
                            <Card.Text className="card-text">{game.description}</Card.Text>
                            <Card.Text className="card-text">€{game.price}</Card.Text>
                            <Button
                                variant="primary"
                                onClick={() => addToCart(game)}
                                disabled={isOwned(game.id)} // Disable button if the game is owned
                                className="card-button"
                            >
                                {isOwned(game.id) ? 'Owned' : 'Add to Cart'}
                            </Button>
                        </Card.Body>
                    </Card>
                ))}
            </div>

            <h4 className="section-title">Top Games</h4>
            <div className="game-list">
                {topGames.map((game) => (
                    <Card key={game.id} className="card">
                        <Card.Img
                            variant="top"
                            src={game.image_url}
                            alt={game.name}
                            className="img-fluid"
                        />
                        <Card.Body>
                            <Card.Title className="card-title">{game.name}</Card.Title>
                            <Card.Text className="card-text">{game.description}</Card.Text>
                            <Card.Text className="card-text">€{game.price}</Card.Text>
                            <Button
                                variant="primary"
                                onClick={() => addToCart(game)}
                                disabled={isOwned(game.id)} // Disable button if the game is owned
                                className="card-button"
                            >
                                {isOwned(game.id) ? 'Owned' : 'Add to Cart'}
                            </Button>
                        </Card.Body>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default FrontPage;
