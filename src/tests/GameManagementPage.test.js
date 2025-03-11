import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter as Router } from 'react-router-dom';
import GameManagementPage from '../components/GameManagementPage';
import { supabase } from '../supabase';

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
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
    },
}));

const mockLoggedInUser = {
    id: 'user-id',
    username: 'testuser',
    email: 'testuser@example.com',
    role: 'admin',
};

const mockGames = [
    { id: 'game-id-1', name: 'Test Game 1', description: 'Description 1', price: 19.99 },
    { id: 'game-id-2', name: 'Test Game 2', description: 'Description 2', price: 29.99 },
];

describe('GameManagementPage', () => {
    beforeEach(() => {
        supabase.from.mockImplementation((table) => {
            if (table === 'games') {
                return {
                    select: jest.fn().mockResolvedValue({ data: mockGames, error: null }),
                };
            }
            return { select: jest.fn() };
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders game management page with list of games', async () => {
        render(
            <Router>
                <GameManagementPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        await waitFor(() => {
            expect(screen.getByText('List of Games')).toBeInTheDocument();
            expect(screen.getByText('Test Game 1')).toBeInTheDocument();
            expect(screen.getByText('Test Game 2')).toBeInTheDocument();
        });
    });

    test('renders add game form and handles input changes', () => {
        render(
            <Router>
                <GameManagementPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        expect(screen.getByText('Add New Game')).toBeInTheDocument();

        const nameInput = screen.getByLabelText('Game Name');
        const descriptionInput = screen.getByLabelText('Description');
        const priceInput = screen.getByLabelText('Price (€)');

        fireEvent.change(nameInput, { target: { value: 'New Game' } });
        fireEvent.change(descriptionInput, { target: { value: 'New Description' } });
        fireEvent.change(priceInput, { target: { value: '9.99' } });

        expect(nameInput.value).toBe('New Game');
        expect(descriptionInput.value).toBe('New Description');
        expect(priceInput.value).toBe('9.99');
    });

    test('handles adding a new game', async () => {
        supabase.from.mockReturnValueOnce({
            insert: jest.fn().mockResolvedValue({ data: [{ id: 'game-id-3', name: 'New Game', description: 'New Description', price: 9.99 }], error: null }),
        });

        render(
            <Router>
                <GameManagementPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        const nameInput = screen.getByLabelText('Game Name');
        const descriptionInput = screen.getByLabelText('Description');
        const priceInput = screen.getByLabelText('Price (€)');
        const addButton = screen.getByText('Add Game');

        fireEvent.change(nameInput, { target: { value: 'New Game' } });
        fireEvent.change(descriptionInput, { target: { value: 'New Description' } });
        fireEvent.change(priceInput, { target: { value: '9.99' } });
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(screen.getByText('Game added successfully!')).toBeInTheDocument();
            expect(screen.getByText('New Game')).toBeInTheDocument();
        });
    });

    test('handles editing a game', async () => {
        supabase.from.mockReturnValueOnce({
            update: jest.fn().mockResolvedValue({ data: [{ id: 'game-id-1', name: 'Updated Game', description: 'Updated Description', price: 19.99 }], error: null }),
        });

        render(
            <Router>
                <GameManagementPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        const editButton = screen.getAllByText('Edit')[0];
        fireEvent.click(editButton);

        const nameInput = screen.getByDisplayValue('Test Game 1');
        const descriptionInput = screen.getByDisplayValue('Description 1');
        const priceInput = screen.getByDisplayValue('19.99');
        const saveButton = screen.getByText('Save');

        fireEvent.change(nameInput, { target: { value: 'Updated Game' } });
        fireEvent.change(descriptionInput, { target: { value: 'Updated Description' } });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText('Game updated successfully!')).toBeInTheDocument();
            expect(screen.getByText('Updated Game')).toBeInTheDocument();
        });
    });

    test('handles deleting a game', async () => {
        supabase.from.mockReturnValueOnce({
            delete: jest.fn().mockResolvedValue({ error: null }),
        });

        render(
            <Router>
                <GameManagementPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        const deleteButton = screen.getAllByText('Delete')[0];
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(screen.getByText('Game deleted successfully!')).toBeInTheDocument();
            expect(screen.queryByText('Test Game 1')).not.toBeInTheDocument();
        });
    });

    test('restricts access for non-admin users', () => {
        render(
            <Router>
                <GameManagementPage loggedInUser={{ ...mockLoggedInUser, role: 'user' }} />
            </Router>
        );

        expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
});