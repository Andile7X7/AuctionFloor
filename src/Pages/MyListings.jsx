import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../Modules/SupabaseClient';
import DashboardLayout from '../Modules/DashboardLayout';
import styles from './MyListings.module.css';
import { FaPen, FaTrashAlt } from 'react-icons/fa';

const MyListings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ id: null, Make: '', Model: '', StartingPrice: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    const fetchMyListings = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          navigate('/'); 
          return;
        }
        setUser(user);

        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .eq("userid", user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setListings(data || []);
      } catch (err) {
        console.error("Error fetching listings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyListings();
  }, [navigate]);

  const filteredListings = listings.filter(item => {
    const searchStr = searchQuery.toLowerCase();
    return (
      item.Make.toLowerCase().includes(searchStr) ||
      item.Model.toLowerCase().includes(searchStr) ||
      item.Year.toString().includes(searchStr)
    );
  });

  const handleDeleteClick = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', deleteConfirmId);

      if (error) throw error;
      
      // Update local state smoothly
      setListings(prev => prev.filter(item => item.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Failed to delete record:", err);
      alert("Error deleting listing: " + err.message);
    }
  };

  const openEditModal = (item) => {
    setEditData({
      id: item.id,
      Make: item.Make,
      Model: item.Model,
      StartingPrice: item.StartingPrice
    });
    setIsEditing(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const saveEdit = async () => {
    try {
      const priceNum = parseFloat(editData.StartingPrice);
      
      const { error } = await supabase
        .from('listings')
        .update({
          Make: editData.Make,
          Model: editData.Model,
          StartingPrice: priceNum
        })
        .eq('id', editData.id);

      if (error) throw error;

      // Update local state without refreshing page
      setListings(prev => prev.map(item => {
        if (item.id === editData.id) {
          return { ...item, Make: editData.Make, Model: editData.Model, StartingPrice: priceNum };
        }
        return item;
      }));

      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update record:", err);
      alert("Error updating listing: " + err.message);
    }
  };

  const formatZAR = (amount) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  return (
    <DashboardLayout user={user} searchTerm={searchQuery} onSearch={setSearchQuery}>
      <div className={styles.pageContainer}>
        
        <div className={styles.headerArea}>
          <div>
            <h1 className={styles.title}>My Vehicle Inventory</h1>
            <p className={styles.subtitle}>Manage your showroom, edit details, or remove sold vehicles.</p>
          </div>
        </div>

        {loading ? (
          <p style={{color: '#9CA3AF'}}>Loading inventory...</p>
        ) : listings.length === 0 ? (
          <p style={{color: '#9CA3AF'}}>You haven't listed any vehicles yet.</p>
        ) : (
          <div className={styles.grid}>
            {filteredListings.map(item => (
              <div key={item.id} className={styles.card} onClick={() => navigate(`/listing/${item.id}`)} style={{cursor: 'pointer'}}>
                <div className={styles.imageWrapper}>
                  <div className={styles.liveBadge}>LIVE</div>
                  <img src={item.ImageURL} alt={item.Model} className={styles.image} />
                </div>
                
                <div className={styles.cardBody}>
                  <h3 className={styles.carName}>{item.Year} {item.Make} {item.Model}</h3>
                  
                  <div className={styles.priceLabel}>ASKING PRICE</div>
                  <div className={styles.price}>{formatZAR(item.StartingPrice)}</div>
                  
                  <div className={styles.actions}>
                    <button onClick={(e) => { e.stopPropagation(); openEditModal(item); }} className={`${styles.actionBtn} ${styles.editBtn}`}>
                      <FaPen /> Edit
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(item.id); }} className={`${styles.actionBtn} ${styles.deleteBtn}`}>
                      <FaTrashAlt /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal Overlay */}
      {isEditing && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Update Listing</h2>
            
            <div className={styles.formGroup}>
              <label>Make</label>
              <input type="text" name="Make" value={editData.Make} onChange={handleEditChange} />
            </div>
            
            <div className={styles.formGroup}>
              <label>Model</label>
              <input type="text" name="Model" value={editData.Model} onChange={handleEditChange} />
            </div>
            
            <div className={styles.formGroup}>
              <label>Price (ZAR)</label>
              <input type="number" name="StartingPrice" value={editData.StartingPrice} onChange={handleEditChange} />
            </div>

            <div className={styles.modalActions}>
              <button className={styles.modalBtn} onClick={() => setIsEditing(false)}>Cancel</button>
              <button className={`${styles.modalBtn} ${styles.saveBtn}`} onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {deleteConfirmId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h2 className={styles.modalTitle} style={{ color: '#ef4444' }}>Delete Listing?</h2>
            <p style={{ color: '#9CA3AF', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
              Are you sure you want to permanently delete this vehicle? This action cannot be undone and will remove it entirely from your showroom.
            </p>
            <div className={styles.modalActions} style={{ justifyContent: 'center' }}>
              <button className={styles.modalBtn} onClick={() => setDeleteConfirmId(null)}>Cancel</button>
              <button className={`${styles.modalBtn} ${styles.dangerBtn}`} onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyListings;
