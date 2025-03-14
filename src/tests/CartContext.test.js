import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter as Router } from 'react-router-dom';
import { CartProvider, useCart } from '../contexts/CartContext';

// Mock the useNavigate hook
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedNavigate,
}));

const mockLoggedInUser = {
    id: 'user-id',
    username: 'testuser',
    email: 'testuser@example.com',
};

const mockGame = {
    game_id: 'game-id-1',
    name: 'Test Game',
    price: 19.99,
};

const TestComponent = () => {
    const { cartItems, addToCart, removeFromCart, clearCart } = useCart();

    return (
        <div>
            <button onClick={() => addToCart(mockGame)}>Add to Cart</button>
            <button onClick={() => removeFromCart(mockGame.game_id)}>Remove from Cart</button>
            <button onClick={clearCart}>Clear Cart</button>
            <div>
                {cartItems.map((item) => (
                    <div key={item.game_id}>{item.name}</div>
                ))}
            </div>
        </div>
    );
};

describe('CartContext', () => {
    beforeEach(() => {
        jest.spyOn(window, 'alert').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('adds item to cart', () => {
        render(
            <Router>
                <CartProvider loggedInUser={mockLoggedInUser}>
                    <TestComponent />
                </CartProvider>
            </Router>
        );

        const addButton = screen.getByText('Add to Cart');
        fireEvent.click(addButton);

        expect(screen.getByText('Test Game')).toBeInTheDocument();
        expect(window.alert).toHaveBeenCalledWith('Test Game has been added to your cart');
    });

    test('does not add duplicate items to cart', () => {
        render(
            <Router>
                <CartProvider loggedInUser={mockLoggedInUser}>
                    <TestComponent />
                </CartProvider>
            </Router>
        );

        const addButton = screen.getByText('Add to Cart');
        fireEvent.click(addButton);
        fireEvent.click(addButton);

        expect(screen.getAllByText('Test Game').length).toBe(1);
    });

    test('removes item from cart', () => {
        render(
            <Router>
                <CartProvider loggedInUser={mockLoggedInUser}>
                    <TestComponent />
                </CartProvider>
            </Router>
        );

        const addButton = screen.getByText('Add to Cart');
        fireEvent.click(addButton);

        const removeButton = screen.getByText('Remove from Cart');
        fireEvent.click(removeButton);

        expect(screen.queryByText('Test Game')).not.toBeInTheDocument();
    });

    test('clears all items from cart', () => {
        render(
            <Router>
                <CartProvider loggedInUser={mockLoggedInUser}>
                    <TestComponent />
                </CartProvider>
            </Router>
        );

        const addButton = screen.getByText('Add to Cart');
        fireEvent.click(addButton);

        const clearButton = screen.getByText('Clear Cart');
        fireEvent.click(clearButton);

        expect(screen.queryByText('Test Game')).not.toBeInTheDocument();
    });

    test('redirects to login if user is not logged in', () => {
        render(
            <Router>
                <CartProvider loggedInUser={null}>
                    <TestComponent />
                </CartProvider>
            </Router>
        );

        const addButton = screen.getByText('Add to Cart');
        fireEvent.click(addButton);

        expect(mockedNavigate).toHaveBeenCalledWith('/login');
    });
});