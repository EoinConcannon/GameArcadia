import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Form } from 'react-bootstrap';
import { useCart } from '../contexts/CartContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import rawgService from '../rawgService';
import { supabase } from '../supabase';
import '../styles/StorePage.css'; // Import custom CSS

const StorePage = ({ loggedInUser }) => {
    const [inventory, setInventory] = useState([]);
    const [products, setProducts] = useState([]); // State to store the list of products
    const [filteredProducts, setFilteredProducts] = useState([]); // State to store filtered list of products
    const [searchQuery, setSearchQuery] = useState(''); // State to track search query
    const { addToCart } = useCart(); // Hook to access cart context

    // Fetch products from RAWG API when the component displays
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const games = await rawgService.getGames();
                setProducts(games); // Update state with fetched products
                setFilteredProducts(games); // Initialize filtered products with all products
            } catch (error) {
                console.error('Error fetching products from RAWG API:', error);
            }
        };

        fetchProducts();
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

    // Handle search input change and filter products
    const handleSearchChange = (e) => {
        const query = e.target.value.toLowerCase(); // Convert search query to lowercase
        setSearchQuery(query);

        // Filter products by name
        const filtered = products.filter((product) =>
            product.name.toLowerCase().includes(query)
        );
        setFilteredProducts(filtered); // Update state with filtered products
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
                {filteredProducts.map((product) => (
                    <Col key={product.id}>
                        <Card className="game-card">
                            <Card.Img
                                variant="top"
                                src={product.background_image || 'default-image-url'} // Replace with actual image URL field
                                alt={product.name}
                                className="img-fluid"
                            />
                            <Card.Body>
                                <Card.Title>{product.name}</Card.Title>
                                <Card.Text>{product.description_raw}</Card.Text>
                                <Card.Text>Rating: {product.rating}</Card.Text>
                                <Button
                                    variant="primary"
                                    onClick={() => addToCart(product)}
                                    disabled={isOwned(product.id)} // Disable button if the game is owned
                                >
                                    {isOwned(product.id) ? 'Owned' : 'Add to Cart'}
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
