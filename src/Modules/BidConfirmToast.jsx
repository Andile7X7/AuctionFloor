import React, { useEffect } from 'react';
import styles from './BidConfirmToast.module.css';
import { FaCheckCircle, FaGavel } from 'react-icons/fa';

const BidConfirmToast = ({ amount, listingName, onClose }) => {
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const formatZAR = (n) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(n || 0);

  return (
    <div className={styles.overlay}>
      <div className={styles.toast}>
        {/* Success Circle */}
        <div className={styles.iconWrap}>
          <div className={styles.successRing}></div>
          <FaCheckCircle className={styles.checkIcon} />
        </div>

        <div className={styles.gavelWrap}>
          <FaGavel className={styles.gavel} />
        </div>

        <h2 className={styles.title}>Bid Lodged!</h2>
        <p className={styles.sub}>Your bid has been successfully registered.</p>

        <div className={styles.bidDetail}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Amount</span>
            <span className={styles.detailValue}>{formatZAR(amount)}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Vehicle</span>
            <span className={styles.detailValue}>{listingName}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Status</span>
            <span className={styles.statusBadge}>Active — Highest Bidder</span>
          </div>
        </div>

        <p className={styles.reassurance}>
          You will be notified if you are outbid. Good luck! 🏆
        </p>

        <div className={styles.progressBar}>
          <div className={styles.progressFill}></div>
        </div>

        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default BidConfirmToast;
