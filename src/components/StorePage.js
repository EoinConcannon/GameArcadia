import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Button, Form, ListGroup, Nav, Spinner } from 'react-bootstrap'; // Add ListGroup, Nav, Spinner imports
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import rawgService from '../rawgService';
import { supabase } from '../supabase';
import '../styles/StorePage.css'; // Import custom CSS
import axios from 'axios';
import GameRecommender from '../GameRecommender';
import GenreMapper from '../GenreMapper';

const RAWG_API_URL = 'https://api.rawg.io/api';

const StorePage = ({ loggedInUser }) => {
    const [inventory, setInventory] = useState([]);
    const [games, setGames] = useState([]); // State to store the list of games
    const [filteredGames, setFilteredGames] = useState([]); // State to store filtered list of games
    const [searchQuery, setSearchQuery] = useState(''); // State to track search query
    const [searchResults, setSearchResults] = useState([]); // State for search results dropdown
    const [isLoading, setIsLoading] = useState(true); // State to track loading status
    const { cartItems, addToCart } = useCart(); // Hook to access cart context
    const navigate = useNavigate(); // Hook to navigate to different routes

    const [genres, setGenres] = useState([]); // State to store genres
    const [loadingGenres, setLoadingGenres] = useState(false); // State to track loading genres

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [activeFilter, setActiveFilter] = useState('popular'); // Default to popular games

    const [userInventoryDetails, setUserInventoryDetails] = useState([]);
    const [genreMapper, setGenreMapper] = useState(null);

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

    // Update the fetchInventory useEffect to get full game details for recommendations
    useEffect(() => {
        const fetchInventory = async () => {
            if (!loggedInUser) return;

            try {
                // Get basic inventory IDs
                const { data, error } = await supabase
                    .from('user_inventory')
                    .select('game_id')
                    .eq('user_id', loggedInUser.id);

                if (error) {
                    console.error('Error fetching inventory:', error);
                    return;
                }

                // Store just the IDs for simple checks
                setInventory(data.map((item) => item.game_id));

                // For recommendations, we need full game details including genres
                const inventoryDetails = await Promise.all(
                    data.map(async (item) => {
                        try {
                            return await rawgService.getGameDetails(item.game_id);
                        } catch (err) {
                            console.error(`Error fetching details for game ${item.game_id}:`, err);
                            return null;
                        }
                    })
                );

                // Filter out failed requests
                const validInventoryDetails = inventoryDetails.filter(Boolean);
                setUserInventoryDetails(validInventoryDetails);

                // Initialize genre mapper with user's games for recommendations
                if (validInventoryDetails.length > 0) {
                    const mapper = new GenreMapper();
                    await mapper.initializeGenreMappings(validInventoryDetails);
                    setGenreMapper(mapper);
                }
            } catch (e) {
                console.error("Error in inventory processing:", e);
            }
        };

        fetchInventory();
    }, [loggedInUser]);

    // Modify your genres useEffect to add the recommended filter
    useEffect(() => {
        const fetchGenres = async () => {
            setLoadingGenres(true);
            try {
                const response = await axios.get(`https://api.rawg.io/api/genres`, {
                    params: {
                        key: process.env.REACT_APP_RAWG_API_KEY
                    }
                });
                // Add recommended filter to the special filters
                setGenres([
                    { id: 'popular', name: 'Popular Games', isSpecial: true },
                    { id: 'top_rated', name: 'Top Rated', isSpecial: true },
                    { id: 'recommended', name: 'Recommended', isSpecial: true }, // New filter
                    { id: 'all', name: 'All Games', isSpecial: true },
                    ...response.data.results
                ]);
            } catch (error) {
                console.error('Error fetching genres:', error);
                setGenres([
                    { id: 'popular', name: 'Popular Games', isSpecial: true },
                    { id: 'top_rated', name: 'Top Rated', isSpecial: true },
                    { id: 'recommended', name: 'Recommended', isSpecial: true }, // New filter
                    { id: 'all', name: 'All Games', isSpecial: true }
                ]);
            } finally {
                setLoadingGenres(false);
            }
        };

        fetchGenres();
    }, []);

    // Update the filterGamesByGenre function to handle the recommended filter
    useEffect(() => {
        const filterGamesByGenre = async () => {
            setIsLoading(true);

            try {
                let filteredResults = [];

                // Handle special filters
                if (!activeFilter || activeFilter === 'all') {
                    // Get all games
                    const allGamesData = await rawgService.getGamesPaginated(1, 40);
                    filteredResults = allGamesData.results;
                    setHasMore(allGamesData.hasNextPage);
                }
                else if (activeFilter === 'popular') {
                    // Get popular games
                    const popularGames = await rawgService.getPopularGames(40);
                    filteredResults = popularGames;
                    setHasMore(popularGames.length >= 40);
                }
                else if (activeFilter === 'top_rated') {
                    // Get top rated games
                    const response = await axios.get(`${RAWG_API_URL}/games`, {
                        params: {
                            key: process.env.REACT_APP_RAWG_API_KEY,
                            ordering: '-rating',
                            page_size: 40
                        }
                    });
                    filteredResults = response.data.results || [];
                    setHasMore(!!response.data.next);
                }
                else if (activeFilter === 'recommended') {
                    // Get personalized recommendations if user is logged in and has games
                    if (loggedInUser && userInventoryDetails.length > 0 && genreMapper) {
                        const recommender = new GameRecommender(userInventoryDetails, genreMapper);

                        // Get recommendations based on user's library
                        const recommendations = await recommender.getRecommendations();

                        if (recommendations.length > 0) {
                            filteredResults = recommendations;
                        } else {
                            // Fallback to popular games if recommendations fail
                            const popularGames = await rawgService.getPopularGames(40);
                            filteredResults = popularGames;
                        }
                    } else {
                        // If user has no games or isn't logged in, show popular games
                        const popularGames = await rawgService.getPopularGames(40);
                        filteredResults = popularGames;
                    }

                    // Recommendations don't support pagination currently
                    setHasMore(false);
                }
                else {
                    // Get popular games by genre - modified to get higher quality results
                    const response = await axios.get(`${RAWG_API_URL}/games`, {
                        params: {
                            key: process.env.REACT_APP_RAWG_API_KEY,
                            genres: activeFilter,
                            ordering: '-metacritic,-rating,-added', // Order by metacritic score, then rating, then popularity
                            page_size: 40,
                            metacritic: '60,100' // Only include games with decent metacritic scores
                        }
                    });

                    filteredResults = response.data.results || [];

                    // If we didn't get enough results with metacritic filter, try without it
                    if (filteredResults.length < 10) {
                        console.log(`Only found ${filteredResults.length} games with metacritic filter, trying without it`);
                        const backupResponse = await axios.get(`${RAWG_API_URL}/games`, {
                            params: {
                                key: process.env.REACT_APP_RAWG_API_KEY,
                                genres: activeFilter,
                                ordering: '-rating,-added', // Order by rating, then popularity
                                page_size: 40
                            }
                        });
                        filteredResults = backupResponse.data.results || [];
                    }

                    setHasMore(filteredResults.length >= 40);
                }

                // Filter out games without images (these often have poor data quality)
                filteredResults = filteredResults.filter(game => game.background_image);

                // Filter out owned games from recommendations
                if (activeFilter === 'recommended') {
                    filteredResults = filteredResults.filter(game => !inventory.includes(game.id));
                }

                setFilteredGames(filteredResults);
                setGames(filteredResults);
            } catch (error) {
                console.error(`Error filtering games: ${error}`);
                setFilteredGames([]);
            } finally {
                setIsLoading(false);
            }
        };

        filterGamesByGenre();
    }, [activeFilter, loggedInUser, userInventoryDetails, inventory, genreMapper]);

    // Handle search input change
    const handleSearchChange = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.trim().length > 0) {
            try {
                const results = await rawgService.searchGames(query);
                // Filter results to only include games whose name starts with the search query
                const filteredResults = results.filter((game) =>
                    game.name.toLowerCase().startsWith(query.toLowerCase())
                ).slice(0, 6); // Limit to 6 results
                setSearchResults(filteredResults);
            } catch (error) {
                console.error('Error searching games:', error);
            }
        } else {
            setSearchResults([]);
            // Reset to all games when search is empty
            setFilteredGames(games);
        }
    };

    // Update handleGenreSelect to work with our new approach
    const handleGenreSelect = (genreId, genreName) => {
        setActiveFilter(genreId);
        setSearchQuery('');
        setSearchResults([]);
        setPage(1); // Reset pagination
    };

    // Add this function to handle search result click
    const handleSearchResultClick = (gameId) => {
        navigate(`/game/${gameId}`);
        setSearchResults([]); // Clear results after click
    };

    // Check if a game is owned by the user
    const isOwned = (gameId) => inventory.includes(gameId);

    // Check if a game is in the cart
    const isInCart = (gameId) => cartItems.some((item) => item.game_id === gameId);

    // Navigate to game details page
    const handleCardClick = (gameId) => {
        navigate(`/game/${gameId}`);
    };

    const loadMoreGames = async () => {
        setLoadingMore(true);
        try {
            const nextPage = page + 1;

            let newGames = [];
            let hasNextPage = false;

            // Handle different filter types
            if (activeFilter === 'all') {
                const gamesData = await rawgService.getGamesPaginated(nextPage, 20);
                newGames = gamesData.results;
                hasNextPage = gamesData.hasNextPage;
            }
            else if (activeFilter === 'popular') {
                // For popular games, we can use page parameter
                const response = await axios.get(`${RAWG_API_URL}/games`, {
                    params: {
                        key: process.env.REACT_APP_RAWG_API_KEY,
                        ordering: '-added',
                        page: nextPage,
                        page_size: 20
                    }
                });
                newGames = response.data.results || [];
                hasNextPage = !!response.data.next;
            }
            else if (activeFilter === 'top_rated') {
                // For top rated games
                const response = await axios.get(`${RAWG_API_URL}/games`, {
                    params: {
                        key: process.env.REACT_APP_RAWG_API_KEY,
                        ordering: '-rating',
                        page: nextPage,
                        page_size: 20
                    }
                });
                newGames = response.data.results || [];
                hasNextPage = !!response.data.next;
            }
            else if (activeFilter === 'recommended') {
                // Recommended doesn't support pagination currently
                newGames = [];
                hasNextPage = false;
            }
            else {
                // For genre-specific games - updated to match the main filter function
                const response = await axios.get(`${RAWG_API_URL}/games`, {
                    params: {
                        key: process.env.REACT_APP_RAWG_API_KEY,
                        genres: activeFilter,
                        ordering: '-metacritic,-rating,-added',
                        page: nextPage,
                        page_size: 20,
                        metacritic: '60,100'
                    }
                });
                newGames = response.data.results || [];
                hasNextPage = !!response.data.next;

                // If we didn't get enough results with metacritic filter, try without it
                if (newGames.length < 5) {
                    const backupResponse = await axios.get(`${RAWG_API_URL}/games`, {
                        params: {
                            key: process.env.REACT_APP_RAWG_API_KEY,
                            genres: activeFilter,
                            ordering: '-rating,-added',
                            page: nextPage,
                            page_size: 20
                        }
                    });
                    newGames = backupResponse.data.results || [];
                    hasNextPage = !!backupResponse.data.next;
                }
            }

            // Filter out games without images
            newGames = newGames.filter(game => game.background_image);

            setGames(prevGames => [...prevGames, ...newGames]);
            setFilteredGames(prevGames => [...prevGames, ...newGames]);
            setPage(nextPage);
            setHasMore(hasNextPage);
        } catch (error) {
            console.error('Error loading more games:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    // Add this function to your StorePage component
    const getCategoryTitle = () => {
        if (!activeFilter) return 'All Games';

        // For special filters
        if (activeFilter === 'popular') return 'Popular Games';
        if (activeFilter === 'top_rated') return 'Top Rated Games';
        if (activeFilter === 'recommended') return 'Recommended For You';
        if (activeFilter === 'all') return 'All Games';

        // For normal genre, find the matching genre name
        const activeGenre = genres.find(g => g.id === activeFilter);
        return activeGenre ? `${activeGenre.name} Games` : 'Games';
    };

    // Replace the current getPlatformIcon function with this text-based version
    const getPlatformIcon = (platformSlug) => {
        switch (platformSlug) {
            case 'pc': return 'PC';
            case 'playstation': return 'PS';
            case 'xbox': return 'XB';
            case 'nintendo': return 'SWI';
            case 'ios': return 'iOS';
            case 'android': return 'AND';
            case 'mac': return 'MAC';
            case 'linux': return 'LNX';
            case 'web': return 'WEB';
            default: return '?';
        }
    };

    return (
        <div className="store-page">
            <h2 className="text-center my-4">Store</h2>

            {/* Search Bar */}
            <div className="search-container position-relative mb-4">
                <Form>
                    <Form.Control
                        type="text"
                        placeholder="Search for a game..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        style={{
                            maxWidth: '600px',
                            margin: '0 auto',
                            textAlign: 'center',
                        }}
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

            {/* Genre Filter */}
            <div className="genre-filter mb-4">
                <h5 className="text-center mb-3">Browse by Genre</h5>
                {loadingGenres ? (
                    <div className="text-center">
                        <Spinner animation="border" size="sm" /> Loading genres...
                    </div>
                ) : (
                    <Nav className="genre-nav justify-content-center flex-wrap">
                        {genres.map((genre) => (
                            <Nav.Item key={genre.id}>
                                <Nav.Link
                                    className={`genre-link ${activeFilter === genre.id ? 'active' : ''} ${genre.isSpecial ? 'special-filter' : ''}`}
                                    onClick={() => handleGenreSelect(genre.id, genre.name)}
                                >
                                    {genre.name}
                                </Nav.Link>
                            </Nav.Item>
                        ))}
                    </Nav>
                )}
            </div>

            {activeFilter === 'recommended' && !loggedInUser && (
                <div className="alert alert-info text-center mb-4">
                    Sign in to see personalized game recommendations based on your library.
                </div>
            )}

            {activeFilter === 'recommended' && loggedInUser && userInventoryDetails.length === 0 && (
                <div className="alert alert-info text-center mb-4">
                    Purchase some games to get personalized recommendations.
                    For now, we're showing you popular titles.
                </div>
            )}

            {!isLoading && filteredGames.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">:(</div>
                    <h4>No Games Found</h4>
                    <p>
                        {searchQuery
                            ? `We couldn't find any games matching "${searchQuery}"`
                            : `We couldn't find any games in ${getCategoryTitle().toLowerCase()}`
                        }
                    </p>
                    <Button
                        variant="outline-primary"
                        onClick={() => {
                            setSearchQuery('');
                            setActiveFilter('popular');
                        }}
                    >
                        Browse Popular Games
                    </Button>
                </div>
            ) : (
                <>
                    <h3 className="category-title text-center mb-4">{getCategoryTitle()}</h3>
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
                                        {/* Add badges for release date and platform */}
                                        <div className="game-card-badges">
                                            {game.released && (
                                                <span className="badge bg-dark release-date">
                                                    {new Date(game.released).getFullYear()}
                                                </span>
                                            )}
                                            {game.parent_platforms && game.parent_platforms.map(p => (
                                                <span key={p.platform.id} className="badge bg-secondary platform-badge" title={p.platform.name}>
                                                    {getPlatformIcon(p.platform.slug)}
                                                </span>
                                            ))}
                                        </div>
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
                </>
            )}

            {!isLoading && filteredGames.length > 0 && hasMore && (
                <div className="text-center mt-4 mb-5">
                    <Button
                        variant="outline-primary"
                        onClick={loadMoreGames}
                        disabled={loadingMore}
                    >
                        {loadingMore ? (
                            <>
                                <Spinner animation="border" size="sm" /> Loading...
                            </>
                        ) : (
                            'Load More Games'
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default StorePage;
