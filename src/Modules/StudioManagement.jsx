import React, { useState } from 'react';
import styles from '../Pages/Dashboard.module.css';
import { FaLandmark, FaBell, FaPlus } from 'react-icons/fa';

const StudioManagement = () => {
  const [alerts, setAlerts] = useState({
    newBid: true,
    expiring: true,
    weekly: false
  });

  const toggleAlert = (key) => {
    setAlerts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={styles.bottomSection}>
      <h3 className={styles.sectionTitle}>Studio Management</h3>
      
      <div className={styles.bottomGrid}>
        {/* Payout Methods */}
        <div className={styles.managementCard}>
          <div className={styles.cardHeader}>
            <FaLandmark className={styles.headerIconSmall} /> Payout Methods
          </div>
          <div className={styles.cardContent}>
            <div className={styles.paymentMethod}>
              <div className={styles.visaBox}>VISA</div>
              <div className={styles.paymentDetails}>
                <strong>•••• 9842</strong>
                <span>Default Payout Method</span>
              </div>
              <button className={styles.editBtn}>Edit</button>
            </div>
            
            <button className={styles.addBankBtn}>
              <FaPlus /> Connect New Bank Account
            </button>
          </div>
        </div>

        {/* Auction Alerts */}
        <div className={styles.managementCard}>
          <div className={styles.cardHeader}>
            <FaBell className={styles.headerIconSmall} /> Auction Alerts
          </div>
          <div className={styles.cardContent}>
            
            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <strong>New Bid Received</strong>
                <span>Real-time push and email notifications</span>
              </div>
              <div 
                className={`${styles.toggleSwitch} ${alerts.newBid ? styles.active : ''}`}
                onClick={() => toggleAlert('newBid')}
              >
                <div className={styles.toggleKnob}></div>
              </div>
            </div>

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <strong>Auction Expiring Soon</strong>
                <span>Alert when listing has less than 2 hours</span>
              </div>
              <div 
                className={`${styles.toggleSwitch} ${alerts.expiring ? styles.active : ''}`}
                onClick={() => toggleAlert('expiring')}
              >
                <div className={styles.toggleKnob}></div>
              </div>
            </div>

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <strong>Weekly Seller Report</strong>
                <span>Consolidated performance analytics</span>
              </div>
              <div 
                className={`${styles.toggleSwitch} ${alerts.weekly ? styles.active : ''}`}
                onClick={() => toggleAlert('weekly')}
              >
                <div className={styles.toggleKnob}></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioManagement;
