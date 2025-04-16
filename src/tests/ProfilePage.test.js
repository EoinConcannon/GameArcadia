import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import ProfilePage from '../components/ProfilePage';
import { supabase } from '../supabase';
import rawgService from '../rawgService';

// Mock the useNavigate hook
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedNavigate,
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
    getGameDetails: jest.fn(),
}));

const mockLoggedInUser = {
    id: 'user-id',
    username: 'testuser',
    email: 'testuser@example.com',
    role: 'user',
    created_at: '2022-01-01T00:00:00Z',
};

const mockInventoryData = [
    { game_id: 'game-id-1' },
    { game_id: 'game-id-2' },
    { game_id: 'game-id-3' },
    { game_id: 'game-id-4' },
    { game_id: 'game-id-5' },
    { game_id: 'game-id-6' },
    { game_id: 'game-id-7' },
    { game_id: 'game-id-8' },
    { game_id: 'game-id-9' },
    { game_id: 'game-id-10' }, // Extra game to test pagination
];

describe('ProfilePage', () => {
    beforeEach(() => {
        // Setup mock implementation for supabase
        supabase.from.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
                data: mockInventoryData,
                error: null,
            }),
        }));

        // Setup mock implementation for rawgService
        rawgService.getGameDetails.mockImplementation((gameId) => {
            return Promise.resolve({
                name: `Game ${gameId.split('-')[2]}`,
                background_image: `test-image-url-${gameId.split('-')[2]}`,
            });
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders login message when no user is logged in', () => {
        render(
            <Router>
                <ProfilePage loggedInUser={null} setLoggedInUser={jest.fn()} />
            </Router>
        );

        expect(screen.getByText('Please log in to view your profile.')).toBeInTheDocument();
    });

    test('renders welcome message and user info link for logged in user', async () => {
        render(
            <Router>
                <ProfilePage loggedInUser={mockLoggedInUser} setLoggedInUser={jest.fn()} />
            </Router>
        );

        await waitFor(() => {
            expect(screen.getByText(`Welcome, ${mockLoggedInUser.username}!`)).toBeInTheDocument();
            const userInfoLink = screen.getByText('View & Edit User Information');
            expect(userInfoLink).toBeInTheDocument();
            expect(userInfoLink.closest('a')).toHaveAttribute('href', '/user-info');
        });
    });

    test('renders inventory section with games', async () => {
        render(
            <Router>
                <ProfilePage loggedInUser={mockLoggedInUser} setLoggedInUser={jest.fn()} />
            </Router>
        );

        await waitFor(() => {
            expect(screen.getByText(`${mockLoggedInUser.username}'s Inventory`)).toBeInTheDocument();
            // Should show first 9 games (pagination)
            expect(screen.getByText('Game 1')).toBeInTheDocument();
            expect(screen.getByText('Game 9')).toBeInTheDocument();
        });
    });

    test('renders order history link section', async () => {
        render(
            <Router>
                <ProfilePage loggedInUser={mockLoggedInUser} setLoggedInUser={jest.fn()} />
            </Router>
        );

        await waitFor(() => {
            expect(screen.getByText('Order History')).toBeInTheDocument();
            const orderHistoryLink = screen.getByText('View Order History');
            expect(orderHistoryLink).toBeInTheDocument();
            expect(orderHistoryLink.closest('a')).toHaveAttribute('href', '/order-history');
        });
    });

    test('handles game click navigation', async () => {
        render(
            <Router>
                <ProfilePage loggedInUser={mockLoggedInUser} setLoggedInUser={jest.fn()} />
            </Router>
        );

        await waitFor(() => {
            expect(screen.getByText('Game 1')).toBeInTheDocument();
        });

        // Click on a game card
        fireEvent.click(screen.getByText('Game 1'));
        expect(mockedNavigate).toHaveBeenCalledWith('/game/game-id-1');
    });

    test('displays pagination controls and handles page changes', async () => {
        render(
            <Router>
                <ProfilePage loggedInUser={mockLoggedInUser} setLoggedInUser={jest.fn()} />
            </Router>
        );

        await waitFor(() => {
            // Check for pagination controls
            expect(screen.getByText('Next')).toBeInTheDocument();
            expect(screen.getByText('1')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument();
        });

        // Test pagination functionality
        fireEvent.click(screen.getByText('2'));

        await waitFor(() => {
            // After clicking page 2, should show game 10
            expect(screen.getByText('Game 10')).toBeInTheDocument();
            // And should not show game 1
            expect(screen.queryByText('Game 1')).not.toBeInTheDocument();
        });

        // Test previous page navigation
        fireEvent.click(screen.getByText('Previous'));

        await waitFor(() => {
            // After clicking Previous, should show game 1 again
            expect(screen.getByText('Game 1')).toBeInTheDocument();
        });
    });

    test('displays loading state when fetching inventory', async () => {
        // Mock a delay in API response
        supabase.from.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockImplementation(() => new Promise(resolve => {
                setTimeout(() => {
                    resolve({
                        data: mockInventoryData,
                        error: null,
                    });
                }, 100);
            })),
        }));

        render(
            <Router>
                <ProfilePage loggedInUser={mockLoggedInUser} setLoggedInUser={jest.fn()} />
            </Router>
        );

        // Should show loading state initially
        expect(screen.getByText('Loading your games...')).toBeInTheDocument();

        // Wait for the inventory to load
        await waitFor(() => {
            expect(screen.queryByText('Loading your games...')).not.toBeInTheDocument();
            expect(screen.getByText('Game 1')).toBeInTheDocument();
        });
    });

    test('displays empty inventory message', async () => {
        // Mock an empty inventory
        supabase.from.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
            }),
        }));

        render(
            <Router>
                <ProfilePage loggedInUser={mockLoggedInUser} setLoggedInUser={jest.fn()} />
            </Router>
        );

        await waitFor(() => {
            expect(screen.getByText('Your inventory is empty.')).toBeInTheDocument();
        });
    });

    test('handles inventory fetch error', async () => {
        // Mock an API error
        supabase.from.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Failed to fetch data' },
            }),
        }));

        render(
            <Router>
                <ProfilePage loggedInUser={mockLoggedInUser} setLoggedInUser={jest.fn()} />
            </Router>
        );

        await waitFor(() => {
            expect(screen.getByText('Failed to fetch inventory')).toBeInTheDocument();
        });
    });
});