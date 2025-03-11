import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import SignUpPage from '../components/SignUpPage';
import { supabase } from '../supabase';

// Mock the supabase client
jest.mock('../supabase', () => ({
    supabase: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
    },
}));

describe('SignUpPage', () => {
    test('renders the sign-up form', () => {
        render(
            <Router>
                <SignUpPage />
            </Router>
        );

        expect(screen.getByLabelText(/Enter a username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Enter your email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Enter a password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Confirm password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
    });

    test('shows error when passwords do not match', async () => {
        render(
            <Router>
                <SignUpPage />
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
        supabase.from.mockReturnValueOnce({
            select: jest.fn().mockReturnValueOnce({
                eq: jest.fn().mockResolvedValueOnce({
                    data: [{ email: 'test@example.com' }],
                    error: null,
                }),
            }),
        });

        render(
            <Router>
                <SignUpPage />
            </Router>
        );

        fireEvent.change(screen.getByLabelText(/Enter a username/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/Enter your email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/Enter a password/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/Confirm password/i), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

        expect(await screen.findByText(/Email is already in use/i)).toBeInTheDocument();
    });

    test('creates account successfully', async () => {
        supabase.from.mockReturnValueOnce({
            select: jest.fn().mockReturnValueOnce({
                eq: jest.fn().mockResolvedValueOnce({
                    data: [],
                    error: null,
                }),
            }),
        });

        supabase.from.mockReturnValueOnce({
            insert: jest.fn().mockResolvedValueOnce({
                error: null,
            }),
        });

        render(
            <Router>
                <SignUpPage />
            </Router>
        );

        fireEvent.change(screen.getByLabelText(/Enter a username/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/Enter your email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/Enter a password/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/Confirm password/i), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

        expect(await screen.findByText(/Creating Account.../i)).toBeInTheDocument();
    });
});