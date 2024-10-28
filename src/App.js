import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FrontPage from './components/frontPage';
import StorePage from './components/storePage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/store" element={<StorePage />} />
      </Routes>
    </Router>
  );
}

export default App;