import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import stripePromise from '../stripe';

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
            // Create a payment intent using the server
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

            // Confirm the payment with Stripe
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
                // Prepare the records for insertion
                const inventoryItems = cartItems.map((item) => ({
                    user_id: loggedInUser.id,
                    game_id: item.game_id,
                    purchased_at: new Date(),
                }));

                // Insert records into the `user_inventory` table
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
        <form onSubmit={handlePurchase}>
            <CardElement
                options={{
                    style: {
                        base: {
                            color: '#ffffff', // Set the text color to white
                            '::placeholder': {
                                color: '#aab7c4', // Set the placeholder color
                            },
                        },
                        invalid: {
                            color: '#fa755a', // Set the text color for invalid input
                        },
                    },
                }}
            />
            {error && <div className="text-danger mt-2">{error}</div>}
            <button className="btn btn-primary mt-4" type="submit" disabled={!stripe || processing}>
                {processing ? 'Processing...' : 'Confirm Purchase'}
            </button>
        </form>
    );
};

const CheckOutPage = ({ loggedInUser }) => {
    const { cartItems, clearCart } = useCart();

    return (
        <div className="checkout-page container my-5">
            <h2 className="text-center mb-4">Checkout</h2>
            <div className="d-flex justify-content-between mt-4">
                <h4>Total: €{cartItems.reduce((total, item) => total + item.price, 0).toFixed(2)}</h4>
            </div>
            <Elements stripe={stripePromise}>
                <CheckoutForm loggedInUser={loggedInUser} cartItems={cartItems} clearCart={clearCart} />
            </Elements>
        </div>
    );
};

export default CheckOutPage;
