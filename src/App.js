import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import FrontPage from './components/FrontPage';
import StorePage from './components/StorePage';
import CartPage from './components/CartPage';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import SignUpPage from './components/SignUpPage';
import AboutPage from './components/AboutPage';
import AdminPage from './components/AdminPage';
import GameManagementPage from './components/GameManagementPage';
import UserManagementPage from './components/UserManagementPage';
import AdminRoute from './components/AdminRoute';
import CheckOutPage from './components/CheckOutPage';
import GameDetailsPage from './components/GameDetailsPage';
import UserInfoPage from './components/UserInfoPage';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import { CartProvider } from './contexts/CartContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import OrderHistory from './components/OrderHistory';

function App() {
  // State to store the currently logged-in user
  const [loggedInUser, setLoggedInUser] = useState(null);

  // Hook for programmatic navigation
  const navigate = useNavigate();

  // Load the logged-in user from localStorage on app initialization
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('loggedInUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setLoggedInUser(parsedUser);
      }
    } catch (error) {
      console.error('Error reading user from localStorage:', error);
      localStorage.removeItem('loggedInUser'); // Clear corrupted data
    }
  }, []);

  // Handle user logout by clearing state and localStorage, then navigating to the home page
  const handleLogout = () => {
    try {
      setLoggedInUser(null);
      localStorage.removeItem('loggedInUser');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/'; // Fallback navigation
    }
  };

  return (
    // Provide cart context to all components
    <CartProvider loggedInUser={loggedInUser}>
      <div className="app-container">
        {/* Navbar for navigation */}
        <Navbar bg="dark" variant="dark" className="app-header">
          <Container>
            <Navbar.Brand as={Link} to="/">GameArcadia</Navbar.Brand>
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/store">Store</Nav.Link>
              {/* Admin link visible only to users with the admin role */}
              {loggedInUser?.role === "admin" && (
                <Nav.Link as={Link} to="/admin">Admin</Nav.Link>
              )}
            </Nav>
            <Nav className="ms-auto">
              {/* Show user-specific links if logged in */}
              {loggedInUser ? (
                <>
                  <Nav.Link as={Link} to="/profile" className="ms-3">{loggedInUser.username}</Nav.Link>
                  <Nav.Link as={Link} to="/cart" className="ms-3">
                    <FontAwesomeIcon icon={faShoppingCart} />
                  </Nav.Link>
                  <Nav.Link onClick={handleLogout} className="ms-3">Logout</Nav.Link>
                </>
              ) : (
                // Show login link if no user is logged in
                <Nav.Link as={Link} to="/login" className="ms-3">Login</Nav.Link>
              )}
            </Nav>
          </Container>
        </Navbar>

        {/* Main content area */}
        <div className="content">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<FrontPage loggedInUser={loggedInUser} />} />
            <Route path="/login" element={<LoginPage setLoggedInUser={setLoggedInUser} />} />
            <Route path="/profile" element={<ProfilePage loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser} />} />
            <Route path="/order-history" element={<OrderHistory loggedInUser={loggedInUser} />} />
            <Route path="/signup" element={<SignUpPage setLoggedInUser={setLoggedInUser} />} />
            <Route path="/store" element={<StorePage loggedInUser={loggedInUser} />} />
            <Route path="/cart" element={<CartPage loggedInUser={loggedInUser} />} />
            <Route path="/checkout" element={<CheckOutPage loggedInUser={loggedInUser} />} />
            <Route path="/about" element={<AboutPage />} />

            {/* Admin-only routes */}
            <Route path="/admin" element={
              <AdminRoute loggedInUser={loggedInUser}>
                <AdminPage loggedInUser={loggedInUser} />
              </AdminRoute>
            } />
            <Route path="/game-management" element={
              <AdminRoute loggedInUser={loggedInUser}>
                <GameManagementPage loggedInUser={loggedInUser} />
              </AdminRoute>
            } />
            <Route path="/user-management" element={
              <AdminRoute loggedInUser={loggedInUser}>
                <UserManagementPage loggedInUser={loggedInUser} />
              </AdminRoute>
            } />

            {/* Dynamic route for game details */}
            <Route
              path="/game/:gameId"
              element={<GameDetailsPage loggedInUser={loggedInUser} />}
            />
            <Route path="/user-info" element={<UserInfoPage loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser} />} />
          </Routes>
        </div>

        {/* Footer section */}
        <footer className="footer">
          <Navbar bg="dark" variant="dark" className="app-footer">
            <Container>
              <Nav className="ms-auto">
                <Nav.Link as={Link} to="/about">About</Nav.Link>
              </Nav>
            </Container>
          </Navbar>
        </footer>
      </div>
    </CartProvider>
  );
}

export default App;