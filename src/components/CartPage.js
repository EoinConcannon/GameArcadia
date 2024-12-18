import React from 'react';
import { useCart } from '../contexts/CartContext';

const CartPage = () => {
    const { cartItems, removeFromCart, clearCart } = useCart(); // Access cart context

    // Calculate the total price of items in the cart
    const totalPrice = cartItems.reduce((total, item) => total + item.price, 0);

    // Handle purchase action
    const handlePurchase = () => {
        if (cartItems.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        alert('Your purchase was successful.'); // Alert for successful purchase
        clearCart(); // Clear the cart after purchase
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
