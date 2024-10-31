import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FrontPage from './components/frontPage';
import StorePage from './components/storePage';
import LoginPage from './components/loginPage';
import AboutPage from './components/aboutPage';
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