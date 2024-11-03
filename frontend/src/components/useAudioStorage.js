import { useState, useEffect, useCallback } from 'react';

export const useAudioStorage = () => {
  const [favorites, setFavorites] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  // Initialize from localStorage
  useEffect(() => {
    const storedFavorites = localStorage.getItem('favorites');
    const storedHistory = localStorage.getItem('searchHistory');
    
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
    if (storedHistory) {
      setSearchHistory(JSON.parse(storedHistory));
    }
  }, []);

  const toggleFavorite = useCallback((song) => {
    if (!song) return;
    
    setFavorites(prevFavorites => {
      const newFavorites = prevFavorites.some(fav => fav.id === song.id)
        ? prevFavorites.filter(fav => fav.id !== song.id)
        : [...prevFavorites, song];
      
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  const isFavorite = useCallback((song) => {
    if (!song) return false;
    return favorites.some(fav => fav.id === song.id);
  }, [favorites]);

  const addToSearchHistory = useCallback((query) => {
    if (!query || typeof query !== 'string') return;
    
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setSearchHistory(prevHistory => {
      const newHistory = [
        trimmedQuery,
        ...prevHistory.filter(item => item !== trimmedQuery)
      ].slice(0, 10);
      
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  return {
    favorites,
    searchHistory,
    toggleFavorite,
    isFavorite,
    addToSearchHistory
  };
};