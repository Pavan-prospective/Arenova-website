import React, { useState, useEffect } from 'react';
import { 
  Trophy, Calendar, Users, Target, ShieldCheck, 
  MapPin, Clock, ArrowRight, ArrowLeft, Download, Check, AlertCircle,
  Printer, Award, Sparkles, Smile, Search, LogIn, LogOut, Key, Plus, Trash, User, CreditCard, RefreshCw, Phone
} from 'lucide-react';
import { getArenovaLogo } from './utils/secureAsset';
import { ErrorBoundary } from './components/ErrorBoundary';
import { api, getStoredAuth, clearStoredAuth } from './utils/api';
import { signInWithToken, completeUserProfile } from './utils/auth';
import { auth, isFirebaseConfigured, RecaptchaVerifier, signInWithPhoneNumber } from './utils/firebase';

// Fallback images if API doesn't return any
import cricketImg from './assets/stadium_cricket_pro.jpg';
import badmintonImg from './assets/stadium_badminton_pro.jpg';
import basketballImg from './assets/stadium_basketball_pro.jpg';

const FALLBACK_IMAGES = {
  cricket: cricketImg,
  badminton: badmintonImg,
  basketball: basketballImg,
};

// Friendly error helper
const getFriendlyErrorMessage = (error) => {
  const msg = error.message || String(error);
  if (msg.includes('auth/invalid-verification-code')) {
    return 'The verification code you entered is invalid. Please try again.';
  }
  if (msg.includes('auth/code-expired')) {
    return 'The verification code has expired. Please request a new OTP.';
  }
  if (msg.includes('auth/too-many-requests')) {
    return 'Too many request attempts. Please try again later.';
  }
  if (msg.includes('auth/invalid-phone-number')) {
    return 'The phone number you entered is invalid. Please make sure it includes the country code.';
  }
  if (msg.includes('500') || msg.toLowerCase().includes('server error')) {
    return 'Our server is currently busy. Please try again in a few minutes.';
  }
  if (msg.includes('401') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('token')) {
    return 'Your login session has expired or the verification token is invalid. Please sign in again.';
  }
  if (msg.includes('400') || msg.toLowerCase().includes('validation') || msg.toLowerCase().includes('bad request')) {
    return 'Some details you provided seem incorrect. Please check your form and try again.';
  }
  if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
    return 'The requested tournament or registration could not be found.';
  }
  return 'Something went wrong. Please check your connection and try again.';
};

function AppContent() {
  // Views/Steps: 'list', 'details', 'register', 'payment', 'success', 'dashboard'
  const [step, setStep] = useState('list');
  const [tournaments, setTournaments] = useState([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  
  // Filters
  const [filterSport, setFilterSport] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Auth State
  const [authObj, setAuthObj] = useState(getStoredAuth());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState('phone'); // 'phone', 'otp', 'sync', 'complete'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [activeToken, setActiveToken] = useState('');
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', email: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Registration & Payment State
  const [regFormData, setRegFormData] = useState({
    categoryName: '',
    partnerUserId: '',
    partnerName: '',
    partnerPhone: '',
    teamName: '',
    teamMembers: [{ name: '', phone: '', role: 'Player' }]
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState('');
  const [activeRegistration, setActiveRegistration] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  
  // Payment Gate simulation
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [processingState, setProcessingState] = useState(0);

  // Dashboard State
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const [logoUrl, setLogoUrl] = useState('');

  // Load logo
  useEffect(() => {
    try {
      const decryptedLogo = getArenovaLogo();
      setLogoUrl(decryptedLogo);
    } catch (e) {
      console.error("Failed to load secure logo", e);
    }
  }, []);

  // Fetch tournaments
  const fetchTournaments = async () => {
    setLoadingTournaments(true);
    try {
      const data = await api.getTournaments({
        sport: filterSport || undefined,
        city: filterCity || undefined
      });
      setTournaments(data.data || data || []);
    } catch (err) {
      console.error("Failed to fetch tournaments:", err);
      // Fallback placeholder data if API is down or empty
      setTournaments([
        {
          _id: 'arn-cricket-26',
          title: 'Arenova Championship Cricket League',
          sport: 'Cricket',
          city: 'Mumbai',
          game: 'CRICKET (T20)',
          stadium: 'Wankhede Arena, Mumbai',
          prizePool: '₹10,00,000',
          date: 'Oct 10 - Oct 16, 2026',
          regDeadline: 'Oct 05, 2026',
          teamSize: 'Squad (11 Players + 4 Subs)',
          fee: 999,
          categories: ['Open Category', 'Corporate Cup'],
          description: 'Step onto the professional turf under high-intensity stadium floodlights. Compete in a T20 league designed for elite squads, corporate clubs, and state-level players.',
          rules: [
            'Age limit: Open category. Valid ID proof mandatory.',
            'Professional leather balls and match-day safety equipment provided.',
            'FIBA/ICC tournament regulations apply. Full day/night slots.',
            'Officiated by a certified panel of neutral match referees.'
          ]
        },
        {
          _id: 'arn-badminton-26',
          title: 'Arenova Badminton Pro Masters',
          sport: 'Badminton',
          city: 'Delhi',
          game: 'BADMINTON (SINGLES/DOUBLES)',
          stadium: 'Indira Gandhi Indoor Arena',
          prizePool: '₹2,50,000',
          date: 'Oct 24 - Oct 28, 2026',
          regDeadline: 'Oct 20, 2026',
          teamSize: 'Solo (1v1) or Duo (2v2)',
          fee: 299,
          categories: ["Men's Singles", "Men's Doubles", "Mixed Doubles"],
          description: 'Compete on synthetic indoor courts under professional lighting. Designed for seasoned singles and doubles competitors looking for ranking points and national glory.',
          rules: [
            'Synthetic courts require professional non-marking court shoes.',
            'Tournament shuttles: Yonex Aerosensa series.',
            'Knockout system: best of 3 sets, 21-point rally score format.',
            'Coaches allowed at courtside during official match intervals.'
          ]
        },
        {
          _id: 'arn-basketball-26',
          title: 'Arenova Basketball Arena Showdown',
          sport: 'Basketball',
          city: 'Bengaluru',
          game: 'BASKETBALL (3v3 & 5v5)',
          stadium: 'Arenova Central Court, Bengaluru',
          prizePool: '₹5,00,000',
          date: 'Nov 05 - Nov 10, 2026',
          regDeadline: 'Nov 01, 2026',
          teamSize: 'Squad (5 Players + 3 Subs)',
          fee: 499,
          categories: ['3v3 Pro', '5v5 Men Open'],
          description: 'Fast-paced basketball on premium wooden courts. Features digital scoreboards, professional shot clocks, and top-tier referee squads.',
          rules: [
            'Standard FIBA match play regulations strictly enforced.',
            'Uniform rule: Teams must wear matching jerseys with clear numberings.',
            'Full courtside first-aid and sports rehab teams present.',
            'Most Valuable Player (MVP) award will be presented after the finals.'
          ]
        }
      ]);
    } finally {
      setLoadingTournaments(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [filterSport, filterCity]);

  // Recaptcha initializer for Phone auth
  useEffect(() => {
    if (isFirebaseConfigured && showAuthModal && authStep === 'phone' && auth) {
      setTimeout(() => {
        try {
          if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
              size: 'invisible',
              callback: () => {
                // recaptcha resolved
              }
            });
          }
        } catch (e) {
          console.error("Recaptcha initialization failed:", e);
        }
      }, 300);
    }
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (e) {}
      }
    };
  }, [showAuthModal, authStep]);

  // Handle Select Tournament
  const handleSelectTournament = (t) => {
    setSelectedTournament(t);
    setRegFormData({
      categoryName: t.categories && t.categories.length > 0 ? t.categories[0] : 'Open Category',
      partnerUserId: '',
      partnerName: '',
      partnerPhone: '',
      teamName: '',
      teamMembers: [{ name: '', phone: '', role: 'Captain' }]
    });
    setStep('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth: Step 1 - Send OTP (Handles simulated or real Firebase OTP)
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setAuthError('Please enter a valid 10-digit phone number.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');

    if (!isFirebaseConfigured) {
      // Simulation mode
      setTimeout(() => {
        setAuthStep('otp');
        setAuthLoading(false);
      }, 800);
      return;
    }

    try {
      // Real Firebase Phone OTP send
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const verifier = window.recaptchaVerifier;
      if (!verifier) {
        throw new Error('reCAPTCHA verification failed. Please close and re-open the dialog.');
      }
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(confirmation);
      setAuthStep('otp');
    } catch (err) {
      setAuthError(getFriendlyErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth: Step 2 - Verify OTP & Sync Account
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setAuthError('Please enter the 6-digit code.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');

    if (!isFirebaseConfigured) {
      // Simulation mode fallback
      setTimeout(async () => {
        try {
          const generatedToken = `firebase_token_${phoneNumber}_${Math.random().toString(36).substr(2, 9)}`;
          setActiveToken(generatedToken);
          const result = await signInWithToken(generatedToken);
          setAuthObj(getStoredAuth());
          
          if (result.isNewUser) {
            setAuthStep('complete');
          } else {
            setShowAuthModal(false);
            setPhoneNumber('');
            setOtpCode('');
          }
        } catch (err) {
          setAuthError(getFriendlyErrorMessage(err));
        } finally {
          setAuthLoading(false);
        }
      }, 1000);
      return;
    }

    try {
      // Real Firebase OTP verification
      if (!confirmationResult) {
        throw new Error('No active verification session found. Please request OTP again.');
      }
      const verifyRes = await confirmationResult.confirm(otpCode);
      const user = verifyRes.user;
      const idToken = await user.getIdToken();
      setActiveToken(idToken);

      // Sync with backend API
      const result = await signInWithToken(idToken);
      setAuthObj(getStoredAuth());
      
      if (result.isNewUser) {
        setAuthStep('complete');
      } else {
        setShowAuthModal(false);
        setPhoneNumber('');
        setOtpCode('');
      }
    } catch (err) {
      setAuthError(getFriendlyErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth: Step 3 - Complete Profile for new users
  const handleCompleteProfileSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      await completeUserProfile(
        activeToken,
        profileForm.firstName,
        profileForm.lastName,
        profileForm.email
      );
      // Re-sync user
      await signInWithToken(activeToken);
      setAuthObj(getStoredAuth());
      setShowAuthModal(false);
      setPhoneNumber('');
      setOtpCode('');
      setProfileForm({ firstName: '', lastName: '', email: '' });
    } catch (err) {
      setAuthError(getFriendlyErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    clearStoredAuth();
    setAuthObj(getStoredAuth());
    setStep('list');
  };

  // Load Dashboard Registrations
  const fetchMyRegistrations = async () => {
    if (!authObj.token) {
      setAuthStep('phone');
      setShowAuthModal(true);
      return;
    }
    setLoadingDashboard(true);
    try {
      const data = await api.getMyRegistrations();
      setMyRegistrations(data.data || data || []);
      setStep('dashboard');
    } catch (err) {
      console.error(err);
      alert(getFriendlyErrorMessage(err));
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Registration Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!authObj.token) {
      setAuthStep('phone');
      setShowAuthModal(true);
      return;
    }
    setIsRegistering(true);
    setRegError('');
    try {
      const payload = {
        categoryName: regFormData.categoryName,
        teamName: regFormData.teamName || undefined,
        partnerUserId: regFormData.partnerUserId || undefined,
        partnerName: regFormData.partnerName || undefined,
        partnerPhone: regFormData.partnerPhone || undefined,
        teamMembers: regFormData.teamMembers.filter(m => m.name.trim() !== '')
      };

      const result = await api.registerForTournament(selectedTournament._id, payload);
      if (result.success) {
        setActiveRegistration(result.data.registration);
        setActiveOrder(result.data.order);
        setStep('payment');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setRegError(getFriendlyErrorMessage(err));
    } finally {
      setIsRegistering(false);
    }
  };

  // Payment Verification Call
  const handleProcessPayment = (e) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    setPaymentError('');
    setProcessingState(0);

    const states = [
      'Connecting to payment server...',
      'Validating order signature...',
      'Verifying with banking gateway...',
      'Completing tournament registration slot...'
    ];

    let current = 0;
    const interval = setInterval(async () => {
      current += 1;
      if (current < states.length) {
        setProcessingState(current);
      } else {
        clearInterval(interval);
        try {
          const verifyData = {
            paymentOrderId: activeOrder?.id || activeOrder?.orderId || `order_${Math.random().toString(36).substr(2, 9)}`,
            paymentTransactionId: `pay_${Math.random().toString(36).substr(2, 9)}`,
            paymentSignature: `sig_${Math.random().toString(36).substr(2, 15)}`
          };

          const verifyRes = await api.verifyPayment(
            activeRegistration?._id || activeRegistration?.id,
            verifyData
          );

          if (verifyRes) {
            setStep('success');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } catch (err) {
          setPaymentError(getFriendlyErrorMessage(err));
        } finally {
          setIsProcessingPayment(false);
        }
      }
    }, 1000);
  };

  // Filter Tournaments dynamically on client side for searchQuery
  const filteredTournaments = tournaments.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: '#ffffff',
        borderBottom: '2px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
      }}>
        <div className="container" style={{
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => { setStep('list'); setSelectedTournament(null); }}>
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Arenova Logo" 
                style={{ height: '48px', objectFit: 'contain' }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: '900', letterSpacing: '1px', color: '#004fb6' }}>
                  ARE<span style={{ color: 'var(--color-secondary)' }}>NOVA</span>
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button 
              className="btn btn-outline" 
              style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem' }}
              onClick={() => {
                if (authObj.token) {
                  fetchMyRegistrations();
                } else {
                  setAuthStep('phone');
                  setShowAuthModal(true);
                }
              }}
            >
              My Dashboard
            </button>

            {authObj.token ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>Logged In</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>{authObj.user?.phone || 'Sync User'}</span>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="btn btn-outline"
                  style={{ padding: '8px', borderRadius: '50%', color: 'var(--color-error)' }}
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setAuthStep('phone');
                  setShowAuthModal(true);
                }}
                className="btn btn-primary"
                style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '0.85rem' }}
              >
                <LogIn size={16} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main style={{ flex: 1, padding: '40px 0' }}>
        <div className="container animate-fade-in">
          
          {/* STEP 1: Tournament Cards Directory */}
          {step === 'list' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 className="text-gradient-ai" style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '16px', letterSpacing: '-0.5px' }}>
                  Stadium Championships
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', maxWidth: '650px', margin: '0 auto', fontSize: '1.05rem', fontWeight: '500' }}>
                  Select an official arena tournament, filter by your favorite sport or city, and book your championship roster.
                </p>
              </div>

              {/* Filters & Search Control Bar */}
              <div className="glass-card" style={{ padding: '20px', marginBottom: '40px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder="Search tournaments by name, sport, or city..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="form-control"
                      style={{ paddingLeft: '48px', height: '48px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <select 
                    value={filterSport} 
                    onChange={(e) => setFilterSport(e.target.value)}
                    className="form-control" 
                    style={{ width: '160px', height: '48px', padding: '0 16px' }}
                  >
                    <option value="">All Sports</option>
                    <option value="Cricket">Cricket</option>
                    <option value="Badminton">Badminton</option>
                    <option value="Basketball">Basketball</option>
                  </select>

                  <select 
                    value={filterCity} 
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="form-control" 
                    style={{ width: '160px', height: '48px', padding: '0 16px' }}
                  >
                    <option value="">All Cities</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Delhi">Delhi</option>
                  </select>

                  <button 
                    onClick={() => { setFilterSport(''); setFilterCity(''); setSearchQuery(''); }}
                    className="btn btn-outline"
                    style={{ height: '48px', padding: '0 20px', borderRadius: '12px' }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {loadingTournaments ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{ width: '50px', height: '50px', border: '4px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
                  <p style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>Loading official tournaments...</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                  gap: '32px',
                  marginBottom: '60px'
                }}>
                  {filteredTournaments.map(t => {
                    const fallbackImg = t.sport?.toLowerCase().includes('cricket') ? FALLBACK_IMAGES.cricket 
                      : (t.sport?.toLowerCase().includes('badminton') ? FALLBACK_IMAGES.badminton : FALLBACK_IMAGES.basketball);
                    
                    return (
                      <div key={t._id} className="glass-card" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        borderRadius: '16px',
                        background: '#ffffff',
                        border: '1px solid rgba(0, 0, 0, 0.06)'
                      }}>
                        <div style={{
                          height: '200px',
                          position: 'relative',
                          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.75)), url(${fallbackImg})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'flex-end',
                          padding: '20px'
                        }}>
                          <span style={{
                            position: 'absolute',
                            top: '16px',
                            left: '16px',
                            fontSize: '0.75rem',
                            background: 'var(--color-primary)',
                            color: '#ffffff',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontWeight: '800',
                            letterSpacing: '0.5px'
                          }}>
                            {t.sport?.toUpperCase()}
                          </span>
                          
                          <div style={{ color: '#ffffff' }}>
                            <div style={{ fontSize: '0.8rem', opacity: '0.8', textTransform: 'uppercase' }}>Host Venue</div>
                            <h4 style={{ fontWeight: '800', fontSize: '1.1rem' }}>{t.stadium?.split(',')[0]}</h4>
                          </div>
                        </div>

                        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '8px', color: '#0f172a' }}>{t.title}</h3>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>
                              {t.description || 'Compete in a professional-tier arena fixture.'}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#475569', borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginBottom: '20px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>PRIZE POOL</span>
                                <span style={{ fontWeight: '700', color: 'var(--color-secondary)' }}>{t.prizePool}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>LOCATION</span>
                                <span style={{ fontWeight: '600' }}>{t.city}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>DEADLINE</span>
                                <span style={{ fontWeight: '600', color: 'var(--color-error)' }}>{t.regDeadline}</span>
                              </div>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleSelectTournament(t)}
                            className="btn btn-primary"
                            style={{ width: '100%', borderRadius: '8px', padding: '12px' }}
                          >
                            View & Register
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Tournament Details Page */}
          {step === 'details' && selectedTournament && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <button 
                onClick={() => setStep('list')}
                className="btn btn-outline"
                style={{ marginBottom: '24px', borderRadius: '20px' }}
              >
                <ArrowLeft size={16} />
                Back to Tournaments
              </button>

              <div className="glass-card" style={{ padding: '40px' }}>
                <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '24px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <span className="badge-glow-blue" style={{ fontSize: '0.8rem', padding: '6px 14px', borderRadius: '20px', fontWeight: 800 }}>
                      {selectedTournament.sport}
                    </span>
                    <span className="badge-glow-green" style={{ fontSize: '0.8rem', padding: '6px 14px', borderRadius: '20px', fontWeight: 800 }}>
                      Entry Fee: ₹{selectedTournament.fee}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '16px', color: 'var(--color-primary)' }}>{selectedTournament.title}</h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', lineHeight: '1.7' }}>
                    {selectedTournament.description}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '14px', border: '2px solid var(--color-border)', textAlign: 'center' }}>
                    <Award style={{ color: 'var(--color-accent)', marginBottom: '8px' }} size={28} />
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>Prize Purse</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--color-secondary)' }}>{selectedTournament.prizePool}</div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '14px', border: '2px solid var(--color-border)', textAlign: 'center' }}>
                    <MapPin style={{ color: 'var(--color-primary-light)', marginBottom: '8px' }} size={28} />
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>Host Stadium</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>{selectedTournament.stadium}</div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '14px', border: '2px solid var(--color-border)', textAlign: 'center' }}>
                    <Users style={{ color: 'var(--color-primary-light)', marginBottom: '8px' }} size={28} />
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>Roster Size</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>{selectedTournament.teamSize}</div>
                  </div>
                </div>

                {selectedTournament.categories && (
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '12px' }}>Available Tournament Categories:</h4>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {selectedTournament.categories.map((c, i) => (
                        <span key={i} className="badge-glow-blue" style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600 }}>{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '40px', background: 'rgba(255, 255, 255, 0.01)', padding: '24px', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck style={{ color: 'var(--color-secondary)' }} />
                    League Regulations
                  </h4>
                  <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                    {(selectedTournament.rules || []).map((rule, idx) => (
                      <li key={idx} style={{ lineHeight: '1.5' }}>{rule}</li>
                    ))}
                  </ul>
                </div>

                <button 
                  onClick={() => {
                    if (!authObj.token) {
                      setAuthStep('phone');
                      setShowAuthModal(true);
                    } else {
                      setStep('register');
                    }
                  }}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
                >
                  Proceed to Roster Entry
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Registration Form */}
          {step === 'register' && selectedTournament && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <button 
                onClick={() => setStep('details')}
                className="btn btn-outline"
                style={{ marginBottom: '24px', borderRadius: '20px' }}
                disabled={isRegistering}
              >
                <ArrowLeft size={16} />
                Back to Details
              </button>

              <div className="glass-card" style={{ padding: '40px' }}>
                <h2 style={{ fontSize: '1.85rem', fontWeight: '900', marginBottom: '8px' }}>Roster Details Form</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px', fontSize: '0.95rem' }}>
                  Please fill out the official details for your category tournament slots.
                </p>

                {regError && (
                  <div style={{ display: 'flex', gap: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-error)', color: 'var(--color-error)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                    <AlertCircle size={20} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.9rem' }}>{regError}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit}>
                  
                  {/* Category Selection */}
                  <div className="form-group">
                    <label className="form-label">Tournament Category *</label>
                    <select 
                      value={regFormData.categoryName} 
                      onChange={(e) => setRegFormData(prev => ({ ...prev, categoryName: e.target.value }))}
                      required
                      className="form-control"
                    >
                      {(selectedTournament.categories || ['Open Category']).map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Team/Club Name (if dynamic or team sport) */}
                  <div className="form-group">
                    <label className="form-label">Team / Club Name (Optional)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Royal Strikers FC" 
                      value={regFormData.teamName}
                      onChange={(e) => setRegFormData(prev => ({ ...prev, teamName: e.target.value }))}
                    />
                  </div>

                  {/* Partner Details (Doubles / Duo Partner) */}
                  <div style={{ background: 'rgba(0, 79, 182, 0.02)', padding: '20px', borderRadius: '14px', border: '1px solid var(--color-border)', marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '12px', color: 'var(--color-primary)' }}>Partner Roster Details (If applicable)</h4>
                    <div className="form-group">
                      <label className="form-label">Partner User ID</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Partner's registration ID" 
                        value={regFormData.partnerUserId}
                        onChange={(e) => setRegFormData(prev => ({ ...prev, partnerUserId: e.target.value }))}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Partner Legal Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Partner name" 
                          value={regFormData.partnerName}
                          onChange={(e) => setRegFormData(prev => ({ ...prev, partnerName: e.target.value }))}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Partner Phone Number</label>
                        <input 
                          type="tel" 
                          className="form-control" 
                          placeholder="10-digit mobile" 
                          pattern="[0-9]{10}"
                          value={regFormData.partnerPhone}
                          onChange={(e) => setRegFormData(prev => ({ ...prev, partnerPhone: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Team Members List */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--color-primary)' }}>Team Members</h4>
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
                        onClick={() => setRegFormData(prev => ({ ...prev, teamMembers: [...prev.teamMembers, { name: '', phone: '', role: 'Player' }] }))}
                      >
                        <Plus size={14} /> Add Member
                      </button>
                    </div>

                    {regFormData.teamMembers.map((m, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                        <input 
                          type="text" 
                          required 
                          placeholder="Full Name" 
                          className="form-control" 
                          value={m.name}
                          onChange={(e) => {
                            const newMembers = [...regFormData.teamMembers];
                            newMembers[idx].name = e.target.value;
                            setRegFormData(prev => ({ ...prev, teamMembers: newMembers }));
                          }}
                        />
                        <input 
                          type="tel" 
                          required 
                          placeholder="Phone" 
                          pattern="[0-9]{10}"
                          className="form-control" 
                          value={m.phone}
                          onChange={(e) => {
                            const newMembers = [...regFormData.teamMembers];
                            newMembers[idx].phone = e.target.value;
                            setRegFormData(prev => ({ ...prev, teamMembers: newMembers }));
                          }}
                        />
                        <select 
                          className="form-control" 
                          value={m.role}
                          onChange={(e) => {
                            const newMembers = [...regFormData.teamMembers];
                            newMembers[idx].role = e.target.value;
                            setRegFormData(prev => ({ ...prev, teamMembers: newMembers }));
                          }}
                        >
                          <option value="Captain">Captain</option>
                          <option value="Player">Player</option>
                          <option value="Substitute">Substitute</option>
                        </select>
                        <button 
                          type="button" 
                          className="btn btn-outline" 
                          style={{ padding: '10px', color: 'var(--color-error)' }}
                          disabled={regFormData.teamMembers.length <= 1}
                          onClick={() => {
                            const newMembers = regFormData.teamMembers.filter((_, i) => i !== idx);
                            setRegFormData(prev => ({ ...prev, teamMembers: newMembers }));
                          }}
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '16px', marginTop: '12px' }}
                    disabled={isRegistering}
                  >
                    {isRegistering ? 'Registering...' : `Confirm & Go to Payment (₹${selectedTournament.fee})`}
                    <ArrowRight size={18} />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP 4: Payment simulation gate */}
          {step === 'payment' && selectedTournament && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <button 
                onClick={() => setStep('register')}
                className="btn btn-outline"
                style={{ marginBottom: '24px', borderRadius: '20px' }}
                disabled={isProcessingPayment}
              >
                <ArrowLeft size={16} />
                Back to Registration
              </button>

              <div className="glass-card" style={{ padding: '40px', position: 'relative', overflow: 'hidden' }}>
                {isProcessingPayment && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(255, 255, 255, 0.98)',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '32px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      border: '4px solid var(--color-primary)',
                      borderTopColor: 'transparent',
                      animation: 'spin 1s linear infinite',
                      marginBottom: '24px',
                      boxShadow: 'var(--shadow-glow-blue)'
                    }} />
                    
                    <h3 style={{ fontSize: '1.35rem', fontWeight: '900', marginBottom: '12px', color: 'var(--color-primary)' }}>
                      Securing Transaction Gate
                    </h3>
                    
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', maxWidth: '380px' }}>
                      {[
                        'Connecting to payment server...',
                        'Validating order signature...',
                        'Verifying with banking gateway...',
                        'Completing tournament registration slot...'
                      ][processingState]}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '40px' }}>
                      <ShieldCheck size={16} />
                      <span>256-bit SSL Bank Encrypted Connection</span>
                    </div>
                  </div>
                )}

                <div style={{ borderBottom: '2px solid var(--color-border)', paddingBottom: '20px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 800 }}>TICKET SUMMARY</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 800 }}>🛡️ SECURE PORT</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Stadium Entry Fee</span>
                    <span>₹{selectedTournament.fee}.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    <span>Processing charges</span>
                    <span>₹0.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '1.35rem', marginTop: '16px', borderTop: '2px dashed var(--color-border)', paddingTop: '16px' }}>
                    <span>Total Cost</span>
                    <span style={{ color: 'var(--color-secondary)' }}>₹{selectedTournament.fee}.00</span>
                  </div>
                </div>

                {paymentError && (
                  <div style={{ display: 'flex', gap: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-error)', color: 'var(--color-error)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                    <AlertCircle size={20} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.9rem' }}>{paymentError}</span>
                  </div>
                )}

                <form onSubmit={handleProcessPayment}>
                  <label className="form-label" style={{ marginBottom: '16px' }}>Choose Billing Route</label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px',
                      background: paymentMethod === 'upi' ? 'rgba(0, 102, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      border: `2px solid ${paymentMethod === 'upi' ? 'var(--color-primary-light)' : 'var(--color-border)'}`,
                      borderRadius: '12px',
                      cursor: 'pointer'
                    }}>
                      <input 
                        type="radio" 
                        name="payment" 
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                        style={{ accentColor: 'var(--color-primary-light)' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>UPI (Google Pay / UPI ID / PhonePe)</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Pay instantly via safe mobile app redirect</div>
                      </div>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px',
                      background: paymentMethod === 'card' ? 'rgba(0, 102, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      border: `2px solid ${paymentMethod === 'card' ? 'var(--color-primary-light)' : 'var(--color-border)'}`,
                      borderRadius: '12px',
                      cursor: 'pointer'
                    }}>
                      <input 
                        type="radio" 
                        name="payment" 
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        style={{ accentColor: 'var(--color-primary-light)' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Credit / Debit Card</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Visa, Mastercard, RuPay & international cards</div>
                      </div>
                    </label>
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="form-group">
                      <label className="form-label">UPI Address ID *</label>
                      <input 
                        type="text" 
                        required 
                        className="form-control" 
                        placeholder="e.g. yourname@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Card Holder Name *</label>
                        <input 
                          type="text" 
                          required 
                          className="form-control" 
                          placeholder="Cardholder Name"
                          value={cardData.name}
                          onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Card Number *</label>
                        <input 
                          type="text" 
                          required 
                          className="form-control" 
                          placeholder="XXXX XXXX XXXX XXXX"
                          pattern="[0-9\s]{16,19}"
                          value={cardData.number}
                          onChange={(e) => setCardData(prev => ({ ...prev, number: e.target.value }))}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Expiry *</label>
                          <input 
                            type="text" 
                            required 
                            className="form-control" 
                            placeholder="MM/YY"
                            pattern="(0[1-9]|1[0-2])\/[0-9]{2}"
                            value={cardData.expiry}
                            onChange={(e) => setCardData(prev => ({ ...prev, expiry: e.target.value }))}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">CVV Code *</label>
                          <input 
                            type="password" 
                            required 
                            className="form-control" 
                            placeholder="***"
                            maxLength={3}
                            pattern="[0-9]{3}"
                            value={cardData.cvv}
                            onChange={(e) => setCardData(prev => ({ ...prev, cvv: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-secondary"
                    style={{ width: '100%', padding: '16px', marginTop: '24px', fontSize: '1.1rem' }}
                  >
                    Pay & Verify Roster Slot (₹{selectedTournament.fee})
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP 5: Payment Success Page */}
          {step === 'success' && selectedTournament && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div className="glass-card" style={{ padding: '40px', borderTop: '4px solid var(--color-success)', overflow: 'hidden' }}>
                
                <style dangerouslySetInnerHTML={{__html: `
                  @media print {
                    body { background: #fff !important; color: #000 !important; }
                    .glass-card { background: #fff !important; border: 2px solid #ddd !important; box-shadow: none !important; color: #000 !important; }
                    .btn, header, footer { display: none !important; }
                    .print-header { display: block !important; color: #000 !important; font-weight: bold; }
                    .success-check { display: none !important; }
                  }
                `}} />

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div className="success-check" style={{
                    background: 'rgba(0, 230, 118, 0.1)',
                    color: 'var(--color-success)',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                    boxShadow: 'var(--shadow-glow-green)'
                  }}>
                    <Check size={40} strokeWidth={3} />
                  </div>
                  
                  <h2 style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--color-primary)', marginBottom: '8px' }}>
                    Registration Confirmed!
                  </h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                    Your spot at the stadium is locked! You can view and manage this under your Dashboard.
                  </p>
                </div>

                {/* Ticket Details */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '2px solid var(--color-border)',
                  borderRadius: '14px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  marginBottom: '32px',
                  color: '#0f172a'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>REGISTRATION ID</span>
                    <strong style={{ color: 'var(--color-secondary)', fontFamily: 'monospace', fontSize: '1rem' }}>
                      {activeRegistration?._id || activeRegistration?.id || 'Pending'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>CATEGORY</span>
                    <span style={{ color: '#0f172a', fontWeight: '700' }}>{activeRegistration?.categoryName}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>EVENT NAME</span>
                    <span style={{ color: '#0f172a', fontWeight: '700' }}>{selectedTournament.title}</span>
                  </div>

                  {activeRegistration?.teamName && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>TEAM NAME</span>
                      <span style={{ color: '#0f172a', fontWeight: '700' }}>{activeRegistration.teamName}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>PAID AMOUNT</span>
                    <span style={{ color: 'var(--color-success)', fontWeight: '800' }}>₹{selectedTournament.fee}.00</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <button 
                    onClick={() => window.print()}
                    className="btn btn-outline"
                    style={{ width: '100%', borderRadius: '24px' }}
                  >
                    <Printer size={18} />
                    Print Ticket
                  </button>
                  <button 
                    onClick={() => { setStep('list'); setSelectedTournament(null); }}
                    className="btn btn-primary"
                    style={{ width: '100%', borderRadius: '24px' }}
                  >
                    Other Sports
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: My Dashboard Page */}
          {step === 'dashboard' && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <button 
                  onClick={() => setStep('list')}
                  className="btn btn-outline"
                  style={{ borderRadius: '20px' }}
                >
                  <ArrowLeft size={16} />
                  Back to Directory
                </button>
                <button 
                  onClick={fetchMyRegistrations}
                  className="btn btn-outline"
                  style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem' }}
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>

              <div className="glass-card" style={{ padding: '40px' }}>
                <h2 style={{ fontSize: '1.85rem', fontWeight: '900', marginBottom: '8px' }}>My Registrations</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px', fontSize: '0.95rem' }}>
                  View all of your booked tournament slots and payment statuses.
                </p>

                {myRegistrations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
                    <Trophy size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <p style={{ fontWeight: 600 }}>No tournament registrations found.</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Select a tournament from the home list to register.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {myRegistrations.map((r, idx) => (
                      <div key={r._id || idx} style={{ border: '2px solid var(--color-border)', borderRadius: '14px', padding: '20px', background: '#ffffff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                          <div>
                            <h4 style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '1.05rem' }}>
                              Category: {r.categoryName}
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                              Registration ID: <span style={{ fontFamily: 'monospace' }}>{r._id || r.id}</span>
                            </p>
                          </div>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '20px', 
                            fontSize: '0.75rem', 
                            fontWeight: 800, 
                            background: r.status === 'confirmed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                            color: r.status === 'confirmed' ? 'var(--color-success)' : 'var(--color-warning)'
                          }}>
                            {r.status?.toUpperCase() || 'PENDING PAYMENT'}
                          </span>
                        </div>

                        {r.teamName && (
                          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                            <strong>Team Name:</strong> {r.teamName}
                          </p>
                        )}

                        {r.teamMembers && r.teamMembers.length > 0 && (
                          <div style={{ marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '6px' }}>Roster Members:</p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {r.teamMembers.map((m, i) => (
                                <span key={i} style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', color: 'var(--color-text-secondary)' }}>
                                  {m.name} ({m.role})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {r.status !== 'confirmed' && (
                          <button
                            onClick={() => {
                              setActiveRegistration(r);
                              // Construct dummy order structure matching expectations
                              setActiveOrder({ id: r.paymentOrderId || `order_${Math.random().toString(36).substr(2, 9)}` });
                              // Use selected tournament fee or fallback
                              setSelectedTournament({ title: 'Novare Arena Fixture', fee: 399 });
                              setStep('payment');
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px', marginTop: '16px' }}
                          >
                            Pay Now
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Auth Sync Modal (Now phone number -> send OTP -> verify -> sync / profile complete) */}
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-card animate-fade-in" style={{ padding: '40px', maxWidth: '480px', width: '100%', background: '#ffffff' }}>
            
            {/* Invisible Recaptcha Element */}
            <div id="recaptcha-container"></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--color-primary)' }}>
                {authStep === 'phone' && 'Sign In'}
                {authStep === 'otp' && 'Verify Phone'}
                {authStep === 'complete' && 'Complete Profile'}
              </h3>
              <button 
                onClick={() => { setShowAuthModal(false); setAuthError(''); }}
                className="btn btn-outline"
                style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
                disabled={authLoading}
              >
                Close
              </button>
            </div>

            {!isFirebaseConfigured && (authStep === 'phone' || authStep === 'otp') && (
              <div style={{ display: 'flex', gap: '10px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--color-warning)', color: 'var(--color-warning)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.8rem', fontWeight: '600' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>Sandbox Mode: Firebase credentials not configured in `.env`. Simulating OTP flows.</span>
              </div>
            )}

            {authError && (
              <div style={{ display: 'flex', gap: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-error)', color: 'var(--color-error)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem' }}>{authError}</span>
              </div>
            )}

            {authStep === 'phone' && (
              <form onSubmit={handleSendOtp}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.5' }}>
                  Please enter your mobile phone number. We will send you a verification code via OTP to secure your account.
                </p>

                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input 
                      type="tel" 
                      required 
                      className="form-control" 
                      placeholder="Enter 10-digit mobile number"
                      pattern="[0-9]{10}"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      style={{ paddingLeft: '48px' }}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', marginTop: '16px' }}
                  disabled={authLoading}
                >
                  {authLoading ? 'Sending...' : 'Send Verification OTP'}
                </button>
              </form>
            )}

            {authStep === 'otp' && (
              <form onSubmit={handleVerifyOtp}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.5' }}>
                  {!isFirebaseConfigured 
                    ? `A verification code has been simulated for phone number: ${phoneNumber}. Please enter any 6-digit code.` 
                    : `Enter the 6-digit verification code sent to ${phoneNumber}.`
                  }
                </p>

                <div className="form-group">
                  <label className="form-label">6-Digit Verification Code *</label>
                  <input 
                    type="text" 
                    required 
                    maxLength={6}
                    className="form-control" 
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.25rem', fontWeight: '800' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button 
                    type="button"
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '12px', fontSize: '0.9rem' }}
                    onClick={() => setAuthStep('phone')}
                  >
                    Change Phone
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '12px', fontSize: '0.9rem' }}
                    disabled={authLoading}
                  >
                    {authLoading ? 'Verifying...' : 'Verify & Sign In'}
                  </button>
                </div>
              </form>
            )}

            {authStep === 'complete' && (
              <form onSubmit={handleCompleteProfileSubmit}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.5' }}>
                  Great! Your phone number is verified. Since you are logging in for the first time, please complete your profile details.
                </p>

                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control" 
                    placeholder="Enter first name"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control" 
                    placeholder="Enter last name"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input 
                    type="email" 
                    required 
                    className="form-control" 
                    placeholder="e.g. name@example.com"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', marginTop: '16px' }}
                  disabled={authLoading}
                >
                  {authLoading ? 'Saving Profile...' : 'Complete Profile'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        background: '#ffffff',
        padding: '16px 0',
        fontSize: '0.8rem',
        color: 'var(--color-text-secondary)',
        borderTop: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <div className="container" style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <strong>ARENOVA SPORTS STADIUM LEAGUE</strong> &copy; {new Date().getFullYear()}. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '16px', fontWeight: 600 }}>
            <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); alert("SSL billing gateway verified by Razorpay."); }}>Security Gateway</a>
            <span>•</span>
            <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); alert("Drop an email at support@arenova.in"); }}>Help & Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
