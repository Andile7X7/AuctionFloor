import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBookmark, FaFire, FaRegComment } from 'react-icons/fa';
import styles from '../Pages/AuctionFloor.module.css';

const AUCTION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 1 week in ms

const useCountdown = (createdAt) => {
  const getTimeLeft = () => {
    const end = new Date(createdAt).getTime() + AUCTION_DURATION_MS;
    const diff = end - Date.now();
    return Math.max(0, diff);
  };

  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return timeLeft;
};

const formatCountdown = (ms) => {
  if (ms <= 0) return { label: 'ENDED', urgent: true };

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours >= 1) {
    // Display as HH:MM
    return {
      label: `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`,
      urgent: hours < 6,
    };
  } else {
    // Below 1 hour: switch to MM:SS
    return {
      label: `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`,
      urgent: true,
    };
  }
};

const AuctionCard = ({ listing }) => {
  const navigate = useNavigate();
  const timeLeft = useCountdown(listing.created_at);
  const { label: timerLabel, urgent } = formatCountdown(timeLeft);

  const formatZAR = (amount) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  return (
    <div className={styles.card} onClick={() => navigate(`/listing/${listing.id}`)}>
      <div className={styles.imageArea}>
        <div className={styles.liveTag}>{timeLeft <= 0 ? 'ENDED' : 'LIVE'}</div>
        <button className={styles.bookmarkBtn} onClick={(e) => e.stopPropagation()}>
          <FaBookmark />
        </button>
        <img src={listing.ImageURL} alt={listing.Model} className={styles.cardImage} />
        <div className={styles.cardTitleOverlay}>
          <span className={styles.lotNumber}>LOT #{listing.id.toString().padStart(3, '0')}</span>
          <h3 className={styles.cardTitle}>{listing.Year} {listing.Make} {listing.Model}</h3>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.bidRow}>
          <div className={styles.bidCol}>
            <span className={styles.bidLabel}>CURRENT BID</span>
            <span className={styles.bidValue}>{formatZAR(listing.CurrentPrice || listing.StartingPrice)}</span>
          </div>
          <div className={styles.bidCol}>
            <span className={styles.bidLabel}>TIME LEFT</span>
            <span className={`${styles.timeValue} ${urgent ? styles.timeUrgent : ''}`}>
              {timerLabel}
            </span>
          </div>
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.stats}>
            <span className={styles.heatStat}><FaFire /> {listing.likes?.[0]?.count || 0}</span>
            <span><FaRegComment /> {listing.comments?.[0]?.count || 0}</span>
          </div>
          <button className={styles.placeBidBtn}>PLACE BID</button>
        </div>
      </div>
    </div>
  );
};

export default AuctionCard;
