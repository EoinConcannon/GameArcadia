import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import CheckOutPage from '../components/CheckOutPage';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../supabase';
import { useStripe, useElements } from '@stripe/react-stripe-js'; // Add this import

// Mock the modules
jest.mock('../contexts/CartContext', () => ({
    useCart: jest.fn(),
}));

// Mock Stripe components and hooks
jest.mock('@stripe/react-stripe-js', () => ({
    useStripe: jest.fn(),
    useElements: jest.fn(),
    CardElement: function CardElement(props) {
        return <div data-testid="card-element">Card Element</div>;
    },
    Elements: ({ children }) => children
}));

// Mock stripePromise
jest.mock('../stripe', () => ({
    __esModule: true,
    default: 'mock-stripe-promise'
}));

// Create a mock navigate function
const mockNavigate = jest.fn();

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// Create proper Supabase mock
jest.mock('../supabase', () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null });
    const fromMock = jest.fn().mockReturnValue({
        insert: insertMock
    });

    return {
        supabase: {
            from: fromMock
        }
    };
});

// Mock fetch for the payment intent
global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
        json: () => Promise.resolve({ clientSecret: 'test-secret' }),
    })
);

// Mock alert
global.alert = jest.fn();

const mockLoggedInUser = {
    id: 'user-id',
    username: 'testuser',
    email: 'testuser@example.com',
};

const mockCartItems = [
    { game_id: 'game-id-1', name: 'Test Game 1', price: 19.99 },
    { game_id: 'game-id-2', name: 'Test Game 2', price: 29.99 },
];

// Create shared mock instances
const mockConfirmCardPayment = jest.fn();
const mockStripe = { confirmCardPayment: mockConfirmCardPayment };
const mockElements = { getElement: jest.fn().mockReturnValue({}) };

describe('CheckOutPage', () => {
    beforeEach(() => {
        useCart.mockReturnValue({
            cartItems: mockCartItems,
            clearCart: jest.fn(),
        });

        // Always return the same mock instances
        useStripe.mockReturnValue(mockStripe);
        useElements.mockReturnValue(mockElements);

        jest.clearAllMocks();
        mockConfirmCardPayment.mockReset();
    });

    test('renders checkout page with cart items and total price', () => {
        render(
            <Router>
                <CheckOutPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        expect(screen.getByText('Checkout')).toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('€49.98')).toBeInTheDocument();
        expect(screen.getByTestId('card-element')).toBeInTheDocument();
    });

    test('shows alert when trying to purchase with empty cart', async () => {
        useCart.mockReturnValueOnce({
            cartItems: [],
            clearCart: jest.fn(),
        });

        render(
            <Router>
                <CheckOutPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        const confirmButton = screen.getByText('Confirm Purchase');
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(global.alert).toHaveBeenCalledWith('Your cart is empty!');
        });
    });

    test('shows alert when trying to purchase without being logged in', async () => {
        render(
            <Router>
                <CheckOutPage loggedInUser={null} />
            </Router>
        );

        const confirmButton = screen.getByText('Confirm Purchase');
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(global.alert).toHaveBeenCalledWith('You must be logged in to make a purchase.');
        });
    });

    test('handles successful purchase', async () => {
        // Setup successful payment mock
        mockConfirmCardPayment.mockResolvedValue({
            paymentIntent: { status: 'succeeded' }
        });

        render(
            <Router>
                <CheckOutPage loggedInUser={mockLoggedInUser} />
            </Router>
        );
        test('handles case when clientSecret is missing from response', async () => {
            // Override fetch mock to return empty object
            global.fetch.mockImplementationOnce(() =>
                Promise.resolve({
                    json: () => Promise.resolve({}) // No clientSecret
                })
            );

            console.error = jest.fn(); // Mock console.error

            render(
                <Router>
                    <CheckOutPage loggedInUser={mockLoggedInUser} />
                </Router>
            );

            const form = screen.getByTestId('checkout-form');
            fireEvent.submit(form);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    'http://localhost:3001/api/create-payment-intent',
                    expect.objectContaining({
                        method: 'POST',
                        headers: expect.objectContaining({
                            'Content-Type': 'application/json',
                        }),
                    })
                );
            });

            await waitFor(() => {
                expect(console.error).toHaveBeenCalled();
                expect(global.alert).toHaveBeenCalledWith('An unexpected error occurred.');
            });
        });

        test('handles error when adding items to user inventory', async () => {
            // Setup successful payment
            mockConfirmCardPayment.mockResolvedValue({
                paymentIntent: { status: 'succeeded' }
            });

            // Setup error from Supabase
            const supabaseError = { message: 'Database error' };
            jest.spyOn(supabase.from('user_inventory'), 'insert')
                .mockResolvedValueOnce({ error: supabaseError });

            render(
                <Router>
                    <CheckOutPage loggedInUser={mockLoggedInUser} />
                </Router>
            );

            const form = screen.getByTestId('checkout-form');
            fireEvent.submit(form);

            await waitFor(() => {
                expect(mockConfirmCardPayment).toHaveBeenCalled();
            });

            await waitFor(() => {
                expect(supabase.from).toHaveBeenCalledWith('user_inventory');
                expect(global.alert).toHaveBeenCalledWith('There was an error processing your purchase.');
            });
        });

        test('handles network error during fetch request', async () => {
            // Override fetch mock to throw network error
            global.fetch.mockImplementationOnce(() =>
                Promise.reject(new Error('Network error'))
            );

            console.error = jest.fn(); // Mock console.error

            render(
                <Router>
                    <CheckOutPage loggedInUser={mockLoggedInUser} />
                </Router>
            );

            const form = screen.getByTestId('checkout-form');
            fireEvent.submit(form);

            await waitFor(() => {
                expect(console.error).toHaveBeenCalled();
                expect(global.alert).toHaveBeenCalledWith('An unexpected error occurred.');
            });
        });

        test('disables purchase button while processing', async () => {
            // Make the confirmCardPayment take some time
            mockConfirmCardPayment.mockImplementation(() =>
                new Promise(resolve => setTimeout(() =>
                    resolve({ paymentIntent: { status: 'succeeded' } }), 100)
                )
            );

            render(
                <Router>
                    <CheckOutPage loggedInUser={mockLoggedInUser} />
                </Router>
            );

            const form = screen.getByTestId('checkout-form');
            const button = screen.getByText('Confirm Purchase');

            expect(button).not.toBeDisabled();

            fireEvent.submit(form);

            await waitFor(() => {
                expect(button).toHaveTextContent('Processing...');
                expect(button).toBeDisabled();
            });

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('Your purchase was successful!');
            });
        });

        expect(supabase.from).toHaveBeenCalledWith('user_inventory');
        expect(global.alert).toHaveBeenCalledWith('Your purchase was successful!');
        expect(useCart().clearCart).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });

    test('handles payment error', async () => {
        // Setup error response for this specific test
        const errorMessage = 'Payment failed';
        mockConfirmCardPayment.mockResolvedValue({
            error: { message: errorMessage }
        });

        render(
            <Router>
                <CheckOutPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        // Get the form element using the test ID
        const form = screen.getByTestId('checkout-form');

        // Submit the form directly
        fireEvent.submit(form);

        // First wait for the card payment to be called
        await waitFor(() => {
            expect(mockConfirmCardPayment).toHaveBeenCalled();
        });

        // Then wait for error to appear in DOM
        await waitFor(() => {
            const errorElement = screen.getByText(errorMessage);
            expect(errorElement).toBeInTheDocument();
        });
    });
});