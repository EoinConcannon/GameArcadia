import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import SignUpPage from '../components/SignUpPage';
import { supabase } from '../supabase';

// Mock the supabase client
jest.mock('../supabase', () => ({
    supabase: {
        from: jest.fn(),
        select: jest.fn(),
        or: jest.fn(),
        insert: jest.fn()
    }
}));

// Mock useNavigate
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => jest.fn()
}));

describe('SignUpPage', () => {
    // Reset all mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders the sign-up form', () => {
        render(
            <Router>
                <SignUpPage setLoggedInUser={() => { }} />
            </Router>
        );

        expect(screen.getByLabelText(/Enter a username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Enter your email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Enter a password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Confirm password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
    });

    test('shows error when fields are empty', async () => {
        render(
            <Router>
                <SignUpPage setLoggedInUser={() => { }} />
            </Router>
        );

        fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

        expect(await screen.findByText(/Username is required/i)).toBeInTheDocument();
        expect(await screen.findByText(/Email is required/i)).toBeInTheDocument();
        expect(await screen.findByText(/Password is required/i)).toBeInTheDocument();
    });

    test('shows error for invalid email format', async () => {
        render(
            <Router>
                <SignUpPage setLoggedInUser={() => { }} />
            </Router>
        );

        fireEvent.change(screen.getByLabelText(/Enter your email/i), { target: { value: 'invalid-email' } });
        fireEvent.change(screen.getByLabelText(/Enter a username/i), { target: { value: 'testuser' } });
        fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

        expect(await screen.findByText(/Please enter a valid email format/i)).toBeInTheDocument();
    });

    test('shows error when passwords do not match', async () => {
        render(
            <Router>
                <SignUpPage setLoggedInUser={() => { }} />
            </Router>
        );

        fireEvent.change(screen.getByLabelText(/Enter a username/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/Enter your email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/Enter a password/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/Confirm password/i), { target: { value: 'password321' } });

        fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

        expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
    });

    test('shows error when email is already in use', async () => {
        // Setup the mock for checking existing users
        const mockExistingUsers = [{ email: 'test@example.com' }];
        supabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
                or: jest.fn().mockResolvedValue({
                    data: mockExistingUsers,
                    error: null
                })
            })
        });

        render(
            <Router>
                <SignUpPage setLoggedInUser={() => { }} />
            </Router>
        );

        fireEvent.change(screen.getByLabelText(/Enter a username/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/Enter your email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/Enter a password/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/Confirm password/i), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

        await waitFor(() => {
            expect(screen.getByText(/Email already in use/i)).toBeInTheDocument();
        });
    });

    test('shows error when username is already taken', async () => {
        // Setup the mock for checking existing users
        const mockExistingUsers = [{ username: 'testuser' }];
        supabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
                or: jest.fn().mockResolvedValue({
                    data: mockExistingUsers,
                    error: null
                })
            })
        });

        render(
            <Router>
                <SignUpPage setLoggedInUser={() => { }} />
            </Router>
        );

        fireEvent.change(screen.getByLabelText(/Enter a username/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/Enter your email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/Enter a password/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/Confirm password/i), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

        await waitFor(() => {
            expect(screen.getByText(/Username already taken/i)).toBeInTheDocument();
        });
    });

    test('toggles password visibility', () => {
        render(
            <Router>
                <SignUpPage setLoggedInUser={() => { }} />
            </Router>
        );

        const passwordInput = screen.getByLabelText(/Enter a password/i);
        // Use more specific selector to get the first toggle button
        const toggleButtons = screen.getAllByLabelText(/Show password/i);
        const toggleButton = toggleButtons[0]; // Use the first one (for password field)

        // Initially, the password should be hidden
        expect(passwordInput).toHaveAttribute('type', 'password');

        // Click to show the password
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');

        // Click again to hide the password
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('handles unexpected errors gracefully', async () => {
        // Setup the mock to throw an error
        supabase.from.mockImplementation(() => {
            throw new Error('Network error');
        });

        render(
            <Router>
                <SignUpPage setLoggedInUser={() => { }} />
            </Router>
        );

        fireEvent.change(screen.getByLabelText(/Enter a username/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/Enter your email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/Enter a password/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/Confirm password/i), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

        await waitFor(() => {
            expect(screen.getByText(/An unexpected error occurred. Please try again./i)).toBeInTheDocument();
        });
    });

    test('creates account successfully', async () => {
        // Mock checking for existing users - no users found
        supabase.from.mockImplementationOnce(() => ({
            select: jest.fn().mockReturnValue({
                or: jest.fn().mockResolvedValue({
                    data: [],
                    error: null
                })
            })
        }));

        // Mock successful user creation
        const mockNewUser = { id: 1, username: 'testuser', email: 'test@example.com', role: 'user' };
        supabase.from.mockImplementationOnce(() => ({
            insert: jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({
                    data: [mockNewUser],
                    error: null
                })
            })
        }));

        const setLoggedInUserMock = jest.fn();

        render(
            <Router>
                <SignUpPage setLoggedInUser={setLoggedInUserMock} />
            </Router>
        );

        fireEvent.change(screen.getByLabelText(/Enter a username/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/Enter your email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/Enter a password/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/Confirm password/i), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

        // verify that setLoggedInUser was called with the correct data
        await waitFor(() => {
            expect(setLoggedInUserMock).toHaveBeenCalledWith(expect.objectContaining({
                username: 'testuser',
                email: 'test@example.com'
            }));
        });
    });
});