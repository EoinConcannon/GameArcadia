import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import CartPage from '../components/CartPage';
import { useCart } from '../contexts/CartContext';

// Mock the CSS import
jest.mock('../styles/CartPage.css', () => ({}), { virtual: true });

// Mock the hooks
jest.mock('../contexts/CartContext', () => ({
    useCart: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn(),
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
    let mockClearCart;
    let mockRemoveFromCart;
    let mockNavigate;

    beforeEach(() => {
        // Setup mocks before each test
        mockClearCart = jest.fn();
        mockRemoveFromCart = jest.fn();
        mockNavigate = jest.fn();

        useCart.mockReturnValue({
            cartItems: mockCartItems,
            removeFromCart: mockRemoveFromCart,
            clearCart: mockClearCart,
        });

        useNavigate.mockReturnValue(mockNavigate);

        // Mock window.confirm and window.alert
        window.confirm = jest.fn(() => true);
        window.alert = jest.fn();
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
        render(
            <Router>
                <CartPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        const removeButtons = screen.getAllByText('Remove');
        fireEvent.click(removeButtons[0]);

        expect(mockRemoveFromCart).toHaveBeenCalledWith('game-id-1');
    });

    test('calls clearCart when "Clear Cart" button is clicked', () => {
        render(
            <Router>
                <CartPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        const clearCartButton = screen.getByText('Clear Cart');
        fireEvent.click(clearCartButton);

        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to clear your cart?');
        expect(mockClearCart).toHaveBeenCalled();
    });

    test('navigates to checkout when "Proceed to Checkout" button is clicked', () => {
        render(
            <Router>
                <CartPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        const checkoutButton = screen.getByText('Proceed to Checkout');
        fireEvent.click(checkoutButton);

        expect(mockNavigate).toHaveBeenCalledWith('/checkout');
    });

    test('shows alert when trying to proceed to checkout with empty cart', () => {
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

        const checkoutButton = screen.getByText('Proceed to Checkout');
        fireEvent.click(checkoutButton);

        expect(window.alert).toHaveBeenCalledWith('Your cart is empty!');
    });

    test('shows alert when trying to proceed to checkout without being logged in', () => {
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