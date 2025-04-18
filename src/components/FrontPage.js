import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import { Card, Button, Form, Row, Col, ListGroup } from 'react-bootstrap';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import '../styles/FrontPage.css';
import rawgService from '../rawgService';
import axios from 'axios';

const FrontPage = ({ loggedInUser }) => {
    // State declarations
    const [randomGame, setRandomGame] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [recommendedGames, setRecommendedGames] = useState([]);
    const [topGames, setTopGames] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const { cartItems, addToCart } = useCart();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState({
        featuredGame: true,
        recommendations: false,
        topGames: false
    });

    // Helper: Shuffle an array
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    // Fetch games for featured + initial recommendations
    useEffect(() => {
        const fetchGames = async () => {
            try {
                const games = await rawgService.getGames();
                const shuffledGames = shuffleArray(games);
                setRecommendedGames(shuffledGames.slice(0, 6));
                setRandomGame(games[Math.floor(Math.random() * games.length)]);
            } catch (error) {
                console.error('Error fetching games from RAWG API:', error);
            }
        };

        fetchGames();
    }, []);

    // Fetch popular games
    useEffect(() => {
        const fetchPopularGames = async () => {
            setIsLoading(prev => ({ ...prev, topGames: true }));
            try {
                const popularGames = await rawgService.getPopularGames();
                setTopGames(popularGames.slice(0, 6));
            } catch (error) {
                console.error('Error fetching popular games:', error);
            } finally {
                setIsLoading(prev => ({ ...prev, topGames: false }));
            }
        };

        fetchPopularGames();
    }, []);

    // Fetch user's inventory from Supabase
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

            // Fetch genre details for each owned game
            const inventoryDetails = await Promise.all(
                data.map(async (item) => {
                    const gameDetails = await rawgService.getGameDetails(item.game_id);
                    return { id: item.game_id, genres: gameDetails.genres.map((genre) => genre.name) };
                })
            );

            setInventory(inventoryDetails);
        };

        fetchInventory();
    }, [loggedInUser]);

    // Determine user's top 3 genres
    const getFavoriteGenres = useCallback(() => {
        const genreCount = {};

        inventory.forEach((game) => {
            game.genres?.forEach((genre) => {
                genreCount[genre] = (genreCount[genre] || 0) + 1;
            });
        });

        return Object.entries(genreCount)
            .sort((a, b) => b[1] - a[1])
            .map(([genre]) => genre)
            .slice(0, 3);
    }, [inventory]);

    // Helper: filter out games user already owns
    const filteredOwnedGames = useMemo(() => {
        const ownedIds = inventory.map(game => game.id);
        return games => games.filter(game => !ownedIds.includes(game.id));
    }, [inventory]);

    // Fetch personalized recommendations
    useEffect(() => {
        const fetchRecommendedGames = async () => {
            if (!loggedInUser || inventory.length === 0) return;

            const favoriteGenres = getFavoriteGenres();
            if (favoriteGenres.length === 0) return;

            try {
                const genreGames = await Promise.all(
                    favoriteGenres.map((genre) => rawgService.getGamesByGenre(genre))
                );

                const allGames = genreGames.flat();
                const filteredGames = filteredOwnedGames(allGames);

                setRecommendedGames(filteredGames.slice(0, 6));
            } catch (error) {
                console.error('Error fetching recommended games:', error);
            }
        };

        fetchRecommendedGames();
    }, [loggedInUser, inventory, getFavoriteGenres, filteredOwnedGames]);

    // Backup recommendation strategy if primary fails
    useEffect(() => {
        const fetchFallbackRecommendations = async () => {
            if (recommendedGames.length > 0 || !loggedInUser || inventory.length === 0) return;

            try {
                const favoriteGenres = getFavoriteGenres();
                const primaryGenre = favoriteGenres[0] || null;

                if (primaryGenre) {
                    const directSearch = await rawgService.searchGames(primaryGenre);
                    const ownedIds = inventory.map(game => game.id);
                    const filteredGames = directSearch.filter(game => !ownedIds.includes(game.id));

                    if (filteredGames.length > 0) {
                        setRecommendedGames(filteredGames.slice(0, 6));
                        return;
                    }

                    // Try fallback using tags
                    const response = await axios.get(`https://api.rawg.io/api/games`, {
                        params: {
                            key: process.env.REACT_APP_RAWG_API_KEY,
                            tags: primaryGenre.toLowerCase(),
                            page_size: 20,
                        }
                    });

                    const tagGames = response.data.results || [];
                    const filteredTagGames = tagGames.filter(game => !ownedIds.includes(game.id));

                    if (filteredTagGames.length > 0) {
                        setRecommendedGames(filteredTagGames.slice(0, 6));
                        return;
                    }
                }

                // Final fallback: popular games
                const popularGames = await rawgService.getPopularGames();
                const ownedIds = inventory.map(game => game.id);
                const filteredPopular = popularGames.filter(game => !ownedIds.includes(game.id));

                setRecommendedGames(filteredPopular.slice(0, 6));
            } catch (error) {
                console.error("Error in fallback recommendations:", error);

                try {
                    const games = await rawgService.getGames();
                    setRecommendedGames(games.slice(0, 6));
                } catch (finalError) {
                    console.error("Failed to get any recommendations:", finalError);
                }
            }
        };

        fetchFallbackRecommendations();
    }, [recommendedGames.length, loggedInUser, inventory, getFavoriteGenres]);

    // Helpers for checking ownership/cart
    const isOwned = (gameId) => inventory.some((game) => game.id === gameId);
    const isInCart = (gameId) => cartItems.some((item) => item.game_id === gameId);

    // Handle search logic
    const handleSearchChange = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.trim().length > 0) {
            try {
                const results = await rawgService.searchGames(query);
                const filteredResults = results.filter((game) =>
                    game.name.toLowerCase().startsWith(query.toLowerCase())
                );
                setSearchResults(filteredResults);
            } catch (error) {
                console.error('Error searching games:', error);
            }
        } else {
            setSearchResults([]);
        }
    };

    // Navigation helpers
    const handleCardClick = (gameId) => navigate(`/game/${gameId}`);
    const handleSearchResultClick = (gameId) => navigate(`/game/${gameId}`);

    // Card UI for displaying each game
    const GameCard = ({ game, isOwned, isInCart, addToCart, onClick }) => (
        <Card className="card" onClick={() => onClick(game.id)}>
            <Card.Img
                variant="top"
                src={game.background_image}
                alt={game.name}
                className="img-fluid"
            />
            <Card.Body className="card-body">
                <Card.Title className="card-title">{game.name}</Card.Title>
                <Card.Text className="card-text">
                    {game.description_raw?.substring(0, 100)}...
                </Card.Text>
                <Card.Text className="card-text">Rating: {game.rating}</Card.Text>
                <Card.Text className="card-text">Price: €19.99</Card.Text>
                <Button
                    variant="primary"
                    onClick={(e) => {
                        e.stopPropagation();
                        addToCart({ ...game, price: 19.99, game_id: game.id });
                    }}
                    disabled={isOwned(game.id) || isInCart(game.id)}
                    className="card-button"
                >
                    {isOwned(game.id) ? 'Owned' : isInCart(game.id) ? 'In Cart' : 'Add to Cart'}
                </Button>
            </Card.Body>
        </Card>
    );

    if (!randomGame) {
        return <p>Loading featured game...</p>;
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
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </Form>
                {searchResults.length > 0 && (
                    <ListGroup className="search-results">
                        {searchResults.map((game) => (
                            <ListGroup.Item
                                key={game.id}
                                onClick={() => handleSearchResultClick(game.id)}
                                className="d-flex align-items-center"
                            >
                                {game.background_image && (
                                    <img
                                        src={game.background_image}
                                        alt=""
                                        className="search-result-image me-2"
                                        style={{ width: '40px', height: '30px', objectFit: 'cover' }}
                                    />
                                )}
                                {game.name}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </div>

            {/* Featured Game */}
            <h4 className="section-title">Featured Game</h4>
            <Row className="game-list">
                <Col xs={12} sm={6} md={4} lg={3}>
                    <GameCard
                        game={randomGame}
                        isOwned={isOwned}
                        isInCart={isInCart}
                        addToCart={addToCart}
                        onClick={handleCardClick}
                    />
                </Col>
            </Row>

            {/* Recommendations */}
            <h4 className="section-title">Recommended Games</h4>
            {recommendedGames.length === 0 ? (
                <p>No recommendations available at the moment. Try adding more games to your library!</p>
            ) : (
                <Row className="game-list">
                    {recommendedGames.map((game) => (
                        <Col key={game.id} xs={12} sm={6} md={4} lg={3}>
                            <GameCard
                                game={game}
                                isOwned={isOwned}
                                isInCart={isInCart}
                                addToCart={addToCart}
                                onClick={handleCardClick}
                            />
                        </Col>
                    ))}
                </Row>
            )}

            {/* Top Games */}
            <h4 className="section-title">Top Games</h4>
            {isLoading.topGames ? (
                <p>Loading top games...</p>
            ) : (
                <Row className="game-list">
                    {topGames.map((game) => (
                        <Col key={game.id} xs={12} sm={6} md={4} lg={3}>
                            <GameCard
                                game={game}
                                isOwned={isOwned}
                                isInCart={isInCart}
                                addToCart={addToCart}
                                onClick={handleCardClick}
                            />
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
};

export default FrontPage;
