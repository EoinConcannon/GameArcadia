import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter as Router } from 'react-router-dom';
import GameManagementPage from '../components/GameManagementPage';

// Mock the useNavigate hook
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedNavigate,
}));

describe('GameManagementPage', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders the Back to Admin Page button', () => {
        render(
            <Router>
                <GameManagementPage />
            </Router>
        );

        // Check if the button is rendered
        const backButton = screen.getByText('Back to Admin Page');
        expect(backButton).toBeInTheDocument();
    });

    test('navigates to the admin page when the Back to Admin Page button is clicked', () => {
        render(
            <Router>
                <GameManagementPage />
            </Router>
        );

        // Simulate button click
        const backButton = screen.getByText('Back to Admin Page');
        fireEvent.click(backButton);

        // Check if navigate was called with the correct path
        expect(mockedNavigate).toHaveBeenCalledWith('/admin');
    });
});