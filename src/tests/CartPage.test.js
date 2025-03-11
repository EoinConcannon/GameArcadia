import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter as Router } from 'react-router-dom';
import CartPage from '../components/CartPage';
import { useCart } from '../contexts/CartContext';

// Mock the useCart hook
jest.mock('../contexts/CartContext', () => ({
    useCart: jest.fn(),
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

describe('CartPage', () => {
    beforeEach(() => {
        useCart.mockReturnValue({
            cartItems: mockCartItems,
            removeFromCart: jest.fn(),
            clearCart: jest.fn(),
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders empty cart message when cart is empty', () => {
        useCart.mockReturnValueOnce({
            cartItems: [],
            removeFromCart: jest.fn(),
            clearCart: jest.fn(),
        });

        render(
            <Router>
                <CartPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });

    test('renders cart items and total price', () => {
        render(
            <Router>
                <CartPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        expect(screen.getByText('Test Game 1')).toBeInTheDocument();
        expect(screen.getByText('€19.99')).toBeInTheDocument();
        expect(screen.getByText('Test Game 2')).toBeInTheDocument();
        expect(screen.getByText('€29.99')).toBeInTheDocument();
        expect(screen.getByText('Total: €49.98')).toBeInTheDocument();
    });

    test('calls removeFromCart when "Remove" button is clicked', () => {
        const { removeFromCart } = useCart();

        render(
            <Router>
                <CartPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        const removeButtons = screen.getAllByText('Remove');
        fireEvent.click(removeButtons[0]);

        expect(removeFromCart).toHaveBeenCalledWith('game-id-1');
    });

    test('calls clearCart when "Clear Cart" button is clicked', () => {
        const { clearCart } = useCart();

        render(
            <Router>
                <CartPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        const clearCartButton = screen.getByText('Clear Cart');
        fireEvent.click(clearCartButton);

        expect(clearCart).toHaveBeenCalled();
    });

    test('navigates to checkout when "Proceed to Checkout" button is clicked', () => {
        const mockedNavigate = jest.fn();
        jest.mock('react-router-dom', () => ({
            ...jest.requireActual('react-router-dom'),
            useNavigate: () => mockedNavigate,
        }));

        render(
            <Router>
                <CartPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        const checkoutButton = screen.getByText('Proceed to Checkout');
        fireEvent.click(checkoutButton);

        expect(mockedNavigate).toHaveBeenCalledWith('/checkout');
    });

    test('shows alert when trying to proceed to checkout with empty cart', () => {
        useCart.mockReturnValueOnce({
            cartItems: [],
            removeFromCart: jest.fn(),
            clearCart: jest.fn(),
        });

        window.alert = jest.fn();

        render(
            <Router>
                <CartPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        const checkoutButton = screen.getByText('Proceed to Checkout');
        fireEvent.click(checkoutButton);

        expect(window.alert).toHaveBeenCalledWith('Your cart is empty!');
    });

    test('shows alert when trying to proceed to checkout without being logged in', () => {
        window.alert = jest.fn();

        render(
            <Router>
                <CartPage loggedInUser={null} />
            </Router>
        );

        const checkoutButton = screen.getByText('Proceed to Checkout');
        fireEvent.click(checkoutButton);

        expect(window.alert).toHaveBeenCalledWith('You must be logged in to proceed to checkout.');
    });
});