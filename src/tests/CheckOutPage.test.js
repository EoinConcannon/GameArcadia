import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import CheckOutPage from '../components/CheckOutPage';
import { useCart } from '../contexts/CartContext';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

// Mock the useCart hook
jest.mock('../contexts/CartContext', () => ({
    useCart: jest.fn(),
}));

// Mock the useStripe and useElements hooks
jest.mock('@stripe/react-stripe-js', () => ({
    useStripe: jest.fn(),
    useElements: jest.fn(),
    CardElement: jest.fn().mockImplementation(() => <div>Card Element</div>),
}));

const mockLoggedInUser = {
    id: 'user-id',
    username: 'testuser',
    email: 'testuser@example.com',
};

const mockCartItems = [
    { game_id: 'game-id-1', name: 'Test Game 1', price: 19.99 },
    { game_id: 'game-id-2', name: 'Test Game 2', price: 29.99 },
];

describe('CheckOutPage', () => {
    beforeEach(() => {
        useCart.mockReturnValue({
            cartItems: mockCartItems,
            clearCart: jest.fn(),
        });

        useStripe.mockReturnValue({
            confirmCardPayment: jest.fn().mockResolvedValue({ paymentIntent: { status: 'succeeded' } }),
        });

        useElements.mockReturnValue({
            getElement: jest.fn().mockReturnValue({}),
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders checkout page with cart items and total price', () => {
        render(
            <Router>
                <CheckOutPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        expect(screen.getByText('Checkout')).toBeInTheDocument();
        expect(screen.getByText('Total: €49.98')).toBeInTheDocument();
        expect(screen.getByText('Card Element')).toBeInTheDocument();
    });

    test('shows alert when trying to purchase with empty cart', async () => {
        useCart.mockReturnValueOnce({
            cartItems: [],
            clearCart: jest.fn(),
        });

        window.alert = jest.fn();

        render(
            <Router>
                <CheckOutPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        const confirmButton = screen.getByText('Confirm Purchase');
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Your cart is empty!');
        });
    });

    test('shows alert when trying to purchase without being logged in', async () => {
        window.alert = jest.fn();

        render(
            <Router>
                <CheckOutPage loggedInUser={null} />
            </Router>
        );

        const confirmButton = screen.getByText('Confirm Purchase');
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('You must be logged in to make a purchase.');
        });
    });

    test('handles successful purchase', async () => {
        const { clearCart } = useCart();
        const mockNavigate = jest.fn();
        jest.mock('react-router-dom', () => ({
            ...jest.requireActual('react-router-dom'),
            useNavigate: () => mockNavigate,
        }));

        render(
            <Router>
                <CheckOutPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        const confirmButton = screen.getByText('Confirm Purchase');
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(screen.getByText('Processing...')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(clearCart).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/');
            expect(window.alert).toHaveBeenCalledWith('Your purchase was successful!');
        });
    });

    test('handles payment error', async () => {
        useStripe.mockReturnValueOnce({
            confirmCardPayment: jest.fn().mockResolvedValue({ error: { message: 'Payment failed' } }),
        });

        render(
            <Router>
                <CheckOutPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        const confirmButton = screen.getByText('Confirm Purchase');
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(screen.getByText('Payment failed')).toBeInTheDocument();
        });
    });
});