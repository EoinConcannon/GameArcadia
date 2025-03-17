import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import rawgService from '../rawgService';
import { Card, Container, Button, Modal } from 'react-bootstrap';
import { useCart } from '../contexts/CartContext';
import '../styles/GameDetailsPage.css';

const GameDetailsPage = () => {
    const { gameId } = useParams(); // Get the game ID from the URL
    const [game, setGame] = useState(null); // State to store the game details
    const { addToCart, cartItems } = useCart(); // Hook to access cart context
    const [showModal, setShowModal] = useState(false); // State to toggle modal visibility

    // Fetch game details from RAWG API
    useEffect(() => {
        const fetchGameDetails = async () => {
            try {
                const gameDetails = await rawgService.getGameDetails(gameId);
                setGame(gameDetails); // Set the game details
            } catch (error) {
                console.error('Error fetching game details:', error);
            }
        };

        fetchGameDetails();
    }, [gameId]);

    if (!game) {
        return <p>Loading game details...</p>; // Display loading message until game details are fetched
    }

    // Check if a game is in the cart
    const isInCart = (gameId) => cartItems.some((item) => item.game_id === gameId);

    // Toggle modal visibility
    const handleDescriptionClick = () => {
        setShowModal(true);
    };

    // Close modal
    const handleCloseModal = () => {
        setShowModal(false);
    };

    return (
        <Container className="game-details-page">
            <div className="game-details-container">
                <img
                    src={game.background_image}
                    alt={game.name}
                    className="game-details-image"
                />
                <Card className="game-details-card">
                    <Card.Body>
                        <Card.Title>{game.name}</Card.Title>
                        <Card.Text onClick={handleDescriptionClick}>
                            {`${game.description_raw.substring(0, 100)}...`}
                        </Card.Text>
                        <Card.Text>Rating: {game.rating}</Card.Text>
                        <Card.Text>Price: €19.99</Card.Text> {/* Add price */}
                        <Button
                            variant="primary"
                            onClick={() => addToCart({ ...game, price: 19.99, game_id: game.id })}
                            disabled={isInCart(game.id)} // Disable button if the game is in cart
                            className="card-button"
                        >
                            {isInCart(game.id) ? 'In Cart' : 'Add to Cart'}
                        </Button>
                    </Card.Body>
                </Card>
            </div>

            {/* Modal for full description */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{game.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{game.description_raw}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default GameDetailsPage;