import React from 'react';
import { Card, Button, Row, Col } from 'react-bootstrap';
import { useCart } from '../contexts/CartContext';

const StorePage = () => {
    const { addToCart } = useCart();

    //temporary data storage for games
    const products = [
        { id: 1, name: 'Game 1', description: 'Game Description 1', price: 29.99 },
        { id: 2, name: 'Game 2', description: 'Game Description 2', price: 19.99 },
    ];

    return (
        <div className="store-page">
            <h2 className="text-center my-4">Store</h2>
            <Row xs={1} sm={2} md={2} lg={2} className="g-4">
                {products.map((product) => (
                    <Col key={product.id}>
                        <Card>
                            <Card.Img
                                variant="top"
                                src="" //CHANGE THIS LATER
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
