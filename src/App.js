import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import FrontPage from './components/FrontPage';
import StorePage from './components/StorePage';
import CartPage from './components/CartPage';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import AboutPage from './components/AboutPage';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import { CartProvider } from './contexts/CartContext';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null); //tracks if user logged in
  const [users, setUsers] = useState([]); // Track users
  const navigate = useNavigate();

  const handleLogout = () => {
    setLoggedInUser(null); //clear logged in user status
    navigate('/');
  };

  // this is only temporary, we will replace this with a database later
  const addUser = (newUser) => {
    setUsers((prevUsers) => [...prevUsers, newUser]);
  };

  return (
    <CartProvider>
      <div style={{ backgroundColor: 'black', color: 'white', minHeight: '100vh' }}>
        <Navbar bg="light" data-bs-theme="light">
          <Container>
            <Navbar.Brand as={Link} to="/">GameArcadia</Navbar.Brand>
            <Nav className="me-auto">
              {loggedInUser ? (
                <>
                  <Nav.Link as={Link} to="/profile">{loggedInUser}</Nav.Link> {/* add a profile page later */}
                  <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
                </>
              ) : (
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
              )}
              <Nav.Link as={Link} to="/store">Store</Nav.Link>
              {loggedInUser && (
                <Nav.Link as={Link} to="/cart">Shopping Cart</Nav.Link>
              )}
            </Nav>
          </Container>
        </Navbar>
        <Routes>
          <Route path="/" element={<FrontPage />} />
          <Route path="/login" element={<LoginPage users={users} setLoggedInUser={setLoggedInUser} />} />
          <Route path="/signup" element={<SignUpPage addUser={addUser} />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
        <Navbar bg="light" data-bs-theme="light" fixed="bottom">
          <Container>
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/about">About</Nav.Link>
            </Nav>
          </Container>
        </Navbar>
      </div>
    </CartProvider>
  );
}

export default App;
