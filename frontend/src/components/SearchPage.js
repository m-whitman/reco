import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Search, Clock, Loader } from "lucide-react";
import Layout from "./Layout";
import { useAudio } from "../contexts/AudioContext";
import styles from "./SearchPage.module.css";
import logo from "../images/reco.jpg";
import { debounce } from 'lodash';

function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { searchHistory, addToSearchHistory } = useAudio();
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/search?query=${encodeURIComponent(searchQuery)}`);
      addToSearchHistory(searchQuery);
      navigate('/results', { state: { results: response.data, query: searchQuery } });
    } catch (error) {
      console.error('Error fetching results:', error);
      let errorMessage;
      
      if (error.response) {
        // Server responded with an error
        errorMessage = error.response.data.error || 'An error occurred while fetching results';
        console.error('Server error details:', error.response.data);
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Unable to connect to the server. Please try again later.';
      } else {
        // Error in setting up the request
        errorMessage = 'An error occurred while making the request.';
      }

      navigate('/results', { 
        state: { 
          error: errorMessage, 
          query: searchQuery,
          details: error.response?.data?.details
        } 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      handleSearch(query);
    }
  };

  const handleHistoryClick = (historyItem) => {
    setQuery(historyItem);
    handleSearch(historyItem);
  };

  const fetchSuggestions = debounce(async (searchTerm) => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(`/api/search/suggestions?query=${encodeURIComponent(searchTerm)}`);
      setSuggestions(Array.isArray(response.data) ? response.data : []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  }, 300);

  return (
    <Layout>
      <div className={styles.container}>
        <img src={logo} alt="Logo" className={styles.responsiveImage} />
        <h2 className={styles.title}>Discover Your Next Favorite Song</h2>
        <div className={styles.featureCards}>
          <div className={styles.featureCard}>
            <div className={styles.featureEmoji}>🎵</div>
            <p>Stop switching between platforms to find new music</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureEmoji}>🎧</div>
            <p>Reco brings together songs from Spotify and YouTube in one search</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureEmoji}>✨</div>
            <p>You get smarter recommendations for better music discovery</p>
          </div>
        </div>
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.searchContainer}>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  fetchSuggestions(e.target.value);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search for a song or artist"
                className={styles.input}
                disabled={loading}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className={styles.suggestionsContainer}>
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={styles.suggestionItem}
                      onClick={() => {
                        setQuery(suggestion);
                        setShowSuggestions(false);
                        handleSearch(suggestion);
                      }}
                    >
                      <Search size={16} />
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={`${styles.buttonContainer} ${showSuggestions && suggestions.length > 0 ? styles.withSuggestions : ''}`}>
              <button type="submit" className={styles.button} disabled={loading}>
                {loading ? (
                  <>
                    <Loader className={`${styles.buttonIcon} ${styles.spinner}`} />
                    <span>Searching</span>
                    <span className={styles.loadingDotsContainer}>
                      <span className={styles.loadingDots}></span>
                    </span>
                  </>
                ) : (
                  <>
                    <Search className={styles.buttonIcon} />
                    Search
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        {searchHistory.length > 0 && (
          <div className={styles.historyContainer}>
            <h3 className={styles.historyTitle}>Recent Searches</h3>
            <div className={styles.historyGrid}>
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  className={styles.historyButton}
                  onClick={() => handleHistoryClick(item)}
                  disabled={loading}
                >
                  <Clock className={styles.buttonIcon} />
                  <span className={styles.historyText}>{item}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default SearchPage;
