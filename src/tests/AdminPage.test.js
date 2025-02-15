import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter } from 'react-router-dom';
import AdminPage from '../components/AdminPage';

// Mock useNavigate from react-router-dom
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedNavigate,
}));

describe('AdminPage Component', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders "Access Denied" if user is not an admin', () => {
        render(
            <BrowserRouter>
                <AdminPage loggedInUser={{ role: 'user' }} />
            </BrowserRouter>
        );

        expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
    });

    test('renders admin buttons when user is an admin', () => {
        render(
            <BrowserRouter>
                <AdminPage loggedInUser={{ role: 'admin' }} />
            </BrowserRouter>
        );

        expect(screen.getByText(/Game Management/i)).toBeInTheDocument();
        expect(screen.getByText(/User Management/i)).toBeInTheDocument();
    });

    test('navigates to game management when "Game Management" button is clicked', () => {
        render(
            <BrowserRouter>
                <AdminPage loggedInUser={{ role: 'admin' }} />
            </BrowserRouter>
        );

        const gameButton = screen.getByText(/Game Management/i);
        fireEvent.click(gameButton);
        expect(mockedNavigate).toHaveBeenCalledWith('/game-management');
    });

    test('navigates to user management when "User Management" button is clicked', () => {
        render(
            <BrowserRouter>
                <AdminPage loggedInUser={{ role: 'admin' }} />
            </BrowserRouter>
        );

        const userButton = screen.getByText(/User Management/i);
        fireEvent.click(userButton);
        expect(mockedNavigate).toHaveBeenCalledWith('/user-management');
    });
});
