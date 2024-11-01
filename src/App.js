import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FrontPage from './components/FrontPage';
import StorePage from './components/StorePage';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import AboutPage from './components/AboutPage';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null); // Track logged-in user

  return (
    <Router>
      <div>
        <Navbar bg="primary" data-bs-theme="light">
          <Container>
            <Navbar.Brand as={Link} to="/">GameArcadia</Navbar.Brand>
            <Nav className="me-auto">
              {loggedInUser ? (
                <Nav.Link as={Link} to="/profile">{loggedInUser}</Nav.Link>
              ) : (
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
              )}
              <Nav.Link as={Link} to="/store">Store</Nav.Link>
            </Nav>
          </Container>
        </Navbar>
        <Routes>
          <Route path="/" element={<FrontPage />} />
          <Route path="/login" element={<LoginPage setLoggedInUser={setLoggedInUser} />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
        <Navbar bg="primary" data-bs-theme="light" fixed="bottom">
          <Container>
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/about">About</Nav.Link>
            </Nav>
          </Container>
        </Navbar>
      </div>
    </Router>
  );
}

export default App;
