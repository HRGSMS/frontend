import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { guestApi, type AvailableRoom, type BranchItem, type HotelConfig } from '../api/guestApi';
import { FloatingContactButtonAuto } from '../components/FloatingContactButton';
import './LandingPage.css';

interface BranchStats extends BranchItem {
  minPrice: number;
  totalRooms: number;
  availableRooms: number;
  roomTypes: string[];
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [branchStats, setBranchStats] = useState<Record<string, BranchStats>>({});
  const [hotelConfig, setHotelConfig] = useState<HotelConfig | null>(null);

  // Date calculation utilities
  const today = new Date().toISOString().split('T')[0];
  const addDays = (dateStr: string, days: number): string => {
    try {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  };

  const defaultCheckout = addDays(today, 2);

  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [checkIn, setCheckIn] = useState<string>(today);
  const [checkOut, setCheckOut] = useState<string>(defaultCheckout);

  // Synchronize check-in and check-out so check-out is always strictly after check-in
  const handleCheckInChange = (newIn: string) => {
    setCheckIn(newIn);
    if (!checkOut || new Date(checkOut) <= new Date(newIn)) {
      setCheckOut(addDays(newIn, 2));
    }
  };

  const handleCheckOutChange = (newOut: string) => {
    if (new Date(newOut) <= new Date(checkIn)) {
      setCheckOut(addDays(checkIn, 1));
      return;
    }
    setCheckOut(newOut);
  };

  useEffect(() => {
    // Connect with live database room inventory and hotel configuration
    Promise.allSettled([
      guestApi.getRooms(),
      guestApi.getHotelConfig(),
    ]).then(([roomsRes, cfgRes]) => {
      if (cfgRes.status === 'fulfilled') {
        setHotelConfig(cfgRes.value);
      }

      if (roomsRes.status === 'fulfilled') {
        const rooms: AvailableRoom[] = roomsRes.value;

        // Derive branches directly from database room inventory
        const derivedBranches: BranchItem[] = Array.from(
          new Map(
            rooms.map((r) => [
              r.branch_public_id,
              {
                public_id: r.branch_public_id,
                name: r.branch_name,
                location_city: r.branch_name.replace('SkyNest ', ''),
              },
            ]),
          ).values(),
        );

        setBranches(derivedBranches);

        // Aggregate stats per branch (lowest price, total rooms, types)
        const stats: Record<string, BranchStats> = {};
        for (const b of derivedBranches) {
          const bRooms = rooms.filter((r) => r.branch_public_id === b.public_id);
          const prices = bRooms.map((r) => Number(r.daily_rate)).filter((p) => p > 0);
          const minP = prices.length > 0 ? Math.min(...prices) : 15000;
          const types = Array.from(new Set(bRooms.map((r) => r.type_name)));

          stats[b.public_id] = {
            ...b,
            minPrice: minP,
            totalRooms: bRooms.length,
            availableRooms: bRooms.filter((r) => r.booking_availability === 1).length,
            roomTypes: types,
          };
        }
        setBranchStats(stats);
      }
    });
  }, []);

  const handleSearchRooms = (e: React.FormEvent) => {
    e.preventDefault();
    const finalOut = new Date(checkOut) <= new Date(checkIn) ? addDays(checkIn, 1) : checkOut;
    const branchQuery = selectedBranch !== 'all' ? `&branch=${encodeURIComponent(selectedBranch)}` : '';
    navigate(`/rooms?from=${checkIn}&to=${finalOut}${branchQuery}`);
  };

  const getBranchDataByName = (keyword: string): BranchStats | undefined => {
    return Object.values(branchStats).find((b) =>
      b.name.toLowerCase().includes(keyword.toLowerCase()),
    );
  };

  const colomboData = getBranchDataByName('Colombo');
  const kandyData = getBranchDataByName('Kandy');
  const galleData = getBranchDataByName('Galle');

  const formatLkr = (amount: number) => `LKR ${Number(amount).toLocaleString('en-US')}`;

  return (
    <div className="lp-page">
      {/* ══ HEADER NAVIGATION ══ */}
      <header className="lp-header">
        <div className="lp-header-inner">
          <Link to="/" className="lp-brand">
            <span className="lp-monogram">
              {(hotelConfig?.hotel_name ?? 'SN').slice(0, 2).toUpperCase()}
            </span>
            <div className="lp-brand-text">
              <span className="lp-brand-name">
                {hotelConfig?.hotel_name ?? 'SkyNest Hotels'}
              </span>
              <span className="lp-brand-tagline">
                {hotelConfig?.hotel_tagline ?? 'Luxury Stays & Serenity'}
              </span>
            </div>
          </Link>

          <nav className="lp-nav-links" aria-label="Main Navigation">
            <a href="#destinations" className="lp-nav-link">Destinations</a>
            <Link to="/rooms" className="lp-nav-link">Suites & Rooms</Link>
            <a href="#experiences" className="lp-nav-link">Experiences</a>
            <a href="#portals" className="lp-nav-link">Portals</a>
          </nav>

          <div className="lp-header-ctas">
            <Link to="/rooms" className="lp-btn-outline">
              Browse Rooms
            </Link>
            <Link to="/login" className="lp-btn-primary">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* ══ HERO SECTION ══ */}
      <section className="lp-hero">
        <div className="lp-hero-content">
          <div className="lp-hero-eyebrow">
            <span>✦</span>
            <span>
              {branches.length > 0
                ? `${branches.length} Destinations Across Sri Lanka`
                : 'Exquisite Hospitality Across Sri Lanka'}
            </span>
            <span>✦</span>
          </div>

          <h1 className="lp-hero-title">
            Where Timeless Luxury Meets <em>Serene Paradise</em>
          </h1>

          <p className="lp-hero-desc">
            {hotelConfig?.hotel_description ??
              'Immerse yourself in unrivaled elegance across our sanctuaries in Colombo, Kandy, and Galle. Bespoke suites, culinary artistry, and personalized guest service.'}
          </p>

          {/* Quick Booking Strip — Connected to Live Database */}
          <form onSubmit={handleSearchRooms} className="lp-search-strip">
            <div className="lp-search-group">
              <label className="lp-search-label">Destination</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="lp-search-select"
              >
                <option value="all">
                  All Destinations {branches.length > 0 ? `(${branches.length} Locations)` : ''}
                </option>
                {branches.map((b) => (
                  <option key={b.public_id} value={b.public_id}>
                    {b.name} ({b.location_city})
                  </option>
                ))}
              </select>
            </div>

            <div className="lp-search-group">
              <label className="lp-search-label">Check-In</label>
              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => handleCheckInChange(e.target.value)}
                className="lp-search-input"
                required
              />
            </div>

            <div className="lp-search-group">
              <label className="lp-search-label">Check-Out</label>
              <input
                type="date"
                min={addDays(checkIn, 1)}
                value={checkOut}
                onChange={(e) => handleCheckOutChange(e.target.value)}
                className="lp-search-input"
                required
              />
            </div>

            <button type="submit" className="lp-search-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Find Rooms</span>
            </button>
          </form>

          {/* Direct CTA Buttons */}
          <div className="lp-hero-actions">
            <Link to="/rooms" className="lp-btn-primary" style={{ padding: '12px 28px', fontSize: '14px' }}>
              Explore All Accommodations →
            </Link>
            <Link to="/login" className="lp-btn-outline" style={{ padding: '12px 28px', fontSize: '14px' }}>
              Guest & Staff Portal Access
            </Link>
          </div>
        </div>
      </section>

      {/* ══ DESTINATIONS SECTION (Mapped to Database Branches) ══ */}
      <section id="destinations" className="lp-section-destinations">
        <div className="lp-section-header">
          <p className="lp-section-eyebrow">Iconic Sanctuaries</p>
          <h2 className="lp-section-title">
            Discover Our {branches.length > 0 ? branches.length : 3} Premier Locations
          </h2>
          <p className="lp-section-desc">
            From cosmopolitan oceanfront high-rises to misty mountain hideaways and historic colonial ramparts, each SkyNest hotel offers an unforgettable sense of place.
          </p>
        </div>

        <div className="lp-destinations-grid">
          {/* Colombo */}
          <article className="lp-destination-card">
            <div className="lp-dest-image-wrap">
              <img
                src="/images/login1.jpg"
                alt="SkyNest Colombo Oceanfront"
                className="lp-dest-image"
              />
              <span className="lp-dest-badge">Metropolitan Elegance</span>
            </div>
            <div className="lp-dest-body">
              <h3 className="lp-dest-name">SkyNest Colombo</h3>
              <p className="lp-dest-desc">
                Urban oceanfront sanctuary in the capital. Panoramic Indian Ocean views, rooftop infinity lounge, and premier access to luxury shopping and commerce.
              </p>
              <div className="lp-dest-meta">
                <span className="lp-dest-price">
                  From <strong>{colomboData ? formatLkr(colomboData.minPrice) : 'LKR 15,000'}</strong> / night
                </span>
                <Link
                  to={
                    colomboData
                      ? `/rooms?branch=${colomboData.public_id}&from=${checkIn}&to=${checkOut}`
                      : '/rooms'
                  }
                  className="lp-dest-link"
                >
                  View Suites →
                </Link>
              </div>
            </div>
          </article>

          {/* Kandy */}
          <article className="lp-destination-card">
            <div className="lp-dest-image-wrap">
              <img
                src="/images/login2.jpg"
                alt="SkyNest Kandy Hillside Retreat"
                className="lp-dest-image"
              />
              <span className="lp-dest-badge">Highland Sanctuary</span>
            </div>
            <div className="lp-dest-body">
              <h3 className="lp-dest-name">SkyNest Kandy</h3>
              <p className="lp-dest-desc">
                Nestled amidst misty central highlands and lush rainforests. Authentic cultural serenity, mountain-view balconies, and serene tea estate tours.
              </p>
              <div className="lp-dest-meta">
                <span className="lp-dest-price">
                  From <strong>{kandyData ? formatLkr(kandyData.minPrice) : 'LKR 15,000'}</strong> / night
                </span>
                <Link
                  to={
                    kandyData
                      ? `/rooms?branch=${kandyData.public_id}&from=${checkIn}&to=${checkOut}`
                      : '/rooms'
                  }
                  className="lp-dest-link"
                >
                  View Suites →
                </Link>
              </div>
            </div>
          </article>

          {/* Galle */}
          <article className="lp-destination-card">
            <div className="lp-dest-image-wrap">
              <img
                src="/images/login2.jpg"
                alt="SkyNest Galle Coastal Sanctuary"
                className="lp-dest-image"
              />
              <span className="lp-dest-badge">Colonial Coast</span>
            </div>
            <div className="lp-dest-body">
              <h3 className="lp-dest-name">SkyNest Galle</h3>
              <p className="lp-dest-desc">
                Heritage-inspired coastal resort along golden southern sands. Steps from the historic Dutch Fort, offering private plunge pools and seafood dining.
              </p>
              <div className="lp-dest-meta">
                <span className="lp-dest-price">
                  From <strong>{galleData ? formatLkr(galleData.minPrice) : 'LKR 15,000'}</strong> / night
                </span>
                <Link
                  to={
                    galleData
                      ? `/rooms?branch=${galleData.public_id}&from=${checkIn}&to=${checkOut}`
                      : '/rooms'
                  }
                  className="lp-dest-link"
                >
                  View Suites →
                </Link>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* ══ EXPERIENCES & SIGNATURE AMENITIES ══ */}
      <section id="experiences" className="lp-section-amenities">
        <div className="lp-section-header">
          <p className="lp-section-eyebrow">Signature Hospitality</p>
          <h2 className="lp-section-title">The SkyNest Standard of Excellence</h2>
          <p className="lp-section-desc">
            Every moment is curated to elevate your stay beyond expectation.
          </p>
        </div>

        <div className="lp-amenities-grid">
          <div className="lp-amenity-card">
            <div className="lp-amenity-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" />
                <line x1="10" y1="1" x2="10" y2="4" />
                <line x1="14" y1="1" x2="14" y2="4" />
              </svg>
            </div>
            <h3 className="lp-amenity-title">Bespoke Dining</h3>
            <p className="lp-amenity-desc">
              From in-suite gourmet breakfast to Michelin-caliber multi-course dinners crafted with organic Ceylon spices and fresh coastal catches.
            </p>
          </div>

          <div className="lp-amenity-card">
            <div className="lp-amenity-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h3 className="lp-amenity-title">24/7 Digital Concierge</h3>
            <p className="lp-amenity-desc">
              Order room amenities, schedule airport chauffeurs, and manage bill settlements effortlessly through our guest portal.
            </p>
          </div>

          <div className="lp-amenity-card">
            <div className="lp-amenity-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 12h20M2 17h20M2 7h20" />
              </svg>
            </div>
            <h3 className="lp-amenity-title">Holistic Wellness & Spa</h3>
            <p className="lp-amenity-desc">
              Traditional Ayurvedic wellness treatments, steam sanctuaries, and state-of-the-art fitness suites in every branch.
            </p>
          </div>

          <div className="lp-amenity-card">
            <div className="lp-amenity-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3 className="lp-amenity-title">Express Secure Reservation</h3>
            <p className="lp-amenity-desc">
              Lock in your preferred suites with flexible deposit options, instant SMS confirmations, and dedicated arrival coordination.
            </p>
          </div>
        </div>
      </section>

      {/* ══ DIRECT PORTAL ACCESS CALLOUT ══ */}
      <section id="portals" className="lp-section-portals">
        <div className="lp-portal-box">
          <p className="lp-section-eyebrow" style={{ color: 'var(--lp-gold-light)' }}>Online Access</p>
          <h2 className="lp-portal-title">Seamless Management for Guests and Hospitality Staff</h2>
          <p className="lp-portal-desc">
            Access your stay records, settle reservation balances, request in-room services, or sign in to hotel operational management.
          </p>

          <div className="lp-portal-actions">
            <Link to="/login" className="lp-btn-primary" style={{ padding: '14px 32px', fontSize: '14px' }}>
              Enter SkyNest Portal (Sign In) →
            </Link>
            <Link to="/login?tab=register" className="lp-btn-outline" style={{ padding: '14px 32px', fontSize: '14px' }}>
              Register as New Guest
            </Link>
            <Link to="/rooms" className="lp-btn-outline" style={{ padding: '14px 32px', fontSize: '14px' }}>
              Browse Available Rooms
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER (Connected to Database Hotel Settings) ══ */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <div className="lp-brand">
                <span className="lp-monogram">
                  {(hotelConfig?.hotel_name ?? 'SN').slice(0, 2).toUpperCase()}
                </span>
                <span className="lp-brand-name">
                  {hotelConfig?.hotel_name ?? 'SkyNest Hotels & Resorts'}
                </span>
              </div>
              <p>
                {hotelConfig?.hotel_tagline ??
                  'Dedicated to providing the highest level of comfort, luxury, and tranquility across Sri Lanka.'}
              </p>
            </div>

            <div className="lp-footer-links-col">
              <span className="lp-footer-heading">Navigation</span>
              <a href="#destinations" className="lp-footer-link">Our Destinations</a>
              <Link to="/rooms" className="lp-footer-link">Suites & Rooms</Link>
              <a href="#experiences" className="lp-footer-link">Experiences</a>
              <Link to="/login" className="lp-footer-link">Guest Portal Sign In</Link>
            </div>

            <div className="lp-footer-links-col">
              <span className="lp-footer-heading">Management & Staff</span>
              <Link to="/login" className="lp-footer-link">Front Desk Login</Link>
              <Link to="/login" className="lp-footer-link">Management Portal</Link>
              <Link to="/login" className="lp-footer-link">Admin Workspace</Link>
            </div>

            <div className="lp-footer-links-col">
              <span className="lp-footer-heading">Direct Concierge</span>
              <span className="lp-footer-link">Hotline: {hotelConfig?.hotline_number || '0760218879'}</span>
              <span className="lp-footer-link">Check-In: From {hotelConfig?.checkin_time || '14:00'}</span>
              <span className="lp-footer-link">Check-Out: By {hotelConfig?.checkout_time || '11:00'}</span>
              <span className="lp-footer-link">Head Office: Colombo 03, Sri Lanka</span>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <div className="lp-branches-pills">
              {branches.length > 0 ? (
                branches.map((b) => (
                  <span key={b.public_id} className="lp-branch-pill">
                    {b.name.toUpperCase()}
                  </span>
                ))
              ) : (
                <>
                  <span className="lp-branch-pill">COLOMBO</span>
                  <span className="lp-branch-pill">KANDY</span>
                  <span className="lp-branch-pill">GALLE</span>
                </>
              )}
            </div>

            <div>
              {hotelConfig?.copyright_text ?? '© 2026 SkyNest Hotels & Resorts. All rights reserved.'}
            </div>
          </div>
        </div>
      </footer>

      {/* Floating 24/7 Hotline Button */}
      <FloatingContactButtonAuto />
    </div>
  );
};

export default LandingPage;
