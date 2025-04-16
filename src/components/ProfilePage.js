import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import { Card, Row, Col } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import rawgService from '../rawgService'; 
import '../styles/ProfilePage.css';

const ProfilePage = ({ loggedInUser, setLoggedInUser }) => {
    const [inventory, setInventory] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Add loading state for better UX
    const [isLoading, setIsLoading] = useState(false);

    // Add pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const gamesPerPage = 9;

    // Calculate pagination indices
    const indexOfLastGame = currentPage * gamesPerPage;
    const indexOfFirstGame = indexOfLastGame - gamesPerPage;
    const currentGames = inventory.slice(indexOfFirstGame, indexOfLastGame);
    const totalPages = Math.ceil(inventory.length / gamesPerPage);

    // Pagination navigation function
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Fetch user inventory from Supabase and RAWG API
    useEffect(() => {
        let isMounted = true;

        const fetchInventory = async () => {
            if (!loggedInUser) return;

            setIsLoading(true);

            try {
                const { data: inventoryData, error: inventoryError } = await supabase
                    .from('user_inventory')
                    .select('game_id')
                    .eq('user_id', loggedInUser.id);

                if (inventoryError || !isMounted) {
                    if (isMounted) {
                        console.error('Error fetching inventory:', inventoryError);
                        setError('Failed to fetch inventory');
                    }
                    return;
                }

                // Fetch game details from RAWG API
                const gameDetails = await Promise.all(
                    inventoryData.map(async (game) => {
                        const gameDetails = await rawgService.getGameDetails(game.game_id);
                        return { ...gameDetails, game_id: game.game_id };
                    })
                );

                if (isMounted) {
                    setInventory(gameDetails); // Update inventory state with fetched data
                }
            } catch (error) {
                if (isMounted) {
                    console.error('Error:', error);
                    setError('Failed to fetch data');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchInventory();

        // Cleanup function
        return () => {
            isMounted = false;
        };
    }, [loggedInUser]);

    // Navigate to game details page
    const handleGameClick = useCallback((gameId) => {
        navigate(`/game/${gameId}`);
    }, [navigate]);

    if (!loggedInUser) {
        return <p className="text-center">Please log in to view your profile.</p>;
    }

    return (
        <div className="profile-page container my-5 text-center">
            {/* User Information Section - Now just a summary with link */}
            <div className="user-info mb-4">
                <h2 className="text-center mb-4">Welcome, {loggedInUser.username}!</h2>

                <div className="text-center mb-5">
                    <Link to="/user-info" className="btn btn-primary">
                        View & Edit User Information
                    </Link>
                </div>
            </div>

            {/* Display error message if there is an error */}
            {error && <p className="text-danger text-center">{error}</p>}

            {/* Inventory Section */}
            <div className="mt-5">
                <h2 className="text-center mb-4">{loggedInUser.username}'s Inventory</h2>
                {isLoading ? (
                    <p className="text-center">Loading your games...</p>
                ) : inventory.length === 0 ? (
                    <p className="text-center">Your inventory is empty.</p>
                ) : (
                    <>
                        <Row xs={1} sm={2} md={3} className="g-4">
                            {currentGames.map((game) => (
                                <Col key={game.game_id}>
                                    <Card
                                        onClick={() => handleGameClick(game.game_id)} // Navigate to game details page
                                        className="inventory-game-card"
                                    >
                                        <Card.Img variant="top" src={game.background_image} alt={game.name} />
                                        <Card.Body>
                                            <Card.Title>{game.name}</Card.Title>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                        {inventory.length > gamesPerPage && (
                            <div className="pagination-container mt-4">
                                <nav>
                                    <ul className="pagination justify-content-center">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => paginate(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                Previous
                                            </button>
                                        </li>
                                        {[...Array(totalPages)].map((_, index) => (
                                            <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                                                <button className="page-link" onClick={() => paginate(index + 1)}>
                                                    {index + 1}
                                                </button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => paginate(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                            >
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Order History Link Section */}
            <div className="mt-5">
                <h2 className="text-center mb-4">Order History</h2>
                <div className="text-center">
                    <Link to="/order-history" className="btn btn-primary">
                        View Order History
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
