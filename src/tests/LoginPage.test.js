import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import LoginPage from '../components/LoginPage';
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
        eq: jest.fn().mockReturnThis(),
    },
}));

const mockSetLoggedInUser = jest.fn();

describe('LoginPage', () => {
    beforeEach(() => {
        supabase.from.mockImplementation((table) => {
            if (table === 'users') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockResolvedValue({
                        data: [{ id: 'user-id', username: 'testuser', password: 'password123', email: 'testuser@example.com' }],
                        error: null,
                    }),
                };
            }
            return { select: jest.fn() };
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
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
                password: 'password123',
                email: 'testuser@example.com',
            });
            expect(localStorage.setItem).toHaveBeenCalledWith('loggedInUser', JSON.stringify({
                id: 'user-id',
                username: 'testuser',
                password: 'password123',
                email: 'testuser@example.com',
            }));
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
});