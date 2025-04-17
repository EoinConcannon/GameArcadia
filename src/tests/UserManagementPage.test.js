import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import UserManagementPage from '../components/UserManagementPage';
import AdminRoute from '../components/AdminRoute';
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
    },
}));

const mockLoggedInUser = {
    id: 'user-id',
    username: 'testuser',
    email: 'testuser@example.com',
    role: 'admin',
};

const mockUsers = [
    { username: 'user1', email: 'user1@example.com', role: 'user' },
    { username: 'admin1', email: 'admin1@example.com', role: 'admin' },
];

describe('UserManagementPage', () => {
    beforeEach(() => {
        supabase.from.mockImplementation((table) => {
            if (table === 'users') {
                return {
                    select: jest.fn().mockResolvedValue({ data: mockUsers, error: null }),
                };
            }
            return { select: jest.fn() };
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders user management page with list of users', async () => {
        let container;
        await act(async () => {
            const result = render(
                <Router>
                    <UserManagementPage loggedInUser={mockLoggedInUser} />
                </Router>
            );
            container = result.container;
        });

        await waitFor(() => {
            expect(screen.getByText('List of Users')).toBeInTheDocument();
            expect(screen.getByText('user1')).toBeInTheDocument();

            // Check that the entire container's text content includes our expected strings
            expect(container.textContent).toContain('user1@example.com');
            expect(container.textContent).toContain('admin1@example.com');

            expect(screen.getByText('(Admin)')).toBeInTheDocument();
        });
    });

    test('renders no users found message when there are no users', async () => {
        supabase.from.mockReturnValueOnce({
            select: jest.fn().mockResolvedValue({ data: [], error: null }),
        });

        await act(async () => {
            render(
                <Router>
                    <UserManagementPage loggedInUser={mockLoggedInUser} />
                </Router>
            );
        });

        await waitFor(() => {
            expect(screen.getByText('No users found.')).toBeInTheDocument();
        });
    });

    test('renders error message when there is an error fetching users', async () => {
        supabase.from.mockReturnValueOnce({
            select: jest.fn().mockResolvedValue({ data: null, error: { message: 'Error fetching users' } }),
        });

        await act(async () => {
            render(
                <Router>
                    <UserManagementPage loggedInUser={mockLoggedInUser} />
                </Router>
            );
        });

        await waitFor(() => {
            expect(screen.getByText('Failed to fetch data')).toBeInTheDocument();
        });
    });

    test('navigates back to admin page when "Back to Admin Page" button is clicked', () => {
        render(
            <Router>
                <UserManagementPage loggedInUser={mockLoggedInUser} />
            </Router>
        );

        const backButton = screen.getByText('Back to Admin Page');
        fireEvent.click(backButton);

        expect(mockedNavigate).toHaveBeenCalledWith('/admin');
    });

    test('restricts access for non-admin users via AdminRoute', () => {
        render(
            <Router>
                <AdminRoute loggedInUser={{ ...mockLoggedInUser, role: 'user' }}>
                    <UserManagementPage loggedInUser={{ ...mockLoggedInUser, role: 'user' }} />
                </AdminRoute>
            </Router>
        );

        expect(screen.queryByText('List of Users')).not.toBeInTheDocument();
        expect(screen.getByText('You are not authorized to view this page.')).toBeInTheDocument();
    });

    test('restricts access when no user is logged in via AdminRoute', () => {
        render(
            <Router>
                <AdminRoute loggedInUser={null}>
                    <UserManagementPage loggedInUser={null} />
                </AdminRoute>
            </Router>
        );

        expect(screen.queryByText('List of Users')).not.toBeInTheDocument();
        expect(screen.getByText('You are not authorized to view this page.')).toBeInTheDocument();
    });
});