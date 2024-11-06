import { useState, useCallback } from 'react';

export const useFavoritesState = () => {
  const [favorites, setFavorites] = useState(() => {
    const savedFavorites = localStorage.getItem('favorites');
    return savedFavorites ? JSON.parse(savedFavorites) : [];
  });

  const toggleFavorite = useCallback((song) => {
    setFavorites(prevFavorites => {
      const isFavorited = prevFavorites.some(fav => fav.id === song.id);
      const newFavorites = isFavorited
        ? prevFavorites.filter(fav => fav.id !== song.id)
        : [...prevFavorites, song];
      
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  const isFavorite = useCallback((song) => {
    return favorites.some(fav => fav.id === song.id);
  }, [favorites]);

  return { favorites, toggleFavorite, isFavorite };
};