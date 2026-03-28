import React from 'react';
import styles from './LoadingScreen.module.css';

const LoadingScreen = ({ message = 'Loading vehicle data...' }) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        {/* Animated Logo */}
        <div className={styles.logoMark}>
          <div className={styles.ring}></div>
          <div className={styles.ring}></div>
          <div className={styles.ring}></div>
          <span className={styles.logoText}>AF</span>
        </div>

        {/* Loading bar */}
        <div className={styles.barTrack}>
          <div className={styles.barFill}></div>
        </div>

        <p className={styles.message}>{message}</p>
        <span className={styles.subtext}>AUCTIONFLOOR — PRECISION MARKETPLACE</span>
      </div>
    </div>
  );
};

export default LoadingScreen;
