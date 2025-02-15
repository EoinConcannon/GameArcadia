import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import FrontPage from '../components/FrontPage';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../supabase';

// Mock the useCart hook
jest.mock('../contexts/CartContext', () => ({
    useCart: jest.fn(),
}));

// Mock the supabase client
jest.mock('../supabase', () => ({
    supabase: {
        from: jest.fn(),
    },
}));

const mockLoggedInUser = {
    id: 'user-id',
    username: 'testuser',
    email: 'testuser@example.com',
};

const mockGame = {
    id: 'game-id',
    name: 'Test Game',
    description: 'This is a test game.',
    price: 10,
    image_url: 'test-image-url',
};

const mockInventory = [{ game_id: 'game-id' }];

describe('FrontPage', () => {
    beforeEach(() => {
        useCart.mockReturnValue({
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
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders FrontPage and displays a random game', async () => {
        render(<FrontPage loggedInUser={mockLoggedInUser} />);

        await waitFor(() => {
            expect(screen.getByText('Welcome to GameArcadia')).toBeInTheDocument();
            expect(screen.getByText('Featured Game')).toBeInTheDocument();
            expect(screen.getByText(mockGame.name)).toBeInTheDocument();
            expect(screen.getByText(mockGame.description)).toBeInTheDocument();
            expect(screen.getByText(`€${mockGame.price}`)).toBeInTheDocument();
        });
    });

    test('displays "Owned" button if the game is owned by the user', async () => {
        render(<FrontPage loggedInUser={mockLoggedInUser} />);

        await waitFor(() => {
            expect(screen.getByText('Owned')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Owned' })).toBeDisabled();
        });
    });

    test('displays "Add to Cart" button if the game is not owned by the user', async () => {
        supabase.from.mockImplementation((table) => {
            if (table === 'games') {
                return {
                    select: jest.fn().mockResolvedValue({ data: [mockGame], error: null }),
                };
            }
            if (table === 'user_inventory') {
                return {
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                };
            }
            return { select: jest.fn() };
        });

        render(<FrontPage loggedInUser={mockLoggedInUser} />);

        await waitFor(() => {
            expect(screen.getByText('Add to Cart')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeEnabled();
        });
    });
});