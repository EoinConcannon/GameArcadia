import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import rawgService from '../rawgService';
import '../styles/OrderHistory.css';

const OrderHistory = ({ loggedInUser }) => {
    const [orderHistory, setOrderHistory] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrderHistory = async () => {
            if (!loggedInUser) return;

            // Fetch order history from Supabase
            const { data: orderHistoryData, error: orderHistoryError } = await supabase
                .from('user_inventory')
                .select('game_id, purchased_at')
                .eq('user_id', loggedInUser.id)
                .order('purchased_at', { ascending: false });

            if (orderHistoryError) {
                console.error('Error fetching order history:', orderHistoryError);
                setError('Failed to fetch order history');
                return;
            }

            // Fetch game details for order history from RAWG API
            const orderHistoryDetails = await Promise.all(
                orderHistoryData.map(async (order) => {
                    const gameDetails = await rawgService.getGameDetails(order.game_id);
                    return { ...gameDetails, purchased_at: order.purchased_at };
                })
            );

            setOrderHistory(orderHistoryDetails);
        };

        fetchOrderHistory();
    }, [loggedInUser]);

    if (!loggedInUser) {
        return <p className="text-center">Please log in to view your order history.</p>;
    }

    return (
        <div className="order-history-page container my-5">
            <h2 className="text-center mb-4">Order History</h2>
            {error && <p className="text-danger text-center">{error}</p>}
            {orderHistory.length === 0 ? (
                <p className="text-center">You have no previous purchases.</p>
            ) : (
                <ul className="list-unstyled">
                    {orderHistory.map((order) => (
                        <li key={order.game_id + order.purchased_at}>
                            <strong>{order.name}</strong>: {new Date(order.purchased_at).toLocaleString()}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default OrderHistory;