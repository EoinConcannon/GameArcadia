import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Form } from 'react-bootstrap';
import { useCart } from '../contexts/CartContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import rawgService from '../rawgService';
import { supabase } from '../supabase';
import '../styles/StorePage.css'; // Import custom CSS

const StorePage = ({ loggedInUser }) => {
    const [inventory, setInventory] = useState([]);
    const [games, setGames] = useState([]); // State to store the list of games
    const [filteredGames, setFilteredGames] = useState([]); // State to store filtered list of games
    const [searchQuery, setSearchQuery] = useState(''); // State to track search query
    const { addToCart } = useCart(); // Hook to access cart context

    // Fetch games from RAWG API when the component displays
    useEffect(() => {
        const fetchGames = async () => {
            try {
                const games = await rawgService.getGames();
                setGames(games); // Update state with fetched games
                setFilteredGames(games); // Initialize filtered games with all games
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

    // Handle search input change and filter games
    const handleSearchChange = (e) => {
        const query = e.target.value.toLowerCase(); // Convert search query to lowercase
        setSearchQuery(query);

        // Filter games by name
        const filtered = games.filter((game) =>
            game.name.toLowerCase().includes(query)
        );
        setFilteredGames(filtered); // Update state with filtered games
    };

    // Check if a game is owned by the user
    const isOwned = (gameId) => inventory.includes(gameId);

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

            <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                {filteredGames.map((game) => (
                    <Col key={game.id}>
                        <Card className="game-card">
                            <Card.Img
                                variant="top"
                                src={game.background_image || 'default-image-url'} // Replace with actual image URL field
                                alt={game.name}
                                className="img-fluid"
                            />
                            <Card.Body>
                                <Card.Title>{game.name}</Card.Title>
                                <Card.Text>{game.description_raw}</Card.Text>
                                <Card.Text>Rating: {game.rating}</Card.Text>
                                <Card.Text>Price: €19.99</Card.Text> {/* Add price */}
                                <Button
                                    variant="primary"
                                    onClick={() => addToCart({ ...game, price: 19.99 })}
                                    disabled={isOwned(game.id)} // Disable button if the game is owned
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

export default StorePage;
