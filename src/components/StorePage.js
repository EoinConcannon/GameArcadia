import React from 'react';
import { Card, Button, Row, Col } from 'react-bootstrap';

const StorePage = () => {
    return (
        <div className="store-page">
            <h2 className="text-center my-4">Store</h2>
            <Row xs={1} sm={2} md={2} lg={2} className="g-4">
                <Col>
                    <Card>
                        <Card.Img
                            variant="top"
                            src="https://via.placeholder.com/150"
                            alt="Product 1"
                            className="img-fluid"
                            style={{ maxHeight: '200px', objectFit: 'cover' }} //adjusts image size later
                        />
                        <Card.Body>
                            <Card.Title>Game 1</Card.Title>
                            <Card.Text>
                                Desc
                            </Card.Text>
                            <Card.Text>
                                €29.99
                            </Card.Text>
                            <Button variant="primary">Add to cart</Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col>
                    <Card>
                        <Card.Img
                            variant="top"
                            src="https://via.placeholder.com/150"
                            alt="Product 2"
                            className="img-fluid"
                            style={{ maxHeight: '200px', objectFit: 'cover' }} //adjusts image size later
                        />
                        <Card.Body>
                            <Card.Title>Game 2</Card.Title>
                            <Card.Text>
                                Desc
                            </Card.Text>
                            <Card.Text>
                                €29.99
                            </Card.Text>
                            <Button variant="primary">Add to cart</Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default StorePage;
