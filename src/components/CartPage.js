import React from 'react';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../supabase';

const CartPage = ({ loggedInUser }) => {
    const { cartItems, removeFromCart, clearCart } = useCart(); // Access cart context

    // Calculate the total price of items in the cart
    const totalPrice = cartItems.reduce((total, item) => total + item.price, 0);

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
        } catch (err) {
            console.error('Unexpected error during purchase:', err);
            alert('An unexpected error occurred.');
        }
    };

    return (
        <div className="cart-page container my-5">
            <h2 className="text-center mb-4">Your Cart</h2>
            {cartItems.length === 0 ? (
                <p className="text-center">Your cart is empty</p>
            ) : (
                <div>
                    {cartItems.map((item) => (
                        <div key={item.id} className="cart-item mb-3 p-3 border rounded">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h5>{item.name}</h5>
                                    <p>€{item.price}</p>
                                </div>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => removeFromCart(item.id)}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                    <div className="d-flex justify-content-between mt-4">
                        <h4>Total: €{totalPrice.toFixed(2)}</h4> {/* Display total price */}
                        <button className="btn btn-primary" onClick={handlePurchase}>
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;
