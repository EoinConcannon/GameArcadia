import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Card, Button, Form, Row, Col } from 'react-bootstrap';
import { useCart } from '../contexts/CartContext';
import '../styles/FrontPage.css';
import rawgService from '../rawgService';

const FrontPage = ({ loggedInUser }) => {
    const [randomGame, setRandomGame] = useState(null); // State to store the random game
    const [inventory, setInventory] = useState([]); // State to store user's inventory
    const [recommendedGames, setRecommendedGames] = useState([]); // State to store recommended games
    const [topGames, setTopGames] = useState([]); // State to store top games
    const { addToCart } = useCart(); // Hook to access cart context

    // Function to shuffle an array
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    // Fetch games from RAWG API
    useEffect(() => {
        const fetchGames = async () => {
            try {
                const games = await rawgService.getGames();
                const shuffledGames = shuffleArray(games);
                setRecommendedGames(shuffledGames.slice(0, 6)); // Set the first 6 shuffled games as recommended games
                setRandomGame(games[Math.floor(Math.random() * games.length)]); // Set a random game
            } catch (error) {
                console.error('Error fetching games from RAWG API:', error);
            }
        };

        fetchGames();
    }, []);

    // Fetch popular games from RAWG API
    useEffect(() => {
        const fetchPopularGames = async () => {
            try {
                const popularGames = await rawgService.getPopularGames();
                setTopGames(popularGames.slice(0, 6)); // Set the first 6 popular games as top games
            } catch (error) {
                console.error('Error fetching popular games from RAWG API:', error);
            }
        };

        fetchPopularGames();
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
            <Row className="game-list">
                {recommendedGames.map((game) => (
                    <Col key={game.id} xs={12} sm={6} md={4} lg={3}>
                        <Card className="card">
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
                    </Col>
                ))}
            </Row>

            <h4 className="section-title">Top Games</h4>
            <Row className="game-list">
                {topGames.map((game) => (
                    <Col key={game.id} xs={12} sm={6} md={4} lg={3}>
                        <Card className="card">
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
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default FrontPage;
