import React from 'react';
import styles from '../Pages/Dashboard.module.css';

const ActivityFeed = () => {
  const activities = [
    {
      id: 1,
      user: 'Alex_W_Collector',
      time: '2m ago',
      action: 'Bid $215,000',
      item: 'Porsche 911 GT3 RS',
      avatar: 'A'
    },
    {
      id: 2,
      user: 'SarahLuxuryMotors',
      time: '12m ago',
      action: 'Bid $341,500',
      item: 'Lamborghini Huracán',
      avatar: 'S'
    },
    {
      id: 3,
      user: 'KnightRider_99',
      time: '18m ago',
      action: 'Bid $214,500',
      item: 'Porsche 911 GT3 RS',
      avatar: 'K'
    },
    {
      id: 4,
      user: 'Apex_Predator',
      time: '45m ago',
      action: 'Bid $298,500',
      item: 'Ferrari F8 Tributo',
      avatar: 'AP'
    }
  ];

  return (
    <div className={styles.activityFeedWrapper}>
      <h3 className={styles.sectionTitle}>
        Activity Feed
        <span className={styles.liveIndicator}>
          <span className={styles.pulsingDot}></span> LIVE
        </span>
      </h3>
      
      <div className={styles.feedCard}>
        <div className={styles.feedList}>
          {activities.map(act => (
            <div key={act.id} className={styles.feedItem}>
              <div className={styles.avatarCircle}>{act.avatar}</div>
              <div className={styles.feedContent}>
                <div className={styles.feedHeaderRow}>
                  <span className={styles.feedUser}>{act.user}</span>
                  <span className={styles.feedTime}>{act.time}</span>
                </div>
                <div className={styles.feedDetails}>
                  <strong>{act.action}</strong> on {act.item}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.summaryBox}>
          <h4 className={styles.summaryTitle}>BIDDING SUMMARY</h4>
          <div className={styles.summaryRow}>
            <span>Total Volume (24h)</span>
            <strong>$855,000</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Unique Bidders</span>
            <strong>128</strong>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityFeed;
