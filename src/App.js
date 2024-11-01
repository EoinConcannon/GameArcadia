import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
  return (
    <div>
      <Navbar bg="primary" data-bs-theme="light">
        <Container>
          <Navbar.Brand href="/">GameArcadia</Navbar.Brand>
          <Nav className="me-auto">
          <Nav.Link href="login">Login</Nav.Link>
            <Nav.Link href="store">Store</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
      <Router>
        <Routes>
          <Route path="/" element={<FrontPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Router>
      <Navbar bg="primary" data-bs-theme="light" fixed="bottom">
        <Container>
          <Nav className="ms-auto">
            <Nav.Link href="about">About</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
    </div>
  );
}

export default App;