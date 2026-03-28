import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import styles from './DashboardLayout.module.css';
import Sidebar from './Sidebar';
import { FaSearch, FaBell, FaQuestionCircle, FaBars, FaSignOutAlt, FaUser } from 'react-icons/fa';

const DashboardLayout = ({ children, user, searchTerm, onSearch }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  React.useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);
      setUnreadCount(count || 0);
    };

    fetchUnread();

    const channel = supabase
      .channel('header_notifs')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `recipient_id=eq.${user.id}`
      }, () => {
        fetchUnread();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.headerLeftMobile}>
            <button className={styles.menuToggle} onClick={() => setMenuOpen(true)}>
              <FaBars />
            </button>
            <div className={styles.searchBar}>
              <FaSearch className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search inventory..." 
                value={searchTerm || ''}
                onChange={(e) => onSearch && onSearch(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.notificationBellWrap} onClick={() => navigate('/dashboard/notifications')}>
              <FaBell className={styles.headerIcon} />
              {unreadCount > 0 && <span className={styles.notifBadge}>{unreadCount}</span>}
            </div>
            <FaQuestionCircle className={styles.headerIcon} />
            <div className={styles.profileInfo} onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
              <span className={styles.profileName}>Account</span>
              <div className={styles.profileAvatar}>
                {user?.email?.charAt(0)?.toUpperCase() || 'P'}
              </div>
              
              {profileMenuOpen && (
                <div className={styles.dropdownMenu}>
                  <div className={styles.dropdownItem} onClick={() => navigate('/dashboard')}>
                    <FaUser /> My Profile
                  </div>
                  <div className={styles.dropdownDivider}></div>
                  <div className={`${styles.dropdownItem} ${styles.logoutItem}`} onClick={handleLogout}>
                    <FaSignOutAlt /> Log Out
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className={styles.scrollableArea}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
