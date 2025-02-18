import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { supabase } from '../supabase';

// Mock the supabase client
jest.mock('../supabase', () => ({
    supabase: {
        from: jest.fn(),
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
    localStorage.setItem('loggedInUser', JSON.stringify(mockLoggedInUser));
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('renders App component and navigates to different routes', async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Check if the Navbar is rendered
    expect(screen.getByText('GameArcadia')).toBeInTheDocument();
    expect(screen.getByText('Store')).toBeInTheDocument();
    expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();

    // Check if the FrontPage is rendered
    expect(screen.getByText('Welcome to GameArcadia')).toBeInTheDocument();

    // Navigate to Store page
    fireEvent.click(screen.getByText('Store'));
    expect(await screen.findByText('Store')).toBeInTheDocument();

    // Navigate to Profile page
    fireEvent.click(screen.getByText('testuser'));
    expect(await screen.findByText('Profile')).toBeInTheDocument();

    // Navigate to Cart page
    fireEvent.click(screen.getByText('Shopping Cart'));
    expect(await screen.findByText('Your Cart')).toBeInTheDocument();

    // Navigate to About page
    fireEvent.click(screen.getByText('About'));
    expect(await screen.findByText('About')).toBeInTheDocument();
  });

  test('renders Login link when user is not logged in', () => {
    localStorage.removeItem('loggedInUser');
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Check if the Login link is rendered
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  test('renders Admin link when user is an admin', () => {
    const adminUser = { ...mockLoggedInUser, role: 'admin' };
    localStorage.setItem('loggedInUser', JSON.stringify(adminUser));
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Check if the Admin link is rendered
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });
});
