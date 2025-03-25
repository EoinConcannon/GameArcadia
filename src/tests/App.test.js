import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { supabase } from '../supabase';

// Mock the supabase client more comprehensively
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(),
      // Add more mock methods as needed
    })),
  },
}));

const mockLoggedInUser = {
  id: 'user-id',
  username: 'testuser',
  email: 'testuser@example.com',
  role: 'user',
};

describe('App Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Set up mocked localStorage for logged-in user
    localStorage.setItem('loggedInUser', JSON.stringify(mockLoggedInUser));
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('renders App component with logged-in user navigation', async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Verify core navigation elements
    expect(screen.getByText('GameArcadia')).toBeInTheDocument();
    expect(screen.getByText('Store')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  test('handles user logout correctly', async () => {
    const { unmount } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Verify user is logged in
    expect(screen.getByText('testuser')).toBeInTheDocument();

    // Click logout
    fireEvent.click(screen.getByText('Logout'));

    // Wait for navigation and verify login link appears
    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(localStorage.getItem('loggedInUser')).toBeNull();
    });

    unmount();
  });

  test('renders different navigation for admin user', () => {
    const adminUser = { ...mockLoggedInUser, role: 'admin' };
    localStorage.setItem('loggedInUser', JSON.stringify(adminUser));

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Check for admin-specific elements
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  test('handles localStorage parsing errors gracefully', () => {
    // Simulate a corrupt localStorage entry
    localStorage.setItem('loggedInUser', '{invalid json}');

    // Spy on console.error to verify error handling
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Verify error was logged and login link is shown
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(screen.getByText('Login')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});