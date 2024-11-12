import React from 'react';
import { useCart } from '../contexts/CartContext';

const CartPage = () => {
    const { cartItems, removeFromCart } = useCart();

    const totalPrice = cartItems.reduce((total, item) => total + item.price, 0);

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
                        <h4>Total: €{totalPrice.toFixed(2)}</h4>
                        <button className="btn btn-primary">Proceed to Purchase</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;
