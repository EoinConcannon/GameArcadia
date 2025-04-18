import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import FrontPage from '../components/FrontPage';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../supabase';
import rawgService from '../rawgService';
import { BrowserRouter as Router } from 'react-router-dom';

// Mock the useCart hook
jest.mock('../contexts/CartContext', () => ({
    useCart: jest.fn(),
}));

// Mock the supabase client
jest.mock('../supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(),
        })),
    },
}));

// Mock the rawgService
jest.mock('../rawgService', () => ({
    getGames: jest.fn(),
    getPopularGames: jest.fn(),
    searchGames: jest.fn(),
    getGameDetails: jest.fn(),
}));

const mockLoggedInUser = {
    id: 'user-id',
    username: 'testuser',
    email: 'testuser@example.com',
};

const mockGame = {
    id: 'game-id',
    name: 'Test Game',
    description_raw: 'This is a test game.',
    rating: 4.5,
    background_image: 'test-image-url',
};

const mockInventory = [{ game_id: 'game-id' }];

describe('FrontPage', () => {
    beforeEach(() => {
        useCart.mockReturnValue({
            cartItems: [],
            addToCart: jest.fn(),
        });

        supabase.from.mockImplementation((table) => {
            if (table === 'games') {
                return {
                    select: jest.fn().mockResolvedValue({ data: [mockGame], error: null }),
                };
            }
            if (table === 'user_inventory') {
                return {
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({ data: mockInventory, error: null }),
                    }),
                };
            }
            return { select: jest.fn() };
        });

        rawgService.getGames.mockResolvedValue([mockGame]);
        rawgService.getPopularGames.mockResolvedValue([mockGame]);
        rawgService.searchGames.mockResolvedValue([mockGame]);
        rawgService.getGameDetails.mockResolvedValue({
            id: 'game-id',
            genres: [{ name: 'Action' }, { name: 'Adventure' }],
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders FrontPage and displays a random game', async () => {
        await act(async () => {
            render(
                <Router>
                    <FrontPage loggedInUser={mockLoggedInUser} />
                </Router>
            );
        });

        await waitFor(() => {
            expect(screen.getByText('Welcome to GameArcadia')).toBeInTheDocument();
            expect(screen.getByText('Featured Game')).toBeInTheDocument();
        });

        const featuredGame = screen.getAllByText('Test Game');
        expect(featuredGame.length).toBeGreaterThan(0);
    });

    test('displays "Owned" button if the game is owned by the user', async () => {
        await act(async () => {
            render(
                <Router>
                    <FrontPage loggedInUser={mockLoggedInUser} />
                </Router>
            );
        });

        await waitFor(() => {
            const ownedButtons = screen.getAllByText('Owned');
            expect(ownedButtons[0]).toBeInTheDocument();
            expect(ownedButtons[0]).toBeDisabled();
        });
    });

    test('displays "Add to Cart" button if the game is not owned by the user', async () => {
        supabase.from.mockImplementation((table) => {
            if (table === 'user_inventory') {
                return {
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                };
            }
            return { select: jest.fn() };
        });

        await act(async () => {
            render(
                <Router>
                    <FrontPage loggedInUser={mockLoggedInUser} />
                </Router>
            );
        });

        await waitFor(() => {
            const addToCartButtons = screen.getAllByText('Add to Cart');
            expect(addToCartButtons[0]).toBeInTheDocument();
            expect(addToCartButtons[0]).toBeEnabled();
        });
    });

    test('displays loading indicator while fetching top games', async () => {
        rawgService.getPopularGames.mockImplementation(() => new Promise(() => { })); // Simulate loading state

        await act(async () => {
            render(
                <Router>
                    <FrontPage loggedInUser={mockLoggedInUser} />
                </Router>
            );
        });

        expect(screen.getByText('Loading top games...')).toBeInTheDocument();
    });

    test('displays empty state when no recommended games are available', async () => {
        rawgService.getGames.mockResolvedValue([]);

        await act(async () => {
            render(
                <Router>
                    <FrontPage loggedInUser={mockLoggedInUser} />
                </Router>
            );
        });

        await waitFor(() => {
            expect(
                screen.getByText('No recommendations available at the moment. Try adding more games to your library!')
            ).toBeInTheDocument();
        });
    });

    test('filters games based on search query', async () => {
        await act(async () => {
            render(
                <Router>
                    <FrontPage loggedInUser={mockLoggedInUser} />
                </Router>
            );
        });

        const searchInput = screen.getByPlaceholderText('Search for a game...');
        fireEvent.change(searchInput, { target: { value: 'Test Game' } });

        await waitFor(() => {
            const searchResults = screen.getAllByText('Test Game');
            expect(searchResults.length).toBeGreaterThan(0); // Ensure at least one result is displayed
        });
    });

    test('navigates to game details page when search result is clicked', async () => {
        const mockNavigate = jest.fn();
        jest.mock('react-router-dom', () => ({
            ...jest.requireActual('react-router-dom'),
            useNavigate: () => mockNavigate,
        }));

        await act(async () => {
            render(
                <Router>
                    <FrontPage loggedInUser={mockLoggedInUser} />
                </Router>
            );
        });

        const searchInput = screen.getByPlaceholderText('Search for a game...');
        fireEvent.change(searchInput, { target: { value: 'Test Game' } });

        await waitFor(() => {
            const searchResults = screen.getAllByText('Test Game');
            fireEvent.click(searchResults[0]); // Click the first search result
        });

        expect(mockNavigate).toHaveBeenCalledWith('/game/game-id');
    });
});