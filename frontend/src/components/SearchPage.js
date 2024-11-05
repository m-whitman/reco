import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Search, Clock, Loader } from "lucide-react";
import Layout from "./Layout";
import { useAudio } from "./AudioContext";
import styles from "./SearchPage.module.css";
import logo from "../images/reco.jpg";

function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { searchHistory, addToSearchHistory } = useAudio();

  const handleSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8888/api/search?query=${encodeURIComponent(searchQuery)}`);
      addToSearchHistory(searchQuery);
      navigate('/results', { state: { results: response.data, query: searchQuery } });
    } catch (error) {
      console.error('Error fetching results:', error);
      navigate('/results', { state: { error: 'An error occurred while fetching results', query: searchQuery } });
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

  return (
    <Layout>
      <div className={styles.container}>
        <img src={logo} alt="Logo" className={styles.responsiveImage} />
        <h2 className={styles.title}>Discover Your Next Favorite Song</h2>
        <div className={styles.featureCards}>
          <div className={styles.featureCard}>
            <h4>🎵 No More Platform Hopping!</h4>
            <p>Find your tunes in one place - no need to juggle between apps</p>
          </div>
          <div className={styles.featureCard}>
            <h4>🎧 Everything in One Spot</h4>
            <p>Get the best of Spotify and YouTube together (with more platforms on the way!)</p>
          </div>
          <div className={styles.featureCard}>
            <h4>✨ Smart Music Magic</h4>
            <p>Let our clever algorithms find your next favorite tracks</p>
          </div>
        </div>
        <div className={styles.infoCard}>
          <span className={styles.infoIcon}>ℹ️</span>
          <p className={styles.infoText}>
            Quick heads up: Spotify previews are 30 seconds long (it's their rule, not ours!)
          </p>
        </div>
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a song or artist"
              className={styles.input}
              disabled={loading}
            />
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
