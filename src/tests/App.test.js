import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import App from '../App';
import { CartProvider } from '../contexts/CartContext';
const originalCartProvider = require('../contexts/CartContext').CartProvider;

// Mock all child components to isolate App testing
jest.mock('../components/FrontPage', () => () => <div data-testid="mock-frontpage">FrontPage</div>);
jest.mock('../components/StorePage', () => () => <div data-testid="mock-storepage">StorePage</div>);
jest.mock('../components/CartPage', () => () => <div data-testid="mock-cartpage">CartPage</div>);
jest.mock('../components/LoginPage', () => ({ setLoggedInUser }) => (
  <div data-testid="mock-loginpage">
    <button onClick={() => setLoggedInUser({ id: 'test-id', username: 'testuser', role: 'user' })}>
      Mock Login
    </button>
  </div>
));
jest.mock('../components/ProfilePage', () => () => <div data-testid="mock-profilepage">ProfilePage</div>);
jest.mock('../components/OrderHistory', () => () => <div data-testid="mock-orderhistory">OrderHistory</div>);
jest.mock('../components/SignUpPage', () => () => <div data-testid="mock-signuppage">SignUpPage</div>);
jest.mock('../components/AboutPage', () => () => <div data-testid="mock-aboutpage">AboutPage</div>);
jest.mock('../components/AdminPage', () => () => <div data-testid="mock-adminpage">AdminPage</div>);
jest.mock('../components/GameManagementPage', () => () => <div data-testid="mock-gamemanagementpage">GameManagementPage</div>);
jest.mock('../components/UserManagementPage', () => () => <div data-testid="mock-usermanagementpage">UserManagementPage</div>);
jest.mock('../components/CheckOutPage', () => () => <div data-testid="mock-checkoutpage">CheckOutPage</div>);
jest.mock('../components/GameDetailsPage', () => () => <div data-testid="mock-gamedetailspage">GameDetailsPage</div>);
jest.mock('../components/AdminRoute', () => ({ children }) => <div data-testid="mock-adminroute">{children}</div>);
jest.mock('../components/UserInfoPage', () => () => <div data-testid="mock-userinfopage">UserInfoPage</div>);

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
    auth: {
      signIn: jest.fn(),
      signOut: jest.fn(),
    }
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

  test('renders cart icon for logged in users', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Find the cart icon (FontAwesome component)
    const cartLinks = screen.getAllByRole('link');
    const cartLink = cartLinks.find(link => link.getAttribute('href') === '/cart');
    expect(cartLink).toBeInTheDocument();
  });

  test('navigates to correct routes when links are clicked', async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Test store navigation
    fireEvent.click(screen.getByText('Store'));
    await waitFor(() => {
      expect(screen.getByTestId('mock-storepage')).toBeInTheDocument();
    });

    // Test profile navigation
    fireEvent.click(screen.getByText('testuser'));
    await waitFor(() => {
      expect(screen.getByTestId('mock-profilepage')).toBeInTheDocument();
    });

    // Test about navigation (in footer)
    fireEvent.click(screen.getByText('About'));
    await waitFor(() => {
      expect(screen.getByTestId('mock-aboutpage')).toBeInTheDocument();
    });
  });

  test('handles login process correctly', async () => {
    // Start with no logged in user
    localStorage.clear();

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Navigate to login page
    fireEvent.click(screen.getByText('Login'));

    // Find the mocked login page
    await waitFor(() => {
      expect(screen.getByTestId('mock-loginpage')).toBeInTheDocument();
    });

    // Click the mock login button
    fireEvent.click(screen.getByText('Mock Login'));

    // Verify user is now logged in
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  test('renders initial route correctly', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('mock-frontpage')).toBeInTheDocument();
  });
});

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

describe('App Component - Additional Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('loggedInUser', JSON.stringify(mockLoggedInUser));
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('renders UserInfoPage correctly', () => {
    render(
      <MemoryRouter initialEntries={['/user-info']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('mock-userinfopage')).toBeInTheDocument();
  });

  test('handles invalid gameId in GameDetailsPage gracefully', () => {
    render(
      <MemoryRouter initialEntries={['/game/invalid-id']}>
        <App />
      </MemoryRouter>
    );

    // Assuming the GameDetailsPage handles invalid IDs gracefully
    expect(screen.getByTestId('mock-gamedetailspage')).toBeInTheDocument();
  });

  test('renders fallback UI for missing loggedInUser', () => {
    localStorage.clear();

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  test('ensures navigation links have accessible roles', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /store/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
  });
});