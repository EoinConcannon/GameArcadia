import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Row, Col, Card, Button, Form } from 'react-bootstrap';
import { useCart } from '../contexts/CartContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const StorePage = () => {
    const [products, setProducts] = useState([]); // State to store the list of products
    const [filteredProducts, setFilteredProducts] = useState([]); // State to store filtered list of products
    const [searchQuery, setSearchQuery] = useState(''); // State to track search query
    const { addToCart } = useCart(); // Hook to access cart context

    // Fetch products from Supabase when the component displays
    useEffect(() => {
        const fetchProducts = async () => {
            const { data, error } = await supabase
                .from('games')
                .select('*');

            if (error) {
                console.error('Error fetching products:', error);
            } else {
                console.log('Fetched products:', data);
                setProducts(data); // Update state with fetched products
                setFilteredProducts(data); // Initialize filtered products with all products
            }
        };

        fetchProducts();
    }, []); // Empty dependency array ensures this runs only once when the component displays

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

            <Row xs={1} sm={2} md={2} lg={2} className="g-4">
                {filteredProducts.map((product) => (
                    <Col key={product.id}>
                        <Card>
                            <Card.Img
                                variant="top"
                                src={product.image_url || 'default-image-url'} // Replace with actual image URL field
                                alt={product.name}
                                className="img-fluid"
                                style={{ maxHeight: '200px', objectFit: 'cover' }}
                            />
                            <Card.Body>
                                <Card.Title>{product.name}</Card.Title>
                                <Card.Text>{product.description}</Card.Text>
                                <Card.Text>€{product.price}</Card.Text>
                                <Button
                                    variant="primary"
                                    onClick={() => addToCart(product)}
                                >
                                    Add to Cart
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
