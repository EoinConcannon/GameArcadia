import React from 'react';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

const CheckOutPage = ({ loggedInUser }) => {
    const { cartItems, clearCart } = useCart(); // Access cart context
    const navigate = useNavigate(); // Hook to navigate to different pages

    // Handle purchase action
    const handlePurchase = async () => {
        if (!loggedInUser) {
            alert('You must be logged in to make a purchase.');
            return;
        }

        if (cartItems.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        try {
            // Prepare the records for insertion
            const inventoryItems = cartItems.map((item) => ({
                user_id: loggedInUser.id, // Assuming `loggedInUser.id` is the user's UUID
                game_id: item.id,         // The game's UUID
                purchased_at: new Date(), // Current timestamp
            }));

            console.log('Inventory Items:', inventoryItems); // Log inventory items

            // Insert records into the `user_inventory` table
            const { data, error } = await supabase.from('user_inventory').insert(inventoryItems);

            if (error) {
                console.error('Error adding items to user_inventory:', error);
                console.error('Supabase Error Details:', error.details); // Log detailed error information
                console.error('Supabase Error Hint:', error.hint); // Log error hint
                alert('There was an error processing your purchase.');
                return;
            }

            console.log('Purchase Data:', data); // Log response data

            alert('Your purchase was successful!');
            clearCart(); // Clear the cart after a successful purchase
            navigate('/'); // Redirect to the home page after purchase
        } catch (err) {
            console.error('Unexpected error during purchase:', err);
            alert('An unexpected error occurred.');
        }
    };

    return (
        <div className="checkout-page container my-5">
            <h2 className="text-center mb-4">Checkout</h2>
            <div className="d-flex justify-content-between mt-4">
                <h4>Total: €{cartItems.reduce((total, item) => total + item.price, 0).toFixed(2)}</h4>
                <button className="btn btn-primary" onClick={handlePurchase}>
                    Confirm Purchase
                </button>
            </div>
        </div>
    );
};

export default CheckOutPage;
