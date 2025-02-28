import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Card, Button, Form } from 'react-bootstrap';
import { useCart } from '../contexts/CartContext';
import '../styles/FrontPage.css';
import rawgService from '../rawgService';

const FrontPage = ({ loggedInUser }) => {
    const [randomGame, setRandomGame] = useState(null); // State to store the random game
    const [inventory, setInventory] = useState([]); // State to store user's inventory
    const [recommendedGames, setRecommendedGames] = useState([]); // State to store recommended games
    const [topGames, setTopGames] = useState([]); // State to store top games
    const { addToCart } = useCart(); // Hook to access cart context

    // Fetch games from RAWG API
    useEffect(() => {
        const fetchGames = async () => {
            try {
                const games = await rawgService.getGames();
                setRecommendedGames(games.slice(0, 4)); // Set the first 4 games as recommended games
                setTopGames(games.slice(4, 8)); // Set the next 4 games as top games
                setRandomGame(games[Math.floor(Math.random() * games.length)]); // Set a random game
            } catch (error) {
                console.error('Error fetching games from RAWG API:', error);
            }
        };

        fetchGames();
    }, []);

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
                    src={randomGame.background_image || 'components/temp_image/image.jpg'} // Replace with actual image URL field
                    alt={randomGame.name}
                    className="img-fluid"
                />
                <Card.Body className="card-body">
                    <Card.Title className="card-title">{randomGame.name}</Card.Title>
                    <Card.Text className="card-text">{randomGame.description_raw}</Card.Text>
                    <Card.Text className="card-text">Rating: {randomGame.rating}</Card.Text>
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
                            src={game.background_image}
                            alt={game.name}
                            className="img-fluid"
                        />
                        <Card.Body className="card-body">
                            <Card.Title className="card-title">{game.name}</Card.Title>
                            <Card.Text className="card-text">{game.description_raw}</Card.Text>
                            <Card.Text className="card-text">Rating: {game.rating}</Card.Text>
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
                            src={game.background_image}
                            alt={game.name}
                            className="img-fluid"
                        />
                        <Card.Body className="card-body">
                            <Card.Title className="card-title">{game.name}</Card.Title>
                            <Card.Text className="card-text">{game.description_raw}</Card.Text>
                            <Card.Text className="card-text">Rating: {game.rating}</Card.Text>
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
