import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaUserCircle, FaBars, FaTimes, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { supabase } from './SupabaseClient';
import styles from '../Pages/AuctionFloor.module.css';

const AuctionHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.brand} onClick={() => navigate('/')}>AUCTIONFLOOR</div>
        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
          <span className={styles.activeNav} onClick={() => { navigate('/'); setMenuOpen(false); }}>AUCTIONS</span>
          <span onClick={() => { navigate('/dashboard'); setMenuOpen(false); }}>INVENTORY</span>
          <span onClick={() => { navigate('/new-listing'); setMenuOpen(false); }}>SELL</span>
          <span onClick={() => setMenuOpen(false)}>NEWS</span>
          
          {/* Mobile Only Dashboard/Sign In */}
          <div className={styles.mobileOnlyActions}>
            {user ? (
              <div className={styles.loginTrigger} onClick={() => { navigate('/dashboard'); setMenuOpen(false); }}>
                <FaUserCircle /> Dashboard
              </div>
            ) : (
              <div className={styles.loginTrigger} onClick={() => { navigate('/signup'); setMenuOpen(false); }}>
                <FaUserCircle /> Sign In
              </div>
            )}
          </div>
        </nav>
      </div>

      <div className={styles.headerRight}>
        <div className={styles.headerSearch}>
          <FaSearch className={styles.searchIcon} />
          <input type="text" placeholder="Search luxury cars..." />
        </div>

        <div className={styles.loginTrigger}>
          {user ? (
            <div className={styles.profileAvatarMini} onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
              {user.user_metadata?.firstname?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              
              {profileMenuOpen && (
                <div className={styles.dropdownMenuHeader}>
                  <div className={styles.dropdownItem} onClick={() => { navigate('/dashboard'); setProfileMenuOpen(false); }}>
                    <FaUser /> Studio
                  </div>
                  <div className={styles.dropdownDivider}></div>
                  <div className={`${styles.dropdownItem} ${styles.logoutItem}`} onClick={handleLogout}>
                    <FaSignOutAlt /> Log Out
                  </div>
                </div>
              )}
            </div>
          ) : (
             <div className={styles.loginBtnContainer} onClick={() => navigate('/signup')}>
               <span className={styles.loginText}>LOG IN</span>
               <FaUserCircle className={styles.loginIcon} />
             </div>
          )}
        </div>

        <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
    </header>
  );
};

export default AuctionHeader;
