import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../Modules/SupabaseClient';
import DashboardLayout from '../Modules/DashboardLayout';
import OverviewCards from '../Modules/OverviewCards';
import ActiveListings from '../Modules/ActiveListings';
import styles from './Dashboard.module.css';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const getDashboardData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          navigate('/signup');
          return;
        }

        setUser(user);

        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select('*')
          .eq('userid', user.id)
          .order('created_at', { ascending: false });

        if (listingsError) throw listingsError;
        setListings(listingsData || []);

      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    getDashboardData();
  }, [navigate]);

  const filteredListings = listings.filter(item => {
    const searchStr = searchTerm.toLowerCase();
    return (
      item.Make.toLowerCase().includes(searchStr) ||
      item.Model.toLowerCase().includes(searchStr) ||
      item.Year.toString().includes(searchStr)
    );
  });

  if (loading) {
    return (
      <DashboardLayout user={user} searchTerm={searchTerm} onSearch={setSearchTerm}>
        <div className={styles.loadingContainer}>
          <p>Loading your overview...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} searchTerm={searchTerm} onSearch={setSearchTerm}>
      <div className={styles.dashboardRoot}>
        <div className={styles.titleArea}>
          <div>
            <h1 className={styles.pageTitle}>
              Welcome back, {user?.user_metadata?.firstname || user?.email?.split('@')?.[0] || 'Guest'}!
            </h1>
            <p className={styles.pageSubtitle}>
              Here's what's happening with your inventory today.
            </p>
          </div>
        </div>

        <OverviewCards listings={listings} />

        <div className={styles.middleSection}>
          <ActiveListings listings={filteredListings} />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;