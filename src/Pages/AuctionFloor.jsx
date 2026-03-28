import React, { useState, useEffect } from 'react';
import { supabase } from '../Modules/SupabaseClient';
import AuctionHeader from '../Modules/AuctionHeader';
import AuctionCard from '../Modules/AuctionCard';
import styles from './AuctionFloor.module.css';
import { FaTimes } from 'react-icons/fa';

const AuctionFloor = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(10000000);
    const [minYear, setMinYear] = useState(1980);
    const [maxYear, setMaxYear] = useState(2026);
    const [sortBy, setSortBy] = useState('high-to-low');
    const [showSortMenu, setShowSortMenu] = useState(false);

    const resetFilters = () => {
        setSelectedBrands([]);
        setMinPrice(0);
        setMaxPrice(10000000);
        setMinYear(1980);
        setMaxYear(2026);
        setSortBy('high-to-low');
    };

    const toggleBrand = (brand) => {
        if (brand === 'All Brands') {
            setSelectedBrands([]);
        } else {
            setSelectedBrands(prev => 
                prev.includes(brand) 
                ? prev.filter(b => b !== brand) 
                : [...prev, brand]
            );
        }
    };

    useEffect(() => {
        const fetchAllListings = async () => {
            try {
                const { data, error } = await supabase
                    .from('listings')
                    .select('*, likes(count), comments(count)');

                if (error) throw error;
                setListings(data || []);
            } catch (err) {
                console.error('Error fetching auction items:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllListings();
    }, []);

    return (
        <div className={styles.container}>
            <AuctionHeader />

            <main className={styles.mainContent}>
                <div className={styles.heroSection}>
                    <span className={styles.liveIndicator}>
                        <div className={styles.pulseDot}></div> LIVE GLOBAL BIDDING
                    </span>
                    <h1 className={styles.heroTitle}>THE AUCTION <span>FLOOR</span></h1>
                    
                    <div className={styles.controls}>
                        <div className={styles.sortDropdownWrap}>
                            <button className={styles.sortBtn} onClick={() => setShowSortMenu(!showSortMenu)}>
                                SORT: {sortBy.replace(/-/g, ' ').toUpperCase()}
                            </button>
                            {showSortMenu && (
                                <div className={styles.sortMenu}>
                                    <div className={styles.sortMenuItem} onClick={() => { setSortBy('high-to-low'); setShowSortMenu(false); }}>Highest Price</div>
                                    <div className={styles.sortMenuItem} onClick={() => { setSortBy('low-to-high'); setShowSortMenu(false); }}>Lowest Price</div>
                                    <div className={styles.sortMenuItem} onClick={() => { setSortBy('newest'); setShowSortMenu(false); }}>Newest First</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.layoutBody}>
                    {/* Sidebar Filters - Static Placeholders */}
                    {showMobileFilters && <div className={styles.overlay} onClick={() => setShowMobileFilters(false)}></div>}
                    <aside className={`${styles.sidebar} ${showMobileFilters ? styles.sidebarOpen : ''}`}>
                        <div className={styles.filterSection}>
                            <div className={styles.sidebarHeader}>
                                <h4 className={styles.sectionTitle}>BRANDS</h4>
                                <FaTimes className={styles.closeSidebar} onClick={() => setShowMobileFilters(false)} />
                            </div>
                            <div 
                                className={`${styles.filterItem} ${selectedBrands.length === 0 ? styles.activeFilter : ''}`}
                                onClick={() => toggleBrand('All Brands')}
                            >
                                All Brands <span className={styles.count}>{listings.length}</span>
                            </div>
                            {[...new Set(listings.map(l => l.Make))].sort().map(brand => (
                                <div 
                                    key={brand} 
                                    className={`${styles.filterItem} ${selectedBrands.includes(brand) ? styles.activeFilter : ''}`}
                                    onClick={() => toggleBrand(brand)}
                                >
                                    {brand} <span className={styles.count}>
                                        {listings.filter(l => l.Make === brand).length}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className={styles.filterSection}>
                            <h4 className={styles.sectionTitle}>PRICE RANGE (R)</h4>
                            <div className={styles.priceInputs}>
                                <div className={styles.priceInputBox}>
                                    <label>Min</label>
                                    <input type="number" value={minPrice} onChange={(e) => setMinPrice(Number(e.target.value))} />
                                </div>
                                <div className={styles.priceInputBox}>
                                    <label>Max</label>
                                    <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
                                </div>
                            </div>
                        </div>

                        <div className={styles.filterSection}>
                            <h4 className={styles.sectionTitle}>PERIOD</h4>
                            <div className={styles.yearFilterWrap}>
                                <div className={styles.yearSelectBox}>
                                    <label>From</label>
                                    <select value={minYear} onChange={(e) => setMinYear(Number(e.target.value))}>
                                        {Array.from({ length: 47 }, (_, i) => 1980 + i).map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div className={styles.yearSelectBox}>
                                    <label>To</label>
                                    <select value={maxYear} onChange={(e) => setMaxYear(Number(e.target.value))}>
                                        {Array.from({ length: 47 }, (_, i) => 1980 + i).reverse().map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className={styles.sidebarActions}>
                            <button className={styles.resetBtn} onClick={resetFilters}>RESET ALL FILTERS</button>
                        </div>
                    </aside>

                    {/* Auction Grid */}
                    <div className={styles.contentArea}>
                        {loading ? (
                            <div className={styles.loader}>Initializing Auction Floor...</div>
                        ) : listings.length === 0 ? (
                            <div className={styles.loader}>No active lots found. Check back soon.</div>
                        ) : (
                            <div className={styles.auctionGrid}>
                                {listings
                                    .filter(l => {
                                        const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(l.Make);
                                        const priceMatch = (l.CurrentPrice || 0) >= minPrice && (l.CurrentPrice || 0) <= maxPrice;
                                        const yearMatch = l.Year >= minYear && l.Year <= maxYear;
                                        return brandMatch && priceMatch && yearMatch;
                                    })
                                    .sort((a, b) => {
                                        if (sortBy === 'high-to-low') return (b.CurrentPrice || 0) - (a.CurrentPrice || 0);
                                        if (sortBy === 'low-to-high') return (a.CurrentPrice || 0) - (b.CurrentPrice || 0);
                                        if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
                                        return 0;
                                    })
                                    .map((item) => (
                                        <AuctionCard key={item.id} listing={item} />
                                    ))
                                }
                            </div>
                        )}
                        
                        <div className={styles.paginationArea}>
                            <button className={styles.revealBtn}>REVEAL MORE LOTS</button>
                        </div>
                    </div>
                </div>
            </main>

            <footer className={styles.footer}>
                <div className={styles.footerInner}>
                    <div className={styles.footerBrand}>
                        <h3>CHRONOGRAPH</h3>
                        <p>The world's most exclusive digital auction house for rare automotive pieces and engineering marvels. Curated with precision, sold with authority.</p>
                    </div>
                    <nav className={styles.footerNav}>
                        <span>PRIVACY POLICY</span>
                        <span>TERMS OF SERVICE</span>
                        <span>CONTACT SUPPORT</span>
                        <span>PRESS KIT</span>
                        <span>COOKIE SETTINGS</span>
                    </nav>
                </div>
                <div className={styles.footerCopyright}>
                    © 2024 CHRONOGRAPH AUTOMOTIVE EDITORIAL. ALL RIGHTS RESERVED.
                </div>
            </footer>
        </div>
    );
};

export default AuctionFloor;
