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
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import { CartProvider } from './contexts/CartContext';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null); // Track if a user is logged in
  const [users, setUsers] = useState([]); // Track users
  const navigate = useNavigate(); // Hook to navigate to different pages

  // Load logged-in user from local storage when the app starts
  useEffect(() => {
    const user = localStorage.getItem('loggedInUser');
    if (user) {
      setLoggedInUser(JSON.parse(user));
    }
  }, []);

  // Handle user logout
  const handleLogout = () => {
    setLoggedInUser(null); // Clear logged-in user status
    localStorage.removeItem('loggedInUser'); // Remove user from local storage
    navigate('/'); // Navigate to the home page
  };

  // Temporary function to add a new user (will be replaced with a database later)
  // No longer functional after adding Supabase
  const addUser = (newUser) => {
    setUsers((prevUsers) => [...prevUsers, newUser]);
  };

  return (
    <CartProvider loggedInUser={loggedInUser}>
      <div className="app-container">
        {/* Top Navbar */}
        <Navbar bg="light" data-bs-theme="light">
          <Container>
            <Navbar.Brand as={Link} to="/">GameArcadia</Navbar.Brand>
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/store">Store</Nav.Link>
              {loggedInUser?.role === "admin" && (
                <Nav.Link as={Link} to="/admin">Admin</Nav.Link>
              )}
            </Nav>
            <Nav className="ms-auto">
              {loggedInUser ? (
                <>
                  <Nav.Link as={Link} to="/profile">{loggedInUser.username}</Nav.Link>
                  <Nav.Link as={Link} to="/cart">Shopping Cart</Nav.Link>
                  <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
                </>
              ) : (
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
              )}
            </Nav>
          </Container>
        </Navbar>

        {/* Main Content */}
        <div className="content">
          <Routes>
            <Route path="/" element={<FrontPage />} />
            <Route path="/login" element={<LoginPage users={users} setLoggedInUser={setLoggedInUser} />} />
            <Route path="/profile" element={<ProfilePage loggedInUser={loggedInUser} />} />
            <Route path="/signup" element={<SignUpPage addUser={addUser} />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/admin" element={loggedInUser?.role === "admin" ? (<AdminPage />) : (
                  <div>You are not authorized to view this page.</div> //if non-admin user enters admin in url
                )
              }
            />
          </Routes>
        </div>

        {/* Bottom Navbar */}
        <footer className="footer">
          <Navbar bg="light" data-bs-theme="light">
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
