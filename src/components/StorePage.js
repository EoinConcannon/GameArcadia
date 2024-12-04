import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Row, Col, Card, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const StorePage = () => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*');

            if (error) {
                console.error('Error fetching products:', error);
            } else {
                console.log('Fetched products:', data);
                setProducts(data);
            }
        };

        fetchProducts();
    }, []);

    const addToCart = (product) => {
        console.log('Adding to cart:', product);
    };

    return (
        <div className="store-page">
            <h2 className="text-center my-4">Store</h2>
            <Row xs={1} sm={2} md={2} lg={2} className="g-4">
                {products.map((product) => (
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
