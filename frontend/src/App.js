// File: ./src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AudioProvider } from '../components/contexts/AudioContext';
import SearchPage from './components/SearchPage';
import ResultsPage from './components/ResultsPage';
import FavoritesPage from './components/FavoritesPage';

function App() {
  return (
    <AudioProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
        </Routes>
      </Router>
    </AudioProvider>
  );
}

export default App;