import { useState, useCallback, useEffect } from 'react';

export const useFavoritesState = () => {
  const [favorites, setFavorites] = useState(() => {
    try {
      const savedFavorites = localStorage.getItem('favorites');
      return savedFavorites ? JSON.parse(savedFavorites) : [];
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  });

  // Sync with localStorage whenever favorites change
  useEffect(() => {
    try {
      localStorage.setItem('favorites', JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }, [favorites]);

  const toggleFavorite = useCallback((song) => {
    if (!song || !song.id) return;
    
    setFavorites(prevFavorites => {
      const isFavorited = prevFavorites.some(fav => fav.id === song.id);
      const newFavorites = isFavorited
        ? prevFavorites.filter(fav => fav.id !== song.id)
        : [...prevFavorites, { ...song }];
      
      // Force a re-render by creating a new array
      return [...newFavorites];
    });
  }, []);

  const isFavorite = useCallback((song) => {
    if (!song || !song.id) return false;
    return favorites.some(fav => fav.id === song.id);
  }, [favorites]);

  const getFavoriteById = useCallback((id) => {
    return favorites.find(fav => fav.id === id) || null;
  }, [favorites]);

  return { 
    favorites, 
    toggleFavorite, 
    isFavorite,
    getFavoriteById 
  };
};