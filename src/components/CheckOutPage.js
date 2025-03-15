import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import stripePromise from '../stripe';
import '../styles/CheckOutPage.css';

const CheckoutForm = ({ loggedInUser, cartItems, clearCart }) => {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handlePurchase = async (event) => {
        event.preventDefault();

        if (!loggedInUser) {
            alert('You must be logged in to make a purchase.');
            return;
        }

        if (cartItems.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        setProcessing(true);

        try {
            const response = await fetch('http://localhost:3001/api/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ items: cartItems }),
            });

            const { clientSecret } = await response.json();

            if (!clientSecret) {
                throw new Error('Missing client secret');
            }

            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: {
                        email: loggedInUser.email,
                    },
                },
            });

            if (result.error) {
                setError(result.error.message);
                setProcessing(false);
                return;
            }

            if (result.paymentIntent.status === 'succeeded') {
                const inventoryItems = cartItems.map((item) => ({
                    user_id: loggedInUser.id,
                    game_id: item.game_id,
                    purchased_at: new Date(),
                }));

                const { error } = await supabase.from('user_inventory').insert(inventoryItems);

                if (error) {
                    console.error('Error adding items to user_inventory:', error);
                    alert('There was an error processing your purchase.');
                    setProcessing(false);
                    return;
                }

                alert('Your purchase was successful!');
                clearCart();
                navigate('/');
            }
        } catch (err) {
            console.error('Unexpected error during purchase:', err);
            alert('An unexpected error occurred.');
        }

        setProcessing(false);
    };

    return (
        <div className="checkout-card">
            <h3 className="mb-3">Payment Details</h3>
            <form onSubmit={handlePurchase}>
                <div className="mb-3">
                    <CardElement
                        options={{
                            style: {
                                base: {
                                    color: '#333',
                                    fontSize: '16px',
                                    '::placeholder': {
                                        color: '#888',
                                    },
                                },
                                invalid: {
                                    color: '#fa755a',
                                },
                            },
                        }}
                    />
                </div>
                {error && <div className="alert alert-danger mt-2">{error}</div>}
                <button className="btn-confirm" type="submit" disabled={!stripe || processing}>
                    {processing ? 'Processing...' : 'Confirm Purchase'}
                </button>
            </form>
        </div>
    );
};

const CheckOutPage = ({ loggedInUser }) => {
    const { cartItems, clearCart } = useCart();
    const total = cartItems.reduce((total, item) => total + item.price, 0).toFixed(2);

    return (
        <div className="checkout-container">
            <h2 className="text-center mb-5">Checkout</h2>
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="checkout-card">
                        <div className="row">
                            {/* Checkout Summary */}
                            <div className="col-md-4 order-summary">
                                <h4 className="mb-4">Order Summary</h4>
                                <ul className="list-group">
                                    {cartItems.map((item, index) => (
                                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                            {item.name}
                                            <span>€{item.price.toFixed(2)}</span>
                                        </li>
                                    ))}
                                    <li className="list-group-item d-flex justify-content-between fw-bold">
                                        Total
                                        <span>€{total}</span>
                                    </li>
                                </ul>
                            </div>
                            {/* Payment Form */}
                            <div className="col-md-8 payment-section">
                                <Elements stripe={stripePromise}>
                                    <CheckoutForm loggedInUser={loggedInUser} cartItems={cartItems} clearCart={clearCart} />
                                </Elements>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckOutPage;
