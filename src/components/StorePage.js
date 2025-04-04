import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Button, Form } from 'react-bootstrap';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import rawgService from '../rawgService';
import { supabase } from '../supabase';
import '../styles/StorePage.css'; // Import custom CSS

const StorePage = ({ loggedInUser }) => {
    const [inventory, setInventory] = useState([]);
    const [games, setGames] = useState([]); // State to store the list of games
    const [filteredGames, setFilteredGames] = useState([]); // State to store filtered list of games
    const [searchQuery, setSearchQuery] = useState(''); // State to track search query
    const [isLoading, setIsLoading] = useState(true); // State to track loading status
    const { cartItems, addToCart } = useCart(); // Hook to access cart context
    const navigate = useNavigate(); // Hook to navigate to different routes

    // Fix: Move debounce implementation inside the component and use useCallback properly
    const debouncedSearch = useCallback((query) => {
        const filtered = games.filter((game) =>
            game.name.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredGames(filtered);
    }, [games]);

    // Create a debounced version of the search function
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery) {
                debouncedSearch(searchQuery);
            } else {
                setFilteredGames(games); // Reset to all games when search is empty
            }
        }, 300);
        
        return () => clearTimeout(timeoutId); // Clean up on unmount or when dependencies change
    }, [searchQuery, debouncedSearch, games]);

    // Fetch games from RAWG API when the component displays
    useEffect(() => {
        const fetchGames = async () => {
            setIsLoading(true);
            try {
                const games = await rawgService.getGames();
                setGames(games); // Update state with fetched games
                setFilteredGames(games); // Initialize filtered games with all games
            } catch (error) {
                console.error('Error fetching games from RAWG API:', error);
            } finally {
                setIsLoading(false);
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

    // Handle search input change
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
    };

    // Check if a game is owned by the user
    const isOwned = (gameId) => inventory.includes(gameId);

    // Check if a game is in the cart
    const isInCart = (gameId) => cartItems.some((item) => item.game_id === gameId);

    // Navigate to game details page
    const handleCardClick = (gameId) => {
        navigate(`/game/${gameId}`);
    };

    return (
        <div className="store-page">
            <h2 className="text-center my-4">Store</h2>

            {/* Search Bar */}
            <div className="search-bar text-center mb-4">
                <Form>
                    <Form.Control
                        type="text"
                        placeholder="Search for a game..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        style={{
                            maxWidth: '400px',
                            margin: '0 auto',
                            textAlign: 'center',
                        }}
                    />
                </Form>
            </div>

            {isLoading ? (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading games...</span>
                    </div>
                    <p className="mt-3">Loading store catalog...</p>
                </div>
            ) : filteredGames.length > 0 ? (
                <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                    {filteredGames.map((game) => (
                        <Col key={game.id}>
                            <Card className="game-card" onClick={() => handleCardClick(game.id)}>
                                <Card.Img
                                    variant="top"
                                    src={game.background_image || 'default-image-url'} // Replace with actual image URL field
                                    alt={game.name}
                                    className="img-fluid"
                                />
                                <Card.Body>
                                    <Card.Title>{game.name}</Card.Title>
                                    <Card.Text>
                                        {game.description_raw 
                                            ? game.description_raw.length > 100 
                                                ? `${game.description_raw.substring(0, 100)}...` 
                                                : game.description_raw
                                            : 'No description available'}
                                    </Card.Text>
                                    <Card.Text>Rating: {game.rating}</Card.Text>
                                    <Card.Text>Price: €19.99</Card.Text> {/* Add price */}
                                    <Button
                                        variant="primary"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent card click event
                                            addToCart({ ...game, price: 19.99, game_id: game.id });
                                        }}
                                        disabled={isOwned(game.id) || isInCart(game.id)} // Disable button if the game is owned or in cart
                                    >
                                        {isOwned(game.id) ? 'Owned' : isInCart(game.id) ? 'In Cart' : 'Add to Cart'}
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                <p className="text-center">No games found matching your search.</p>
            )}
        </div>
    );
};

export default StorePage;
