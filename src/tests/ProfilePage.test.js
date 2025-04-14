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
        delete: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
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

const mockInventory = [
    { game_id: 'game-id-1' },
    { game_id: 'game-id-2' },
];

const mockOrderHistory = [
    { game_id: 'game-id-1', purchased_at: '2022-01-01T00:00:00Z' },
    { game_id: 'game-id-2', purchased_at: '2022-01-02T00:00:00Z' },
];

const mockGameDetails = {
    game_id: 'game-id-1',
    name: 'Test Game 1',
    background_image: 'test-image-url-1',
};

describe('ProfilePage', () => {
    beforeEach(() => {
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

        rawgService.getGameDetails.mockResolvedValue(mockGameDetails);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders profile page with user information', async () => {
        render(
            <Router>
                <ProfilePage loggedInUser={mockLoggedInUser} setLoggedInUser={jest.fn()} />
            </Router>
        );

        await waitFor(() => {
            expect(screen.getByText('User Information')).toBeInTheDocument();
            expect(screen.getByText(mockLoggedInUser.username)).toBeInTheDocument();
            expect(screen.getByText(`Email: ${mockLoggedInUser.email}`)).toBeInTheDocument();
            expect(screen.getByText('Password: ********')).toBeInTheDocument();
            expect(screen.getByText(`Role: ${mockLoggedInUser.role}`)).toBeInTheDocument();
            expect(screen.getByText(`Joined: ${new Date(mockLoggedInUser.created_at).toLocaleString()}`)).toBeInTheDocument();
        });
    });

    test('renders inventory and order history', async () => {
        supabase.from.mockImplementation((table) => {
            if (table === 'user_inventory') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockResolvedValueOnce({
                        data: mockInventory,
                        error: null,
                    }).mockResolvedValueOnce({
                        data: mockOrderHistory,
                        error: null,
                    }),
                };
            }
            return { select: jest.fn() };
        });

        render(
            <Router>
                <ProfilePage loggedInUser={mockLoggedInUser} setLoggedInUser={jest.fn()} />
            </Router>
        );

        await waitFor(() => {
            expect(screen.getByText('Test Game 1')).toBeInTheDocument();
            expect(screen.getByText('Order History')).toBeInTheDocument();
            expect(screen.getByText('Test Game 1: 1/1/2022, 12:00:00 AM')).toBeInTheDocument();
            expect(screen.getByText('Test Game 2: 1/2/2022, 12:00:00 AM')).toBeInTheDocument();
        });
    });

    test('handles account deletion', async () => {
        supabase.from.mockReturnValueOnce({
            delete: jest.fn().mockResolvedValue({ error: null }),
        });

        window.confirm = jest.fn().mockReturnValue(true);
        const mockSetLoggedInUser = jest.fn();

        render(
            <Router>
                <ProfilePage loggedInUser={mockLoggedInUser} setLoggedInUser={mockSetLoggedInUser} />
            </Router>
        );

        const deleteButton = screen.getByText('Delete Account');
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete your account? This action cannot be undone.');
            expect(mockSetLoggedInUser).toHaveBeenCalledWith(null);
            expect(mockedNavigate).toHaveBeenCalledWith('/');
        });
    });

    test('handles user information update', async () => {
        supabase.from.mockReturnValueOnce({
            update: jest.fn().mockResolvedValue({
                data: [{ ...mockLoggedInUser, username: 'updateduser', email: 'updated@example.com' }],
                error: null,
            }),
        });

        const mockSetLoggedInUser = jest.fn();

        render(
            <Router>
                <ProfilePage loggedInUser={mockLoggedInUser} setLoggedInUser={mockSetLoggedInUser} />
            </Router>
        );

        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);

        const usernameInput = screen.getByLabelText('Username');
        const emailInput = screen.getByLabelText('Email');
        const saveButton = screen.getByText('Save');

        fireEvent.change(usernameInput, { target: { value: 'updateduser' } });
        fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockSetLoggedInUser).toHaveBeenCalledWith({
                ...mockLoggedInUser,
                username: 'updateduser',
                email: 'updated@example.com',
            });
            expect(localStorage.setItem).toHaveBeenCalledWith('loggedInUser', JSON.stringify({
                ...mockLoggedInUser,
                username: 'updateduser',
                email: 'updated@example.com',
            }));
        });
    });
});