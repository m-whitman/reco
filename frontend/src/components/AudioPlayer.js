import React, { useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Loader } from "lucide-react";
import { FaSpotify, FaYoutube } from "react-icons/fa";
import { useAudio } from "../contexts/AudioContext";
import YouTubePlayer from "./YouTubePlayer";
import styles from "./AudioPlayer.module.css";

const AudioPlayer = () => {
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    isBuffering,
    togglePlayPause,
    seekTo,
    youtubePlayerRef,
    handleYouTubeStateChange,
    playNext,
    playPrevious,
    hasNext,
    hasPrevious,
    stopPlayback
  } = useAudio();

  const progressRef = useRef(null);

  const handleProgressClick = (e) => {
    if (!progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    seekTo(percentage);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getExternalUrl = () => {
    if (currentSong.source === "YouTube") {
      return `https://www.youtube.com/watch?v=${currentSong.id}`;
    } else if (currentSong.source === "Spotify") {
      return currentSong.url || "#";
    }
    return "#";
  };

  const handleClose = () => {
    if (stopPlayback) {
      stopPlayback();
    }
  };

  if (!currentSong) return null;

  return (
    <div className={styles.audioPlayerContainer}>
      <div className={styles.audioPlayerContent}>
        <a
          href={getExternalUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.songInfoLink}
        >
          <div className={styles.songInfoContainer}>
            <div className={styles.imageContainer}>
              <img
                src={currentSong.imageUrl}
                alt={currentSong.name || currentSong.title}
                className={styles.songImage}
              />
              {isBuffering && (
                <div className={styles.bufferingOverlay}>
                  <Loader className={styles.spinner} size={24} />
                </div>
              )}
              <div className={styles.sourceLink}>
                {currentSong.source === "YouTube" ? (
                  <FaYoutube style={{ color: "#FF0000" }} />
                ) : (
                  <FaSpotify style={{ color: "#1DB954" }} />
                )}
              </div>
            </div>
            <div className={styles.songInfo}>
              <h3 className={styles.songTitle}>
                {currentSong.name || currentSong.title}
              </h3>
              <p className={styles.songArtist}>{currentSong.artist}</p>
            </div>
          </div>
        </a>

        <div className={styles.playerControls}>
          <div className={styles.controlButtons}>
            <button
              className={`${styles.playButton} ${
                !hasPrevious ? styles.disabled : ""
              }`}
              onClick={playPrevious}
              disabled={!hasPrevious}
              aria-label="Previous track"
            >
              <SkipBack />
            </button>

            <button
              className={styles.playButton}
              onClick={togglePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause /> : <Play />}
            </button>

            <button
              className={`${styles.playButton} ${
                !hasNext ? styles.disabled : ""
              }`}
              onClick={playNext}
              disabled={!hasNext}
              aria-label="Next track"
            >
              <SkipForward />
            </button>
          </div>

          <div className={styles.progressContainer}>
            <div
              className={styles.progressBar}
              ref={progressRef}
              onClick={handleProgressClick}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className={styles.timeInfo}>
              <span>{formatTime((progress / 100) * duration)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <a
            href={getExternalUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.externalLink}
            aria-label="Open in external player"
          ></a>
        </div>
      </div>

      {currentSong?.source === "YouTube" && (
        <YouTubePlayer
          videoId={currentSong.id}
          ref={youtubePlayerRef}
          onStateChange={handleYouTubeStateChange}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default AudioPlayer;
