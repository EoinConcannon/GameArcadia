import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import LoginPage from '../components/LoginPage';
import { supabase } from '../supabase';
import bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
    genSalt: jest.fn().mockResolvedValue('fake-salt'),
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn().mockResolvedValue(true),
}));

// Mock the useNavigate hook
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedNavigate,
    useLocation: () => ({
        state: { message: 'Account created successfully!' },
    }),
}));

// Mock the supabase client
jest.mock('../supabase', () => ({
    supabase: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
    },
}));

const mockSetLoggedInUser = jest.fn();

describe('LoginPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Properly mock localStorage with Jest mock functions
        Object.defineProperty(window, 'localStorage', {
            value: {
                setItem: jest.fn(),
                getItem: jest.fn(),
                removeItem: jest.fn(),
                clear: jest.fn(),
            },
            writable: true
        });
    });

    test('renders login page with username and password fields', () => {
        render(
            <Router>
                <LoginPage setLoggedInUser={mockSetLoggedInUser} />
            </Router>
        );

        expect(screen.getByLabelText('Username')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
    });

    test('displays success message from sign-up page', () => {
        render(
            <Router>
                <LoginPage setLoggedInUser={mockSetLoggedInUser} />
            </Router>
        );

        expect(screen.getByText('Account created successfully!')).toBeInTheDocument();
    });

    test('shows error message when fields are empty', async () => {
        render(
            <Router>
                <LoginPage setLoggedInUser={mockSetLoggedInUser} />
            </Router>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Login' }));

        await waitFor(() => {
            expect(screen.getByText('Please enter both username and password')).toBeInTheDocument();
        });
    });

    test('shows error message for invalid username or password', async () => {
        supabase.from.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
            }),
        });

        render(
            <Router>
                <LoginPage setLoggedInUser={mockSetLoggedInUser} />
            </Router>
        );

        fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'invaliduser' } });
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpassword' } });
        fireEvent.click(screen.getByRole('button', { name: 'Login' }));

        await waitFor(() => {
            expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
        });
    });

    test('logs in successfully with valid credentials', async () => {
        const mockUser = {
            id: 'user-id',
            username: 'testuser',
            password: 'password123',
            email: 'testuser@example.com'
        };

        supabase.from.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
                data: [mockUser],
                error: null,
            }),
        });

        // For password update
        supabase.from.mockReturnValueOnce({
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
            }),
        });

        render(
            <Router>
                <LoginPage setLoggedInUser={mockSetLoggedInUser} />
            </Router>
        );

        fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: 'Login' }));

        await waitFor(() => {
            expect(mockSetLoggedInUser).toHaveBeenCalledWith({
                id: 'user-id',
                username: 'testuser',
                email: 'testuser@example.com',
            });

            expect(window.localStorage.setItem).toHaveBeenCalledWith(
                'loggedInUser',
                JSON.stringify({
                    id: 'user-id',
                    username: 'testuser',
                    email: 'testuser@example.com',
                })
            );

            expect(mockedNavigate).toHaveBeenCalledWith('/');
        });
    });

    test('navigates to sign up page when "Sign Up" button is clicked', () => {
        render(
            <Router>
                <LoginPage setLoggedInUser={mockSetLoggedInUser} />
            </Router>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

        expect(mockedNavigate).toHaveBeenCalledWith('/signup');
    });

    test('toggles password visibility', () => {
        render(
            <Router>
                <LoginPage setLoggedInUser={mockSetLoggedInUser} />
            </Router>
        );

        const passwordInput = screen.getByLabelText('Password');
        const toggleButton = screen.getByLabelText('Show password');

        // Initially, the password should be hidden
        expect(passwordInput).toHaveAttribute('type', 'password');

        // Click to show the password
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');

        // Click again to hide the password
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('handles Supabase errors gracefully', async () => {
        supabase.from.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockRejectedValue(new Error('Network error')),
        });

        render(
            <Router>
                <LoginPage setLoggedInUser={mockSetLoggedInUser} />
            </Router>
        );

        fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: 'Login' }));

        await waitFor(() => {
            expect(screen.getByText('An error occurred during login. Please try again.')).toBeInTheDocument();
        });
    });
});