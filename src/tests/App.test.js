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

    // Find and click mock login button from the mocked LoginPage component
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

    // Mock supabase
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

    // Mock user
    const mockLoggedInUser = {
      id: 'user-id',
      username: 'testuser',
      email: 'testuser@example.com',
      role: 'user',
    };

    describe('App Component - Core Functionality', () => {
      beforeEach(() => {
        localStorage.clear();
      });

      afterEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
      });

      test('renders App component without user', () => {
        render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );

        expect(screen.getByText('GameArcadia')).toBeInTheDocument();
        expect(screen.getByText('Store')).toBeInTheDocument();
        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.queryByText('Logout')).not.toBeInTheDocument();
      });

      test('renders App component with logged-in user', () => {
        localStorage.setItem('loggedInUser', JSON.stringify(mockLoggedInUser));

        render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );

        expect(screen.getByText('testuser')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
        expect(screen.queryByText('Login')).not.toBeInTheDocument();
      });

      test('renders admin nav link only for admin users', () => {
        // Regular user
        localStorage.setItem('loggedInUser', JSON.stringify(mockLoggedInUser));

        const { rerender } = render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );

        expect(screen.queryByText('Admin')).not.toBeInTheDocument();

        // Admin user
        localStorage.clear();
        localStorage.setItem('loggedInUser', JSON.stringify({ ...mockLoggedInUser, role: 'admin' }));

        rerender(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );

        expect(screen.getByText('Admin')).toBeInTheDocument();
      });
    });

    describe('App Component - Navigation', () => {
      beforeEach(() => {
        localStorage.setItem('loggedInUser', JSON.stringify(mockLoggedInUser));
      });

      afterEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
      });

      test('navigates to home page when brand is clicked', async () => {
        render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );

        fireEvent.click(screen.getByText('GameArcadia'));

        await waitFor(() => {
          expect(screen.getByTestId('mock-frontpage')).toBeInTheDocument();
        });
      });

      test('navigates to order history page', async () => {
        render(
          <MemoryRouter initialEntries={['/order-history']}>
            <App />
          </MemoryRouter>
        );

        expect(screen.getByTestId('mock-orderhistory')).toBeInTheDocument();
      });

      test('navigates to signup page', async () => {
        render(
          <MemoryRouter initialEntries={['/signup']}>
            <App />
          </MemoryRouter>
        );

        expect(screen.getByTestId('mock-signuppage')).toBeInTheDocument();
      });

      test('renders checkout page with loggedInUser prop', async () => {
        render(
          <MemoryRouter initialEntries={['/checkout']}>
            <App />
          </MemoryRouter>
        );

        expect(screen.getByTestId('mock-checkoutpage')).toBeInTheDocument();
      });

      test('renders game details page with gameId parameter', async () => {
        render(
          <MemoryRouter initialEntries={['/game/123']}>
            <App />
          </MemoryRouter>
        );

        expect(screen.getByTestId('mock-gamedetailspage')).toBeInTheDocument();
      });
    });

    describe('App Component - Admin Routes', () => {
      beforeEach(() => {
        localStorage.setItem('loggedInUser', JSON.stringify({ ...mockLoggedInUser, role: 'admin' }));
      });

      afterEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
      });

      test('renders admin page for admin users', async () => {
        render(
          <MemoryRouter initialEntries={['/admin']}>
            <App />
          </MemoryRouter>
        );

        expect(screen.getByTestId('mock-adminroute')).toBeInTheDocument();
        expect(screen.getByTestId('mock-adminpage')).toBeInTheDocument();
      });

      test('renders game management page for admin users', async () => {
        render(
          <MemoryRouter initialEntries={['/game-management']}>
            <App />
          </MemoryRouter>
        );

        expect(screen.getByTestId('mock-adminroute')).toBeInTheDocument();
        expect(screen.getByTestId('mock-gamemanagementpage')).toBeInTheDocument();
      });

      test('renders user management page for admin users', async () => {
        render(
          <MemoryRouter initialEntries={['/user-management']}>
            <App />
          </MemoryRouter>
        );

        expect(screen.getByTestId('mock-adminroute')).toBeInTheDocument();
        expect(screen.getByTestId('mock-usermanagementpage')).toBeInTheDocument();
      });
    });

    describe('App Component - Error Handling', () => {
      test('handles localStorage errors gracefully', () => {
        // Set up corrupt localStorage data
        localStorage.setItem('loggedInUser', '{invalid-json}');

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );

        // Error should be logged and localStorage item removed
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(localStorage.getItem('loggedInUser')).toBeNull();

        consoleErrorSpy.mockRestore();
      });

      test('uses fallback navigation when navigate throws error', () => {
        localStorage.setItem('loggedInUser', JSON.stringify(mockLoggedInUser));

        // Mock navigate to throw error
        const mockNavigate = jest.fn(() => {
          throw new Error('Navigation failed');
        });

        jest.spyOn(require('react-router-dom'), 'useNavigate').mockImplementation(() => mockNavigate);

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        const locationSpy = jest.spyOn(window.location, 'href', 'set');

        render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );

        // Trigger logout
        fireEvent.click(screen.getByText('Logout'));

        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(locationSpy).toHaveBeenCalledWith('/');

        consoleErrorSpy.mockRestore();
        locationSpy.mockRestore();
      });
    });

    describe('App Component - CartProvider Integration', () => {
      test('passes loggedInUser to CartProvider', () => {
        localStorage.setItem('loggedInUser', JSON.stringify(mockLoggedInUser));

        // Mock CartProvider to verify props
        const mockCartProvider = jest.fn(({ children }) => children);
        jest.spyOn(require('../contexts/CartContext'), 'CartProvider').mockImplementation(mockCartProvider);

        render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );

        expect(mockCartProvider).toHaveBeenCalledWith(
          expect.objectContaining({
            loggedInUser: mockLoggedInUser,
            children: expect.anything()
          }),
          expect.anything()
        );

        // Restore original implementation
        jest.spyOn(require('../contexts/CartContext'), 'CartProvider').mockImplementation(originalCartProvider);
      });
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    const locationSpy = jest.spyOn(window.location, 'href', 'set');

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Logout'));

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(locationSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
    locationSpy.mockRestore();
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
describe('App Component', () => {
  test('renders App component with default route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('mock-frontpage')).toBeInTheDocument();
  });

  test('navigates to Store page when Store link is clicked', async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Store'));
    await waitFor(() => {
      expect(screen.getByTestId('mock-storepage')).toBeInTheDocument();
    });
  });

  test('renders navigation links for logged-in user', () => {
    localStorage.setItem('loggedInUser', JSON.stringify(mockLoggedInUser));

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByText(mockLoggedInUser.username)).toBeInTheDocument();
  });

  test('handles logout correctly', async () => {
    localStorage.setItem('loggedInUser', JSON.stringify(mockLoggedInUser));

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Logout'));
    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(localStorage.getItem('loggedInUser')).toBeNull();
    });
  });

  test('renders admin navigation for admin user', () => {
    const adminUser = { ...mockLoggedInUser, role: 'admin' };
    localStorage.setItem('loggedInUser', JSON.stringify(adminUser));

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  test('handles localStorage parsing errors gracefully', () => {
    localStorage.setItem('loggedInUser', '{invalid json}');

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(screen.getByText('Login')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  test('renders cart icon for logged-in user', () => {
    localStorage.setItem('loggedInUser', JSON.stringify(mockLoggedInUser));

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    const cartLinks = screen.getAllByRole('link');
    const cartLink = cartLinks.find(link => link.getAttribute('href') === '/cart');
    expect(cartLink).toBeInTheDocument();
  });

  test('navigates to Profile page when username is clicked', async () => {
    localStorage.setItem('loggedInUser', JSON.stringify(mockLoggedInUser));

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText(mockLoggedInUser.username));
    await waitFor(() => {
      expect(screen.getByTestId('mock-profilepage')).toBeInTheDocument();
    });
  });
});