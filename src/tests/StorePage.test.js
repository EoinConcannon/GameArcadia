import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter as Router } from 'react-router-dom';
import StorePage from '../components/StorePage';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../supabase';
import rawgService from '../rawgService';

// Mock the useCart hook
jest.mock('../contexts/CartContext', () => ({
    useCart: jest.fn(),
}));

// Mock the supabase client
jest.mock('../supabase', () => ({
    supabase: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
    },
}));

// Mock the rawgService
jest.mock('../rawgService', () => ({
    getGames: jest.fn(),
}));

const mockLoggedInUser = {
    id: 'user-id',
    username: 'testuser',
    email: 'testuser@example.com',
};

const mockGames = [
    { id: 'game-id-1', name: 'Test Game 1', description_raw: 'Description 1', rating: 4.5, background_image: 'test-image-url-1' },
    { id: 'game-id-2', name: 'Test Game 2', description_raw: 'Description 2', rating: 4.0, background_image: 'test-image-url-2' },
];

const mockInventory = [{ game_id: 'game-id-1' }];

describe('StorePage', () => {
    beforeEach(() => {
        useCart.mockReturnValue({
            addToCart: jest.fn(),
        });

        supabase.from.mockImplementation((table) => {
            if (table === 'user_inventory') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockResolvedValue({
                        data: mockInventory,
                        error: null,
                    }),
                };
            }
            return { select: jest.fn() };
        });

        rawgService.getGames.mockResolvedValue(mockGames);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders store page with list of games', async () => {
        render(
            <Router>
                <StorePage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        await waitFor(() => {
            expect(screen.getByText('Store')).toBeInTheDocument();
            expect(screen.getByText('Test Game 1')).toBeInTheDocument();
            expect(screen.getByText('Test Game 2')).toBeInTheDocument();
        });
    });

    test('filters games based on search query', async () => {
        render(
            <Router>
                <StorePage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        await waitFor(() => {
            expect(screen.getByText('Test Game 1')).toBeInTheDocument();
            expect(screen.getByText('Test Game 2')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Search for a game...');
        fireEvent.change(searchInput, { target: { value: 'Test Game 1' } });

        await waitFor(() => {
            expect(screen.getByText('Test Game 1')).toBeInTheDocument();
            expect(screen.queryByText('Test Game 2')).not.toBeInTheDocument();
        });
    });

    test('disables "Add to Cart" button for owned games', async () => {
        render(
            <Router>
                <StorePage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        await waitFor(() => {
            expect(screen.getByText('Test Game 1')).toBeInTheDocument();
            expect(screen.getByText('Owned')).toBeInTheDocument();
            expect(screen.getByText('Test Game 2')).toBeInTheDocument();
            expect(screen.getByText('Add to Cart')).toBeInTheDocument();
        });
    });

    test('calls addToCart when "Add to Cart" button is clicked', async () => {
        const { addToCart } = useCart();

        render(
            <Router>
                <StorePage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        await waitFor(() => {
            expect(screen.getByText('Test Game 2')).toBeInTheDocument();
            expect(screen.getByText('Add to Cart')).toBeInTheDocument();
        });

        const addToCartButton = screen.getByText('Add to Cart');
        fireEvent.click(addToCartButton);

        expect(addToCart).toHaveBeenCalledWith({
            ...mockGames[1],
            price: 19.99,
            game_id: mockGames[1].id,
        });
    });
});