import React from 'react';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

const CartPage = ({ loggedInUser }) => {
    const { cartItems, removeFromCart, clearCart } = useCart(); // Access cart context
    const navigate = useNavigate(); // Hook to navigate to different pages

    // Calculate the total price of items in the cart
    const totalPrice = cartItems.reduce((total, item) => total + item.price, 0);

    // Handle proceed to checkout action
    const handleProceedToCheckout = () => {
        if (!loggedInUser) {
            alert('You must be logged in to proceed to checkout.');
            return;
        }

        if (cartItems.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        navigate('/checkout'); // Redirect to the checkout page
    };

    // Handle clear cart action with confirmation
    const handleClearCart = () => {
        const confirmed = window.confirm('Are you sure you want to clear your cart?');
        if (confirmed) {
            clearCart();
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
                        <button className="btn btn-primary" onClick={handleProceedToCheckout}>
                            Proceed to Checkout
                        </button>
                        <button className="btn btn-warning" onClick={handleClearCart}>
                            Clear Cart
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;
