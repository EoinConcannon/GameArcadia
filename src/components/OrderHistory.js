import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import rawgService from '../rawgService';
import '../styles/OrderHistory.css';

const OrderHistory = ({ loggedInUser }) => {
    const [orderHistory, setOrderHistory] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage] = useState(10);
    const [totalSpent, setTotalSpent] = useState(0);

    useEffect(() => {
        let isMounted = true;

        const fetchOrderHistory = async () => {
            if (!loggedInUser) return;

            setIsLoading(true);

            try {
                // Fetch order history from Supabase
                const { data: orderHistoryData, error: orderHistoryError } = await supabase
                    .from('user_inventory')
                    .select('game_id, purchased_at')
                    .eq('user_id', loggedInUser.id)
                    .order('purchased_at', { ascending: false });

                if (orderHistoryError) {
                    throw new Error(orderHistoryError.message);
                }

                // Calculate total spent using fixed price of €19.99 per game
                const fixedPrice = 19.99;
                const total = orderHistoryData.length * fixedPrice;

                // Fetch game details with proper error handling
                const orderHistoryDetails = await Promise.all(
                    orderHistoryData.map(async (order) => {
                        try {
                            const gameDetails = await rawgService.getGameDetails(order.game_id);
                            return {
                                ...gameDetails,
                                purchased_at: order.purchased_at,
                                purchase_price: fixedPrice, // Use fixed price for all games
                                // Fallbacks for missing data
                                name: gameDetails?.name || 'Unknown Game',
                                background_image: gameDetails?.background_image || '/default-game.png'
                            };
                        } catch (error) {
                            console.error(`Error fetching details for game ID ${order.game_id}:`, error);
                            // Return a placeholder object if game details can't be fetched
                            return {
                                name: `Game (ID: ${order.game_id})`,
                                purchased_at: order.purchased_at,
                                purchase_price: fixedPrice,
                                error: true
                            };
                        }
                    })
                );

                if (isMounted) {
                    setOrderHistory(orderHistoryDetails);
                    setTotalSpent(total);
                }
            } catch (error) {
                console.error('Error fetching order history:', error);
                setError('Failed to fetch order history');
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchOrderHistory();

        // Cleanup function
        return () => {
            isMounted = false;
        };
    }, [loggedInUser]);

    // Get current orders
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = orderHistory.slice(indexOfFirstOrder, indexOfLastOrder);

    // Group orders by date
    const groupOrdersByDate = (orders) => {
        const grouped = {};

        orders.forEach(order => {
            const date = new Date(order.purchased_at).toLocaleDateString();

            if (!grouped[date]) {
                grouped[date] = [];
            }

            grouped[date].push(order);
        });

        return grouped;
    };

    // Change page
    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    if (!loggedInUser) {
        return <p className="text-center">Please log in to view your order history.</p>;
    }

    const groupedOrders = groupOrdersByDate(currentOrders);

    return (
        <div className="order-history-page container my-5">
            <h2 className="text-center mb-4">Order History</h2>
            {error && <div className="alert alert-danger text-center">{error}</div>}

            {/* Total Spent Display */}
            {!isLoading && orderHistory.length > 0 && (
                <div className="total-spent-card mb-4">
                    <div className="total-spent-content">
                        <div className="total-spent-label">Total Spent</div>
                        <div className="total-spent-amount">€{totalSpent.toFixed(2)}</div>
                        <div className="total-spent-count">{orderHistory.length} game{orderHistory.length !== 1 ? 's' : ''} purchased</div>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="loading-container">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading your order history...</p>
                </div>
            ) : orderHistory.length === 0 ? (
                <div className="no-orders">You have no previous purchases.</div>
            ) : (
                <>
                    {Object.entries(groupedOrders).map(([date, orders]) => (
                        <div key={date} className="order-group mb-4">
                            <h5 className="order-date">{date}</h5>
                            <ul className="order-list">
                                {orders.map(order => (
                                    <li key={order.game_id + order.purchased_at} className="order-item">
                                        <div className="order-content">
                                            <div className="game-image-container">
                                                {order.background_image ? (
                                                    <img
                                                        src={order.background_image}
                                                        alt={order.name}
                                                        className="game-image"
                                                    />
                                                ) : (
                                                    <div className="game-image-placeholder"></div>
                                                )}
                                            </div>
                                            <div className="game-details">
                                                <h5 className="game-title">{order.name}</h5>
                                                <p className="game-genres">
                                                    {order.genres?.map(g => g.name).join(', ') || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="purchase-details">
                                                <div className="purchase-label">Purchased:</div>
                                                <div className="purchase-date">{new Date(order.purchased_at).toLocaleDateString()}</div>
                                                <div className="purchase-time">{new Date(order.purchased_at).toLocaleTimeString()}</div>
                                                <div className="purchase-price">€{order.purchase_price.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {orderHistory.length > ordersPerPage && (
                        <nav aria-label="Order history pagination">
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

                                {Array.from({ length: Math.ceil(orderHistory.length / ordersPerPage) }).map((_, index) => (
                                    <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => paginate(index + 1)}
                                        >
                                            {index + 1}
                                        </button>
                                    </li>
                                ))}

                                <li className={`page-item ${currentPage === Math.ceil(orderHistory.length / ordersPerPage) ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => paginate(currentPage + 1)}
                                        disabled={currentPage === Math.ceil(orderHistory.length / ordersPerPage)}
                                    >
                                        Next
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </>
            )}
        </div>
    );
};

export default OrderHistory;