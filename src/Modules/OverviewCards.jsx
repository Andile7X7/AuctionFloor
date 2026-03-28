import React from 'react';
import styles from '../Pages/Dashboard.module.css';
import { FaCar, FaGavel, FaMoneyBillWave, FaChartLine, FaBolt, FaStar } from 'react-icons/fa';

const OverviewCards = ({ listings = [] }) => {
  const activeCount = listings.length;

  const totalBids = listings.reduce((sum, item) => sum + (item.NumberOfBids || 0), 0);
  const totalSales = listings.reduce((sum, item) => sum + (item.CurrentPrice || item.StartingPrice || 0), 0);

  const formatZAR = (amount) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <div className={styles.statHeader}>Active Listings</div>
        <h3 className={styles.statValue}>{activeCount}</h3>
        <FaCar className={styles.statIconBg} />
        <div className={styles.statFooter}>
          <FaChartLine className={styles.statTrendUp} />
          <span>+0 this week</span>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statHeader}>Total Bids Received</div>
        <h3 className={styles.statValue}>{totalBids}</h3>
        <FaGavel className={styles.statIconBg} />
        <div className={styles.statFooter}>
          <FaBolt style={{ color: '#fff' }} />
          <span>Average {activeCount > 0 ? Math.round(totalBids / activeCount) : 0} bids/item</span>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statHeader}>Total Valuation</div>
        <h3 className={`${styles.statValue} ${styles.accent}`}>{formatZAR(totalSales)}</h3>
        <FaMoneyBillWave className={styles.statIconBg} />
        <div className={styles.statFooter}>
          <FaStar style={{ color: '#ffb480' }} />
          <span style={{ color: '#ffb480' }}>Top 5% Seller Status</span>
        </div>
      </div>
    </div>
  );
};

export default OverviewCards;
