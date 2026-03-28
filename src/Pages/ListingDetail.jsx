import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../Modules/SupabaseClient';
import styles from './ListingDetail.module.css';
import { FaBookmark, FaShareAlt, FaShieldAlt, FaThumbsUp, FaFire, FaTimes, FaBars } from 'react-icons/fa';
import AuthPromptModal from '../Modules/AuthPromptModal';
import LoadingScreen from '../Modules/LoadingScreen';
import BidConfirmToast from '../Modules/BidConfirmToast';

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [bidError, setBidError] = useState('');

  // New Table States
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [heatCount, setHeatCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [bidHistory, setBidHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authPrompt, setAuthPrompt] = useState({ visible: false, message: '' });
  const [bidConfirm, setBidConfirm] = useState(null); // { amount, listingName }

  const showAuthPrompt = (message) => setAuthPrompt({ visible: true, message });
  const closeAuthPrompt = () => setAuthPrompt({ visible: false, message: '' });

  useEffect(() => {
    const fetchListing = async () => {
      // Check auth status so they can use the app headers
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Fetch the specific listing
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setListing(data);
        // Pre-fill input block slightly above current price
        const nextIncrement = (data.CurrentPrice || data.StartingPrice || 0) + 1000;
        setBidAmount(nextIncrement.toString());
      }

      const listingId = Number(id);

      // Fetch Likes
      const { data: likesData, error: likesError } = await supabase.from('likes').select('*').eq('listing_id', listingId);
      if (likesError) console.error('Error fetching likes:', likesError);
      
      if (likesData) {
        setHeatCount(likesData.length);
        if (user) {
          setIsLiked(likesData.some(l => l.userid === user.id));
        } else {
          setIsLiked(false);
        }
      } else {
        setHeatCount(0);
        setIsLiked(false);
      }

      // Fetch Bookmarks
      if (user) {
        const { data: bookmarkData, error: bookmarkError } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('listing_id', listingId)
          .eq('userid', user.id);
          
        if (bookmarkError) console.error('Error fetching bookmarks:', bookmarkError);
        setIsBookmarked(bookmarkData && bookmarkData.length > 0);
      } else {
        setIsBookmarked(false);
      }

      // Fetch Comments
      const { data: cxData, error: cxError } = await supabase
        .from('comments')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });
      if (cxError) console.error('Error fetching comments:', cxError);
      if (cxData) setComments(cxData);

      // Fetch Bid History
      const { data: bxData, error: bxError } = await supabase
        .from('bid_history')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });
      if (bxError) console.error('Error fetching bid history:', bxError);
      if (bxData) setBidHistory(bxData);

      setLoading(false);
    };
    fetchListing();

    // Setup Supabase Realtime Subscription for this specific row!
    const subscription = supabase
      .channel('public:listings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'listings', filter: `id=eq.${id}` }, payload => {
        console.log("Realtime Update Received!", payload);
        if (payload.new) {
          setListing(payload.new);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [id]);

  const toggleBookmark = async () => {
    if (!user) return showAuthPrompt('Log in to save this vehicle to your watchlist.');
    const listingId = Number(id);
    try {
      if (isBookmarked) {
        const { error } = await supabase.from('bookmarks').delete().eq('listing_id', listingId).eq('userid', user.id);
        if (error) {
          console.error('Delete Bookmark Error', error);
          alert("Could not remove bookmark. Check database permissions.");
          return;
        }
        setIsBookmarked(false);
      } else {
        const { error } = await supabase.from('bookmarks').insert({ listing_id: listingId, userid: user.id });
        if (error) {
          console.error('Insert Bookmark Error', error);
          alert("Could not save bookmark: " + error.message);
          return;
        }
        setIsBookmarked(true);
        // Notify Owner
        sendNotification('bookmark', `followed your ${listing.Year} ${listing.Make} ${listing.Model}`);
      }
    } catch(err) { console.error('Bookmark Exception', err); }
  };

  const toggleHeat = async () => {
    if (!user) return showAuthPrompt('Log in to show some heat on this listing.');
    const listingId = Number(id);
    try {
      if (isLiked) {
        const { error } = await supabase.from('likes').delete().eq('listing_id', listingId).eq('userid', user.id);
        if (error) {
          console.error('Delete Heat Error', error);
          alert("Could not remove heat. Check database permissions.");
          return;
        }
        setIsLiked(false);
        setHeatCount(h => Math.max(0, h - 1));
      } else {
        const { error } = await supabase.from('likes').insert({ listing_id: listingId, userid: user.id });
        if (error) {
          console.error('Insert Heat Error', error);
          alert("Could not save heat: " + error.message);
          return;
        }
        setIsLiked(true);
        setHeatCount(h => h + 1);
        // Notify Owner
        sendNotification('like', `liked your ${listing.Year} ${listing.Make} ${listing.Model}`);
      }
    } catch(err) { console.error('Heat Exception', err); }
  };

  const sendNotification = async (type, message) => {
    if (!listing || !user) return;
    // Don't notify yourself of your own actions
    if (listing.userid === user.id) return;

    try {
      // Fetch the user's real name from the users table
      let userName = 'Someone';
      const { data: profileData } = await supabase
        .from('users')
        .select('firstname, lastname')
        .eq('id', user.id)
        .single();

      if (profileData?.firstname) {
        userName = profileData.firstname;
        if (profileData.lastname) userName += ` ${profileData.lastname}`;
      } else {
        // Fallback: use the part before @ in their email
        userName = user.email?.split('@')[0] || 'Someone';
      }

      await supabase.from('notifications').insert({
        recipient_id: listing.userid,
        actor_id: user.id,
        listing_id: Number(id),
        type: type,
        message: `${userName} ${message}`,
        is_read: false
      });
    } catch (err) {
      console.error('Notification Error:', err);
    }
  };

  const postComment = async () => {
    if (!user) return showAuthPrompt('Log in to join the discussion on this vehicle.');
    if (!newComment.trim()) return;
    try {
      const { data, error } = await supabase.from('comments').insert({
        listing_id: Number(id),
        userid: user.id,
        content: newComment
      }).select().single();
      
      if (error) throw error;
      
      setComments(prev => [data, ...prev]);
      setNewComment('');
      
      // Notify Owner
      sendNotification('comment', `posted a comment on your ${listing.Year} ${listing.Make} ${listing.Model}`);
      
    } catch(err) { alert(err.message); }
  };

  const handlePlaceBid = async () => {
    if (!user) {
      showAuthPrompt('You need to be logged in to place a bid on this vehicle.');
      return;
    }

    const proposedBid = parseFloat(bidAmount);
    const currentHighest = listing.CurrentPrice || listing.StartingPrice || 0;

    if (isNaN(proposedBid) || proposedBid <= currentHighest) {
      setBidError(`Minimum bid must exceed ${formatZAR(currentHighest)}`);
      return;
    }

    setBidError('');
    setBidding(true);
    try {
      // ─── Find the previous highest bidder BEFORE we update ───
      const { data: prevBidData } = await supabase
        .from('bid_history')
        .select('userid, amount')
        .eq('listing_id', parseInt(id, 10))
        .neq('userid', user.id) // not the current bidder
        .order('amount', { ascending: false })
        .limit(1)
        .maybeSingle();

      const prevLeaderId = prevBidData?.userid ?? null;
      const prevLeaderAmount = prevBidData?.amount ?? null;

      const { error } = await supabase
        .from('listings')
        .update({
          CurrentPrice: proposedBid,
          NumberOfBids: (listing.NumberOfBids || 0) + 1
        })
        .eq('id', id);

      if (error) throw error;

      // Log the bid history natively
      const { data: newBidRow, error: logErr } = await supabase.from('bid_history').insert({
        listing_id: parseInt(id, 10),
        userid: user.id,
        amount: proposedBid
      }).select().single();

      if (!logErr && newBidRow) {
        setBidHistory(prev => [newBidRow, ...prev]);
      }
      
      // Update local state instantly
      setListing(prev => ({ 
        ...prev, 
        CurrentPrice: proposedBid, 
        NumberOfBids: (prev.NumberOfBids || 0) + 1 
      }));
      setBidAmount((proposedBid + 1000).toString());

      // Show confirmation toast
      setBidConfirm({
        amount: proposedBid,
        listingName: `${listing.Year} ${listing.Make} ${listing.Model}`
      });

      // ─── Fetch the new bidder's name for the outbid notification ───
      let newBidderName = user.email?.split('@')[0] || 'Another bidder';
      const { data: newBidderProfile } = await supabase
        .from('users')
        .select('firstname, lastname')
        .eq('id', user.id)
        .single();

      if (newBidderProfile?.firstname) {
        newBidderName = newBidderProfile.firstname;
        if (newBidderProfile.lastname) newBidderName += ` ${newBidderProfile.lastname}`;
      }

      const vehicleName = `${listing.Year} ${listing.Make} ${listing.Model}`;
      const formatLocal = (n) =>
        new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(n || 0);

      // ─── Notify previous highest bidder they've been outbid ───
      if (prevLeaderId && prevLeaderId !== listing.userid) {
        await supabase.from('notifications').insert({
          recipient_id: prevLeaderId,
          actor_id: user.id,
          listing_id: Number(id),
          type: 'outbid',
          message: `You've been outbid on the ${vehicleName}! ${newBidderName} placed ${formatLocal(proposedBid)}, beating your ${formatLocal(prevLeaderAmount)}.`,
          is_read: false
        });
      }

      // Notify Owner
      sendNotification('bid', `placed a bid of ${formatLocal(proposedBid)} on your ${vehicleName}`);

    } catch (err) {
      alert("Error placing bid: " + err.message);
    } finally {
      setBidding(false);
    }
  };

  const formatZAR = (amount) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  if (loading) return <LoadingScreen message="Loading vehicle details..." />;
  if (!listing) return <div style={{color:'white', padding: '40px', textAlign: 'center'}}>Vehicle not found.</div>;

  return (
    <div className={styles.pageWrapper}>
      {/* Auth Prompt Modal */}
      {authPrompt.visible && (
        <AuthPromptModal message={authPrompt.message} onClose={closeAuthPrompt} />
      )}

      {/* Bid Confirmation Toast */}
      {bidConfirm && (
        <BidConfirmToast
          amount={bidConfirm.amount}
          listingName={bidConfirm.listingName}
          onClose={() => setBidConfirm(null)}
        />
      )}

      {/* Header Area */}
      <header className={styles.header}>
        <div className={styles.headerLeftMobile}>
          <button className={styles.menuToggle} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
          <div className={styles.brand} onClick={() => navigate('/dashboard')} style={{cursor: 'pointer'}}>PRECISION</div>
        </div>
        
        <nav className={`${styles.navLinks} ${menuOpen ? styles.navOpen : ''}`}>
          <span className={styles.active}>Browse</span>
          <span>How it Works</span>
          <span onClick={() => navigate('/my-listings')}>My Inventory</span>
        </nav>

        <div className={styles.headerRight}>
          <span>Menu</span>
          <div style={{width: '28px', height: '28px', backgroundColor: '#374151', borderRadius: '50%'}}></div>
        </div>
      </header>

      <div className={styles.mainContainer}>
        {/* Title Block */}
        <div className={styles.breadcrumbs}>
          AUCTIONS &rsaquo; MODERN CLASSICS &rsaquo; LOT #{listing.id.toString().padStart(4, '0')}
        </div>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{listing.Make} <span>{listing.Model}</span></h1>
          <div className={styles.actionIcons}>
            <div className={styles.heatWrap}>
              <button className={`${styles.iconBtn} ${isLiked ? styles.heatActive : ''}`} onClick={toggleHeat}>
                <FaFire />
              </button>
              <span className={styles.heatCount}>{heatCount}</span>
            </div>
            <button className={`${styles.iconBtn} ${isBookmarked ? styles.bookmarked : ''}`} onClick={toggleBookmark}><FaBookmark /></button>
            <button className={styles.iconBtn}><FaShareAlt /></button>
          </div>
        </div>

        {/* 3-Image Gallery */}
        <div className={styles.galleryGrid}>
          <div className={styles.mainImageContainer}>
            <div className={styles.liveBadge}><div className={styles.dot}></div> LIVE AUCTION</div>
            <img src={listing.ImageURL} alt={listing.Model} className={styles.mainImage} />
          </div>
          <div className={styles.sideImages}>
            <div className={styles.sideImgWrap}>
              {/* Using a generic high quality detail placeholder */}
              <img src="https://images.unsplash.com/photo-1549405615-56037f00dd66?auto=format&fit=crop&q=80&w=400" className={styles.mainImage} alt="Details" />
            </div>
            <div className={styles.sideImgWrap}>
              <img src="https://images.unsplash.com/photo-1608779947872-dd320d4f3b57?auto=format&fit=crop&q=80&w=400" className={styles.mainImage} alt="Interior" />
              <div className={styles.moreOverlay}>+24 MORE</div>
            </div>
          </div>
        </div>

        {/* Specs Banner */}
        <div className={styles.specsBanner}>
          <div className={styles.specBlock}>
            <span className={styles.specLabel}>Year</span>
            <span className={styles.specValue}>{listing.Year}</span>
          </div>
          <div className={styles.specBlock}>
            <span className={styles.specLabel}>Mileage</span>
            <span className={styles.specValue}>1,240 mi</span>
          </div>
          <div className={styles.specBlock}>
            <span className={styles.specLabel}>Engine</span>
            <span className={styles.specValue}>4.0L H6</span>
          </div>
          <div className={styles.specBlock}>
            <span className={styles.specLabel}>Transmission</span>
            <span className={styles.specValue}>7-Spd PDK</span>
          </div>
        </div>

        {/* Content Layout */}
        <div className={styles.contentGrid}>
          
          {/* Left Column */}
          <div>
            <h2 className={styles.sectionTitle}>Curator's Note</h2>
            <p className={styles.curatorText}>
              This {listing.Year} {listing.Make} {listing.Model} is a masterpiece of aerodynamic engineering. Finished in 
              stunning paintwork over premium trim, this example features the high performance package which adds lightweight 
              wheels and exposed carbon fiber elements. Delivered new to the current owner, it has been maintained in a 
              climate-controlled facility with zero track time recorded.
            </p>

            <div className={styles.pitLaneHeader}>
              <h2 className={styles.sectionTitle} style={{margin: 0}}>The Pit Lane <span className={styles.commentCount}>({comments.length} Comments)</span></h2>
              <button className={styles.sortBtn}>&#8644; RECENT</button>
            </div>

            {/* Dynamic Comments mapped from Supabase `comments` table */}
            {comments.map(cx => (
              <div key={cx.id} className={styles.comment}>
                <div className={styles.avatar}>{(cx.userid || 'U').charAt(0).toUpperCase()}</div>
                <div className={styles.commentBody}>
                  <div className={styles.commentTop}>
                    <span className={styles.commentAuthor}>User_{cx.userid.substring(0,5)}</span>
                    <span className={styles.commentTime}>{new Date(cx.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className={styles.commentText}>{cx.content}</div>
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <p style={{color: '#9CA3AF', marginBottom: '32px', fontSize: '14px'}}>Be the first to start the discussion!</p>
            )}

            <div className={styles.commentInputBox}>
              <textarea 
                placeholder="Join the discussion..." 
                className={styles.commentTextArea}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              ></textarea>
              <button className={styles.postBtn} onClick={postComment}>POST COMMENT</button>
            </div>

          </div>

          {/* Right Column (Sidebar) */}
          <div>
            <div className={styles.bidPanel}>
              <div className={styles.bidHeaderRow}>
                <div className={styles.bidLabelGroup}>
                  <span className={styles.bidLabel}>Current Bid</span>
                  <h3 className={styles.bidAmount}>{formatZAR(listing.CurrentPrice || listing.StartingPrice)}</h3>
                </div>
                <div className={styles.bidLabelGroup} style={{textAlign: 'right'}}>
                  <span className={styles.bidLabel}>Time Left</span>
                  <span className={styles.timeLeft}>04d : 12h : 22m</span>
                </div>
              </div>

              <div className={styles.bidInputArea}>
                <span className={styles.maxBidLabel}>Enter Your Max Bid</span>
                <div className={styles.bidInputWrap}>
                  <span className={styles.currencySymbol}>R</span>
                  <input 
                    type="number" 
                    className={styles.bidInput} 
                    value={bidAmount}
                    onChange={(e) => {
                      setBidAmount(e.target.value);
                      if (bidError) setBidError('');
                    }}
                  />
                </div>
                {bidError && <div className={styles.bidErrorMsg}>{bidError}</div>}
                <button onClick={handlePlaceBid} disabled={bidding} className={styles.placeBidBtn}>
                  {bidding ? 'PROCESSING...' : 'PLACE BID'}
                </button>
              </div>

              <div className={styles.escrowNote}>
                <FaShieldAlt /> Escrow Protection Guaranteed
              </div>

              <h4 className={styles.activityHeader}>Latest Activity</h4>
              {bidHistory.length > 0 ? (
                bidHistory.slice(0, 3).map(bid => (
                  <div key={bid.id} className={styles.activityRow}>
                    <span className={styles.activityUser}>User_{bid.userid.substring(0,5)}</span>
                    <span>{formatZAR(bid.amount)}</span>
                  </div>
                ))
              ) : (
                <p style={{color: '#9CA3AF', fontSize: '12px'}}>No bids placed yet.</p>
              )}

              <button className={styles.viewHistory} onClick={() => setShowHistoryModal(true)}>VIEW FULL HISTORY</button>
            </div>
          </div>

        </div>
      </div>

      {/* Full Bid History Modal */}
      {showHistoryModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalTitle}>
              Bid History <button className={styles.closeBtn} onClick={() => setShowHistoryModal(false)}><FaTimes /></button>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px'}}>
              {bidHistory.map(bid => (
                <div key={bid.id} className={styles.activityRow} style={{fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px'}}>
                  <span className={styles.activityUser}>User_{bid.userid.substring(0,5)}</span>
                  <span style={{color: '#fff', fontWeight: 'bold'}}>{formatZAR(bid.amount)}</span>
                </div>
              ))}
              {bidHistory.length === 0 && <p style={{color: '#9CA3AF'}}>No bids yet.</p>}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ListingDetail;
