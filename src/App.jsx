import React, { useState, useEffect } from 'react';
import { 
  Trophy, Calendar, Users, Target, ShieldCheck, 
  MapPin, Clock, ArrowRight, ArrowLeft, Download, Check, AlertCircle,
  Printer, Award, Sparkles, Smile, Search, LogIn, LogOut, Key, Plus, Trash, User, CreditCard, RefreshCw, Phone, Smartphone, Globe
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
  return msg;
};
function AppContent() {
  // Views/Steps: 'list', 'details', 'register', 'payment', 'success', 'dashboard'
  const [step, setStep] = useState('list');
  const [tournaments, setTournaments] = useState([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  
  const getTournamentFee = (t, currentCategoryName) => {
    if (!t) return 0;
    if (currentCategoryName) {
      const matchedCat = (t.categories || []).find(
        c => (typeof c === 'string' ? c : c?.name) === currentCategoryName
      );
      if (matchedCat && typeof matchedCat === 'object' && matchedCat.fee !== undefined) {
        return matchedCat.fee;
      }
    }
    return t.registrationFee ?? t.fee ?? 0;
  };

  const getRegistrationType = (t, currentCategoryName) => {
    if (!t) return 'INDIVIDUAL';
    if (currentCategoryName) {
      const matchedCat = (t.categories || []).find(
        c => (typeof c === 'string' ? c : c?.name) === currentCategoryName
      );
      if (matchedCat && typeof matchedCat === 'object' && matchedCat.registrationType) {
        return matchedCat.registrationType.toUpperCase();
      }
    }
    if (t.registrationType) {
      return t.registrationType.toUpperCase();
    }
    
    // Fallback detection using strings
    const catLower = String(currentCategoryName || '').toLowerCase();
    if (catLower.includes('singles') || catLower.includes('solo') || catLower.includes('1v1')) {
      return 'INDIVIDUAL';
    }
    if (catLower.includes('doubles') || catLower.includes('duo') || catLower.includes('2v2') || catLower.includes('pair')) {
      return 'PAIR';
    }
    if (catLower.includes('team') || catLower.includes('squad') || catLower.includes('3v3') || catLower.includes('5v5') || catLower.includes('corporate') || catLower.includes('cup')) {
      return 'TEAM';
    }
    return 'INDIVIDUAL';
  };
  
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
  const [profileEditForm, setProfileEditForm] = useState({ firstName: '', lastName: '', email: '' });
  const [profileEditSuccess, setProfileEditSuccess] = useState('');
  const [profileEditError, setProfileEditError] = useState('');
  const [profileEditLoading, setProfileEditLoading] = useState(false);
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

  // Enquiry form state
  const [enquiryData, setEnquiryData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    serviceInterestedIn: 'Sports & Tournaments Enquiry',
    message: ''
  });
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);
  const [enquirySuccessMessage, setEnquirySuccessMessage] = useState('');
  const [enquiryErrorMessage, setEnquiryErrorMessage] = useState('');

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
      // Removed fallback data so only API data is rendered. 
      setTournaments([]);
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

  const handleSelectTournament = (t) => {
    setSelectedTournament(t);
    let firstCategory = 'Open Category';
    if (t.categories && t.categories.length > 0) {
      const first = t.categories[0];
      firstCategory = typeof first === 'string' ? first : (first?.name || 'Open Category');
    }
    setRegFormData({
      categoryName: firstCategory,
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

  // Profile update from dashboard
  useEffect(() => {
    if (authObj.user) {
      setProfileEditForm({
        firstName: authObj.user.firstName || '',
        lastName: authObj.user.lastName || '',
        email: authObj.user.email || '',
      });
    }
  }, [authObj.user]);

  const handleUpdateProfileDashboard = async (e) => {
    e.preventDefault();
    setProfileEditError('');
    setProfileEditSuccess('');
    setProfileEditLoading(true);
    try {
      const tokenToUse = activeToken || localStorage.getItem('arenova_auth_token') || '';
      if (!tokenToUse) {
        throw new Error("User session expired. Please sign in again.");
      }
      await completeUserProfile(
        tokenToUse,
        profileEditForm.firstName,
        profileEditForm.lastName,
        profileEditForm.email
      );
      // Re-sync user
      await signInWithToken(tokenToUse);
      setAuthObj(getStoredAuth());
      setProfileEditSuccess('Profile details successfully updated!');
    } catch (err) {
      setProfileEditError(getFriendlyErrorMessage(err));
    } finally {
      setProfileEditLoading(false);
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

  // Enquiry Form Submit
  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingEnquiry(true);
    setEnquirySuccessMessage('');
    setEnquiryErrorMessage('');
    try {
      const payload = {
        ...enquiryData,
        serviceInterestedIn: 'Other',
        message: `[Category: ${enquiryData.serviceInterestedIn}]\n\n${enquiryData.message}`
      };

      const response = await api.submitEnquiry(payload);
      if (response.success) {
        setEnquirySuccessMessage(response.message || 'Enquiry submitted successfully. We will get back to you within 24 hours.');
        setEnquiryData({
          firstName: '',
          lastName: '',
          email: '',
          company: '',
          serviceInterestedIn: 'Sports & Tournaments Enquiry',
          message: ''
        });
      }
    } catch (err) {
      setEnquiryErrorMessage(err.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setIsSubmittingEnquiry(false);
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
      const regType = getRegistrationType(selectedTournament, regFormData.categoryName);
      const payload = {
        categoryName: regFormData.categoryName || 'Open Category'
      };

      // Include registrant/player details so admin dashboard can resolve names and contact details accurately
      if (authObj.user) {
        payload.playerName = `${authObj.user.firstName || ''} ${authObj.user.lastName || ''}`.trim() || undefined;
        payload.playerEmail = authObj.user.email || undefined;
        payload.playerPhone = authObj.user.phone || undefined;
      }

      if (regType === 'TEAM') {
        payload.teamName = regFormData.teamName || undefined;
        payload.teamMembers = regFormData.teamMembers.filter(m => m.name.trim() !== '');
      } else if (regType === 'PAIR') {
        payload.partnerUserId = regFormData.partnerUserId || undefined;
        payload.partnerName = regFormData.partnerName || undefined;
        payload.partnerPhone = regFormData.partnerPhone || undefined;
      }

      console.log("Tournament registration payload sent:", payload);
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
        <div className="header-container container">
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }} className="header-menu-links">
            <a href="#" onClick={(e) => { e.preventDefault(); setStep('list'); setSelectedTournament(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontWeight: '700', fontSize: '0.92rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-primary)'}>Tournaments</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setStep('list'); setSelectedTournament(null); setTimeout(() => { window.scrollTo({ top: document.querySelector('.sections-divider')?.offsetTop || 800, behavior: 'smooth' }) }, 100); }} style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontWeight: '700', fontSize: '0.92rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-primary)'}>Our Mission</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setStep('list'); setSelectedTournament(null); setTimeout(() => { window.scrollTo({ top: document.querySelectorAll('.sections-divider')[1]?.offsetTop || 1200, behavior: 'smooth' }) }, 100); }} style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontWeight: '700', fontSize: '0.92rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-primary)'}>Partners</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setStep('list'); setSelectedTournament(null); setTimeout(() => { window.scrollTo({ top: document.querySelectorAll('.sections-divider')[2]?.offsetTop || 1600, behavior: 'smooth' }) }, 100); }} style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontWeight: '700', fontSize: '0.92rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-primary)'}>Services</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setStep('list'); setSelectedTournament(null); setTimeout(() => { window.scrollTo({ top: document.getElementById('contact-enquiry')?.offsetTop || 2000, behavior: 'smooth' }) }, 100); }} style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontWeight: '700', fontSize: '0.92rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-primary)'}>Submit Enquiry</a>
          </div>

          <div className="header-nav" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="btn btn-outline" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', padding: 0, borderRadius: '50%', border: '1px solid rgba(0, 79, 182, 0.2)', transition: 'all 0.2s' }}
              onClick={() => {
                if (authObj.token) {
                  fetchMyRegistrations();
                } else {
                  setAuthStep('phone');
                  setShowAuthModal(true);
                }
              }}
              title="My Dashboard"
            >
              <Users size={18} />
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
                <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '1.5px', display: 'block', marginBottom: '8px' }}>
                  FEATURED TOURNAMENTS
                </span>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '16px', color: '#0b1329', letterSpacing: '-0.8px' }}>
                  {filteredTournaments.length} tournaments found
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', maxWidth: '650px', margin: '0 auto', fontSize: '1.05rem', fontWeight: '500' }}>
                  Find, filter, and register for elite tournaments in your city. Select your category, set your squad roster, and claim your spot on the arena grid.
                </p>
              </div>

              {/* Filters & Search Control Bar */}
              <div className="glass-card filter-bar" style={{ padding: '20px', marginBottom: '40px' }}>
                <div className="filter-search-wrap">
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

                <div className="filter-selects-wrap">
                  <select 
                    value={filterSport} 
                    onChange={(e) => setFilterSport(e.target.value)}
                    className="form-control" 
                    style={{ width: '160px', height: '48px', padding: '0 16px', fontWeight: '600' }}
                  >
                    <option value="">All Sports</option>
                    <option value="Cricket">Cricket</option>
                    <option value="Badminton">Badminton</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Tennis">Tennis</option>
                    <option value="Football">Football</option>
                  </select>

                  <select 
                    value={filterCity} 
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="form-control" 
                    style={{ width: '160px', height: '48px', padding: '0 16px', fontWeight: '600' }}
                  >
                    <option value="">All Cities</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Delhi">Delhi</option>
                  </select>

                  <button 
                    onClick={() => { setFilterSport(''); setFilterCity(''); setSearchQuery(''); }}
                    className="btn btn-outline"
                    style={{ height: '48px', padding: '0 20px', borderRadius: '12px', fontWeight: '700' }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Quick Categories Layout area matching screenshot */}
              <div style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                marginBottom: '40px'
              }}>
                {[
                  { sport: 'Badminton', icon: '⚡', color: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)', iconColor: '#3b82f6' },
                  { sport: 'Basketball', icon: '🏀', color: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', iconColor: '#f59e0b' },
                  { sport: 'Cricket', icon: '🏆', color: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.2)', iconColor: '#f97316' },
                  { sport: 'Football', icon: '⚽', color: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)', iconColor: '#10b981' },
                  { sport: 'Tennis', icon: '☉', color: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.2)', iconColor: '#22c55e' }
                ].map((s) => {
                  const count = tournaments.filter(t => t.sport?.toLowerCase() === s.sport.toLowerCase()).length;
                  return (
                    <div 
                      key={s.sport}
                      onClick={() => setFilterSport(filterSport === s.sport ? '' : s.sport)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 20px',
                        background: filterSport === s.sport ? '#0b1329' : '#ffffff',
                        border: `1px solid ${filterSport === s.sport ? '#0b1329' : 'rgba(15, 23, 42, 0.08)'}`,
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px -5px rgba(15, 23, 42, 0.05)',
                        minWidth: '180px'
                      }}
                      onMouseEnter={(e) => {
                        if (filterSport !== s.sport) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.15)';
                          e.currentTarget.style.boxShadow = '0 6px 16px -4px rgba(15, 23, 42, 0.08)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (filterSport !== s.sport) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.08)';
                          e.currentTarget.style.boxShadow = '0 4px 12px -5px rgba(15, 23, 42, 0.05)';
                        }
                      }}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: s.color,
                        border: `1px solid ${s.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        color: s.iconColor
                      }}>
                        {s.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: '800', color: filterSport === s.sport ? '#ffffff' : '#0b1329' }}>
                          {s.sport}
                        </div>
                        <div style={{ fontSize: '0.72rem', fontWeight: '700', color: filterSport === s.sport ? 'rgba(255,255,255,0.6)' : '#64748b', marginTop: '2px' }}>
                          {count} {count === 1 ? 'Tournament' : 'Tournaments'}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                    
                    const cardImage = t.banner || t.image || fallbackImg;
                    
                    const isRegistrationOpen = (t.status?.toLowerCase().includes('open') || t.status?.toLowerCase() === 'published') && 
                      !(t.registrationEndDate && new Date() > new Date(t.registrationEndDate));
                    
                    const displayStartDate = t.startDate ? new Date(t.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                    const displayEndDate = t.endDate ? new Date(t.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                    const displayDateStr = (displayStartDate && displayEndDate) ? `${displayStartDate} - ${displayEndDate}` : (t.date || 'Dates TBA');

                    // Color code categories like in screenshots
                    const sportTagColors = {
                      badminton: { bg: '#3b82f6', text: '#ffffff' }, // Blue
                      cricket: { bg: '#f97316', text: '#ffffff' },  // Orange
                      tennis: { bg: '#22c55e', text: '#ffffff' },   // Green
                      football: { bg: '#10b981', text: '#ffffff' }, // Emerald
                      basketball: { bg: '#f59e0b', text: '#ffffff' } // Amber
                    };
                    const sportKey = t.sport?.toLowerCase() || 'badminton';
                    const tagStyle = sportTagColors[sportKey] || { bg: '#3b82f6', text: '#ffffff' };

                    return (
                      <div key={t._id} className="premium-card">
                        <div className="premium-card-image-wrap" style={{ position: 'relative', height: '220px', background: '#0b1329', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {/* Actual tournament banner/image from backend if available, otherwise fallback image */}
                          <img 
                            src={cardImage} 
                            alt={t.title} 
                            className="premium-card-image" 
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }} 
                          />
                          {/* Sports-specific symbol / icon overlay on dark background as in screenshot */}
                          <div style={{ position: 'relative', zIndex: 1, opacity: 0.15, transform: 'scale(1.8)' }}>
                            {t.sport === 'Badminton' && <Trophy size={48} />}
                            {t.sport === 'Cricket' && <Award size={48} />}
                            {t.sport === 'Tennis' && <Sparkles size={48} />}
                            {t.sport === 'Football' && <Users size={48} />}
                            {t.sport === 'Basketball' && <Target size={48} />}
                          </div>

                          {/* Category Badge e.g. BADMINTON (Left Top) */}
                          <span style={{
                            position: 'absolute',
                            top: '16px',
                            left: '16px',
                            fontSize: '0.68rem',
                            background: tagStyle.bg,
                            color: tagStyle.text,
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontWeight: '900',
                            letterSpacing: '0.8px',
                            textTransform: 'uppercase',
                            zIndex: 2
                          }}>
                            {t.sport}
                          </span>

                          {/* Registration Status (Right Top) */}
                          <span style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            fontSize: '0.68rem',
                            background: isRegistrationOpen ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                            color: isRegistrationOpen ? '#22c55e' : '#64748b',
                            border: isRegistrationOpen ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(100, 116, 139, 0.3)',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontWeight: '800',
                            letterSpacing: '0.5px',
                            zIndex: 2
                          }}>
                            {isRegistrationOpen ? (t.status === 'PUBLISHED' ? 'Registration Open' : t.status) : 'Registration Closed'}
                          </span>

                          {/* Dynamic Large Sport Symbol in center of card visual */}
                          <div style={{ position: 'absolute', color: 'rgba(255, 255, 255, 0.08)', transform: 'scale(3.5)', zIndex: 1 }}>
                            {t.sport === 'Badminton' && <span>⚡</span>}
                            {t.sport === 'Cricket' && <span>🏆</span>}
                            {t.sport === 'Tennis' && <span>☉</span>}
                            {t.sport === 'Football' && <span>⚏</span>}
                            {t.sport === 'Basketball' && <span>🏀</span>}
                          </div>
                        </div>

                        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#ffffff' }}>
                          <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '14px', color: '#0b1329', letterSpacing: '-0.3px', lineHeight: '1.35' }}>
                              {t.title}
                            </h3>
                            
                            {/* Location and Date details */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.82rem', fontWeight: '600' }}>
                                <MapPin size={14} style={{ color: '#94a3b8' }} />
                                <span>{t.city}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.82rem', fontWeight: '600' }}>
                                <Calendar size={14} style={{ color: '#94a3b8' }} />
                                <span>{t.date || displayDateStr}</span>
                              </div>
                            </div>

                            {/* Prize Pool Label */}
                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginBottom: '20px' }}>
                              <span style={{ fontSize: '0.62rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.8px', display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>
                                PRIZE POOL
                              </span>
                              <span style={{ fontSize: '1.35rem', fontWeight: '900', color: '#009e7a', fontFamily: 'Outfit, sans-serif' }}>
                                {t.prizePool}
                              </span>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleSelectTournament(t)}
                            className="btn btn-primary"
                            style={{ 
                              width: '100%', 
                              borderRadius: '12px', 
                              padding: '12px', 
                              fontSize: '0.85rem',
                              fontWeight: '800',
                              letterSpacing: '0.5px',
                              background: isRegistrationOpen ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : '#e2e8f0',
                              color: isRegistrationOpen ? '#ffffff' : '#94a3b8',
                              cursor: isRegistrationOpen ? 'pointer' : 'not-allowed',
                              boxShadow: isRegistrationOpen ? '0 4px 12px rgba(59, 130, 246, 0.25)' : 'none'
                            }}
                            disabled={!isRegistrationOpen}
                          >
                            {isRegistrationOpen ? 'Register Now' : 'Registration Closed'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="sections-divider" />

              {/* Our Mission Section */}
              <section style={{ marginBottom: '60px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <h2 className="text-gradient-ai" style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '16px' }}>Our Mission</h2>
                  <p style={{ color: 'var(--color-text-secondary)', maxWidth: '800px', margin: '0 auto', fontSize: '1.05rem', lineHeight: '1.7', fontWeight: '500' }}>
                    At Arenova, we are on a mission to democratize the grand sports stadium experience. We bridge the gap between amateur sports enthusiasts and world-class championship environments, making professional-grade stadiums, premium officiating, high-quality media streaming, and structured tournament management accessible to everyone.
                  </p>
                </div>
              </section>

              <div className="sections-divider" />

              {/* Investors & Partners continuous marquee slider */}
              <section style={{ marginBottom: '60px' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h2 className="text-gradient-playful" style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '8px' }}>Backed By & Trusted Tie-Ups</h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>Powering the next generation of professional amateur athletics</p>
                </div>
                <div className="marquee-container">
                  <div className="marquee-content">
                    {[1, 2].map((loopIndex) => (
                      <React.Fragment key={loopIndex}>
                        <div className="marquee-logo-card">
                          <span style={{ fontWeight: '900', color: 'var(--color-primary)', fontSize: '0.95rem', letterSpacing: '0.5px' }}>⚡ NEXUS CAPITAL</span>
                        </div>
                        <div className="marquee-logo-card">
                          <span style={{ fontWeight: '900', color: 'var(--color-secondary)', fontSize: '0.95rem', letterSpacing: '0.5px' }}>🏆 STADIUM ONE</span>
                        </div>
                        <div className="marquee-logo-card">
                          <span style={{ fontWeight: '900', color: 'var(--color-text-primary)', fontSize: '0.95rem', letterSpacing: '0.5px' }}>🏀 ELEVATE SPORTS</span>
                        </div>
                        <div className="marquee-logo-card">
                          <span style={{ fontWeight: '900', color: '#ea580c', fontSize: '0.95rem', letterSpacing: '0.5px' }}>🔥 RIDGE VENTURES</span>
                        </div>
                        <div className="marquee-logo-card">
                          <span style={{ fontWeight: '900', color: '#1d4ed8', fontSize: '0.95rem', letterSpacing: '0.5px' }}>⚡ VELOCITY MEDIA</span>
                        </div>
                        <div className="marquee-logo-card">
                          <span style={{ fontWeight: '900', color: '#10b981', fontSize: '0.95rem', letterSpacing: '0.5px' }}>☘️ GREEN LIGHT CO</span>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </section>

              <div className="sections-divider" />

              {/* Operations & Services Section */}
              <section style={{ marginBottom: '60px', padding: '20px 0' }}>
                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--color-primary)', display: 'block', marginBottom: '8px' }}>Ecosystem Architecture</span>
                  <h2 className="text-gradient-ai" style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '16px', letterSpacing: '-0.5px' }}>Operations & Services</h2>
                  <p style={{ color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem', lineHeight: '1.6', fontWeight: '500' }}>
                    Arenova integrates on-field physical execution with cloud tournament infrastructure to deliver a seamless league experience.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {/* Part 1: Mobile App */}
                  <div className="operations-box">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 79, 182, 0.05)', display: 'flex', alignItems: 'center', justify: 'center', color: 'var(--color-primary)' }}>
                        <Smartphone size={24} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>On-Field App</span>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-text-primary)', marginTop: '2px' }}>Arenova Mobile Application</h3>
                      </div>
                    </div>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.98rem', lineHeight: '1.6', marginBottom: '24px' }}>
                      Provides on-ground digital support for player performance, team management, and match referees.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', borderTop: '1px solid rgba(0, 79, 182, 0.06)', paddingTop: '24px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <Check size={16} style={{ color: 'var(--color-secondary)', flexShrink: 0, marginTop: '4px' }} />
                        <span><strong>Coach Modules:</strong> Digital playbook, squad coordination, and roster sheets.</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <Check size={16} style={{ color: 'var(--color-secondary)', flexShrink: 0, marginTop: '4px' }} />
                        <span><strong>Coach Booking:</strong> Parents can book professional coaches for their children, and individual users can book for their interested sports areas.</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <Check size={16} style={{ color: 'var(--color-secondary)', flexShrink: 0, marginTop: '4px' }} />
                        <span><strong>Performance Feedback:</strong> View detailed progress feedback, schedules, and player performance reviews direct from your coach.</span>
                      </div>
                    </div>
                  </div>

                  {/* Part 2: Web Platform */}
                  <div className="operations-box">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 194, 133, 0.05)', display: 'flex', alignItems: 'center', justify: 'center', color: 'var(--color-secondary)' }}>
                        <Globe size={24} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Web Directory</span>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-text-primary)', marginTop: '2px' }}>Arenova Web Platform</h3>
                      </div>
                    </div>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.98rem', lineHeight: '1.6', marginBottom: '24px' }}>
                      Serves as the administrative registry for league discovering, roster onboarding, and checkout.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', borderTop: '1px solid rgba(0, 194, 133, 0.06)', paddingTop: '24px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <Check size={16} style={{ color: 'var(--color-secondary)', flexShrink: 0, marginTop: '4px' }} />
                        <span><strong>Tournament Hub:</strong> Search and filter upcoming corporate and open division leagues.</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <Check size={16} style={{ color: 'var(--color-secondary)', flexShrink: 0, marginTop: '4px' }} />
                        <span><strong>Proceed Registration:</strong> Streamlined online checkout for solo, pair, or squad formats.</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <Check size={16} style={{ color: 'var(--color-secondary)', flexShrink: 0, marginTop: '4px' }} />
                        <span><strong>Gateway Clearance:</strong> Immediate secure payment handling and status receipt.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="sections-divider" />

              {/* Submit Enquiry / Contact Us Section */}
              <section id="contact-enquiry" style={{ marginBottom: '60px', padding: '20px 0' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--color-secondary)', display: 'block', marginBottom: '8px' }}>Get In Touch</span>
                  <h2 className="text-gradient-playful" style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '16px', letterSpacing: '-0.5px' }}>Submit an Enquiry</h2>
                  <p style={{ color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem', lineHeight: '1.6', fontWeight: '500' }}>
                    Have questions about our tournament ecosystem or interested in custom services? Fill out the form below.
                  </p>
                </div>

                <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto', padding: '40px', background: '#ffffff', borderRadius: 'var(--border-radius-md)' }}>
                  {enquirySuccessMessage ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                        <Check size={32} />
                      </div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Thank You!</h3>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '24px' }}>
                        {enquirySuccessMessage}
                      </p>
                      <button onClick={() => setEnquirySuccessMessage('')} className="btn btn-outline" style={{ borderRadius: '20px', padding: '10px 20px', textTransform: 'none' }}>
                        Send Another Enquiry
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleEnquirySubmit}>
                      {enquiryErrorMessage && (
                        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: 'var(--color-error)', fontSize: '0.9rem', marginBottom: '20px', fontWeight: '600' }}>
                          {enquiryErrorMessage}
                        </div>
                      )}
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">First Name *</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            required 
                            placeholder="John"
                            value={enquiryData.firstName}
                            onChange={(e) => setEnquiryData({...enquiryData, firstName: e.target.value})}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Last Name *</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            required 
                            placeholder="Doe"
                            value={enquiryData.lastName}
                            onChange={(e) => setEnquiryData({...enquiryData, lastName: e.target.value})}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Email Address *</label>
                          <input 
                            type="email" 
                            className="form-control" 
                            required 
                            placeholder="john.doe@example.com"
                            value={enquiryData.email}
                            onChange={(e) => setEnquiryData({...enquiryData, email: e.target.value})}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Company (Optional)</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Company Name"
                            value={enquiryData.company}
                            onChange={(e) => setEnquiryData({...enquiryData, company: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label className="form-label">Enquiry Category *</label>
                        <select 
                          className="form-control" 
                          required
                          value={enquiryData.serviceInterestedIn}
                          onChange={(e) => setEnquiryData({...enquiryData, serviceInterestedIn: e.target.value})}
                          style={{ appearance: 'auto' }}
                        >
                          <option value="Sports & Tournaments Enquiry">Sports & Tournaments Enquiry</option>
                          <option value="Ticket Booking Issues">Ticket Booking Issues</option>
                          <option value="Payment & Refund Queries">Payment & Refund Queries</option>
                          <option value="Team & Roster Registration Support">Team & Roster Registration Support</option>
                          <option value="Sponsorship & Partnership Support">Sponsorship & Partnership Support</option>
                          <option value="Other Support / General Query">Other Support / General Query</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label className="form-label">Message *</label>
                        <textarea 
                          className="form-control" 
                          required 
                          rows="4" 
                          placeholder="Tell us about your requirements..."
                          value={enquiryData.message}
                          onChange={(e) => setEnquiryData({...enquiryData, message: e.target.value})}
                          style={{ resize: 'vertical' }}
                        ></textarea>
                      </div>

                      <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={isSubmittingEnquiry}
                        style={{ width: '100%' }}
                      >
                        {isSubmittingEnquiry ? 'Submitting...' : 'Submit Enquiry'}
                      </button>
                    </form>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* STEP: Privacy Policy */}
          {step === 'privacy' && (
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 0' }}>
              <button 
                onClick={() => { setStep('list'); window.scrollTo(0, 0); }}
                className="btn btn-outline"
                style={{ marginBottom: '24px', borderRadius: '20px', padding: '10px 20px', textTransform: 'none' }}
              >
                <ArrowLeft size={16} />
                Back to Home Page
              </button>

              <div className="glass-card" style={{ padding: '40px', background: '#ffffff', border: '1px solid rgba(0, 79, 182, 0.08)' }}>
                <h1 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '8px', color: 'var(--color-primary)' }}>Privacy Policy</h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '32px' }}>Effective Date: August 20, 2026 | Last Updated: August 20, 2026</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.7' }}>
                  
                  <div>
                    <h3 style={{ color: 'var(--color-text-primary)', fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>1. Introduction</h3>
                    <p>
                      Welcome to Arenova. We operate the Arenova web platform and mobile application. This Privacy Policy details our practices concerning the collection, use, and disclosure of information we collect from users when registering for tournaments, accessing our services, or interacting with our APIs.
                    </p>
                  </div>

                  <div>
                    <h3 style={{ color: 'var(--color-text-primary)', fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>2. Information Collection and Use</h3>
                    <p style={{ marginBottom: '12px' }}>
                      To provide our services, facilitate tournament registration, and process payments, we collect information including, but not limited to:
                    </p>
                    <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <li><strong>Personal Identification Details:</strong> First name, last name, phone number, and email address.</li>
                      <li><strong>Tournament Team Information:</strong> Roster names, team roles, and contact phone numbers of partners or teammates (with their direct consent).</li>
                      <li><strong>Payment Information:</strong> Financial transaction IDs, payment orders, and signatures. Payment processing is handled exclusively through secure, certified gateway providers (e.g., Razorpay, Cashfree, or Stripe). We do not store credit card or bank account credentials on our servers.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 style={{ color: 'var(--color-text-primary)', fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>3. How We Use Collected Data</h3>
                    <p style={{ marginBottom: '8px' }}>
                      The gathered data is utilized for the following business-critical purposes:
                    </p>
                    <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <li>To process and authenticate tournament registration bookings.</li>
                      <li>To securely settle transaction fees and verify billing records.</li>
                      <li>To dispatch match-day updates, schedules, and league bracket positions.</li>
                      <li>To monitor system health, audit platform logs, and enforce security policies.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 style={{ color: 'var(--color-text-primary)', fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>4. Data Security & Storage</h3>
                    <p>
                      We place high importance on the security of your data. We use industry-standard Secure Sockets Layer (SSL) transmission protocol to encrypt data streams. All personal identifiers are housed in secured cloud databases protected by firewall systems. While we deploy strict security protocols, no storage solution is 100% invulnerable; we continuously review and upgrade our defense mechanisms to protect your privacy.
                    </p>
                  </div>

                  <div>
                    <h3 style={{ color: 'var(--color-text-primary)', fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>5. Information Sharing & Third-Party Disclosure</h3>
                    <p>
                      We do not trade, sell, or rent your personal information to third parties. We share information only with trusted service partners required to fulfill our platform operations, such as payment processors for gateway transaction verification and cloud authentication providers (like Firebase) to authenticate login sessions.
                    </p>
                  </div>

                  <div>
                    <h3 style={{ color: 'var(--color-text-primary)', fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>6. Customer Rights & Consents</h3>
                    <p>
                      You are entitled to check, update, or request the deletion of your account files at any time. When registering team members or partner roster details, you certify that you have obtained explicit consent from each partner to provide their details on the platform.
                    </p>
                  </div>

                  <div>
                    <h3 style={{ color: 'var(--color-text-primary)', fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>7. Compliance with Regulatory & Onboarding Mandates</h3>
                    <p>
                      This policy is designed to satisfy strict compliance frameworks demanded by payment gateways and bank card networks. It works in conjunction with our terms and conditions and refund policy rules to protect all transactions on this site.
                    </p>
                  </div>

                  <div>
                    <h3 style={{ color: 'var(--color-text-primary)', fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>8. Contact Us</h3>
                    <p>
                      If you have questions about our handling of database records or wish to query our privacy standards, please reach out to us at:
                      <br />
                      <strong>Email:</strong> support@arenova.in
                    </p>
                  </div>

                </div>
              </div>
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
                      Entry Fee: ₹{getTournamentFee(selectedTournament)}
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

                {selectedTournament.categories && selectedTournament.categories.length > 0 && (
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '12px' }}>Available Tournament Categories:</h4>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {selectedTournament.categories.map((c, i) => {
                        const name = typeof c === 'string' ? c : (c?.name || '');
                        return (
                          <span key={i} className="badge-glow-blue" style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600 }}>{name}</span>
                        );
                      })}
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
                  Proceed Registration
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Registration Form */}
          {step === 'register' && selectedTournament && (() => {
            const regType = getRegistrationType(selectedTournament, regFormData.categoryName);
            const currentFee = getTournamentFee(selectedTournament, regFormData.categoryName);
            
            return (
              <div style={{ maxWidth: '650px', margin: '0 auto' }}>
                <button 
                  onClick={() => setStep('details')}
                  className="btn btn-outline"
                  style={{ marginBottom: '24px', borderRadius: '20px' }}
                  disabled={isRegistering}
                >
                  <ArrowLeft size={16} />
                  Back to Details
                </button>

                {/* Tournament Mini Summary Card */}
                <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', background: '#ffffff', border: '1px solid rgba(0, 79, 182, 0.08)' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(0, 79, 182, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                    flexShrink: 0
                  }}>
                    <Trophy size={24} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-primary-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {selectedTournament.sport} • {selectedTournament.city}
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-text-primary)' }}>
                      {selectedTournament.title}
                    </h3>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '700' }}>ENTRY FEE</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--color-secondary)' }}>₹{currentFee}</div>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '36px', background: '#ffffff' }}>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: '900', marginBottom: '8px', color: 'var(--color-text-primary)' }}>Roster Registration</h2>
                  <p style={{ color: 'var(--color-text-secondary)', marginBottom: '28px', fontSize: '0.9rem', fontWeight: '500' }}>
                    Select your tournament category and fill out your roster details to lock your entry slot.
                  </p>

                  {regError && (
                    <div style={{ display: 'flex', gap: '10px', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--color-error)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                      <AlertCircle size={20} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.88rem', fontWeight: '600' }}>{regError}</span>
                    </div>
                  )}

                  <form onSubmit={handleRegisterSubmit}>
                    
                    {/* Category Selection */}
                    <div className="form-group" style={{ position: 'relative' }}>
                      <label className="form-label">Tournament Category *</label>
                      <div style={{ position: 'relative' }}>
                        <select 
                          value={regFormData.categoryName} 
                          onChange={(e) => setRegFormData(prev => ({ ...prev, categoryName: e.target.value }))}
                          required
                          className="form-control"
                          style={{
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            paddingRight: '45px',
                            background: '#ffffff',
                            fontWeight: '700',
                            border: '2px solid rgba(0, 79, 182, 0.1)',
                            borderRadius: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          {((selectedTournament.categories && selectedTournament.categories.length > 0) 
                            ? selectedTournament.categories 
                            : ['Open Category']
                          ).map((c, i) => {
                            const name = typeof c === 'string' ? c : (c?.name || '');
                            return (
                              <option key={i} value={name}>{name}</option>
                            );
                          })}
                        </select>
                        <div style={{
                          position: 'absolute',
                          right: '18px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                          color: 'var(--color-primary)',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          ▼
                        </div>
                      </div>
                      {(!selectedTournament.categories || selectedTournament.categories.length === 0) && (
                        <div style={{
                          color: 'var(--color-error)',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          marginTop: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <AlertCircle size={14} />
                          <span>Warning: This tournament has no categories configured in the backend database. Submissions will fail.</span>
                        </div>
                      )}
                    </div>

                    {/* INDIVIDUAL REGISTRATION VIEW */}
                    {regType === 'INDIVIDUAL' && (
                      <div style={{
                        background: 'rgba(0, 79, 182, 0.03)',
                        border: '2px dashed rgba(0, 79, 182, 0.15)',
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '28px',
                        textAlign: 'center'
                      }}>
                        <User size={36} style={{ color: 'var(--color-primary-light)', marginBottom: '12px' }} />
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
                          Individual Slot Registration
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.5', maxWidth: '400px', margin: '0 auto 16px' }}>
                          You are registering as a solo participant. Your profile coordinates will be synchronized for this tournament slot.
                        </p>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: '#ffffff',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          border: '1px solid rgba(0, 79, 182, 0.08)',
                          fontSize: '0.82rem',
                          fontWeight: '700',
                          color: 'var(--color-text-primary)'
                        }}>
                          <Check size={14} style={{ color: 'var(--color-secondary)' }} />
                          <span>Logged in as: {authObj.user?.firstName || 'User'} ({authObj.user?.phone || 'Verified'})</span>
                        </div>
                      </div>
                    )}

                    {/* PAIR REGISTRATION VIEW */}
                    {regType === 'PAIR' && (
                      <div style={{
                        background: 'rgba(0, 79, 182, 0.02)',
                        border: '2px solid rgba(0, 79, 182, 0.08)',
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '28px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                          <Users size={20} style={{ color: 'var(--color-primary)' }} />
                          <h4 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--color-primary)', margin: 0 }}>Partner Roster Details</h4>
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">Partner User ID (Optional)</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="e.g. Partner's user or registration ID" 
                            value={regFormData.partnerUserId}
                            onChange={(e) => setRegFormData(prev => ({ ...prev, partnerUserId: e.target.value }))}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Partner Legal Name *</label>
                            <input 
                              type="text" 
                              required={regType === 'PAIR'}
                              className="form-control" 
                              placeholder="Full Name" 
                              value={regFormData.partnerName}
                              onChange={(e) => setRegFormData(prev => ({ ...prev, partnerName: e.target.value }))}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Partner Phone *</label>
                            <input 
                              type="tel" 
                              required={regType === 'PAIR'}
                              className="form-control" 
                              placeholder="10-digit phone" 
                              pattern="[0-9]{10}"
                              value={regFormData.partnerPhone}
                              onChange={(e) => setRegFormData(prev => ({ ...prev, partnerPhone: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TEAM REGISTRATION VIEW */}
                    {regType === 'TEAM' && (
                      <div style={{ marginBottom: '28px' }}>
                        {/* Team Name */}
                        <div className="form-group">
                          <label className="form-label">Team / Club Name *</label>
                          <input 
                            type="text" 
                            required={regType === 'TEAM'}
                            className="form-control" 
                            placeholder="e.g. Royal Strikers FC" 
                            value={regFormData.teamName}
                            onChange={(e) => setRegFormData(prev => ({ ...prev, teamName: e.target.value }))}
                          />
                        </div>

                        {/* Team Members List */}
                        <div style={{
                          background: 'rgba(0, 158, 122, 0.02)',
                          border: '2px solid rgba(0, 158, 122, 0.08)',
                          borderRadius: '16px',
                          padding: '24px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Users size={20} style={{ color: 'var(--color-secondary)' }} />
                              <h4 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--color-secondary)', margin: 0 }}>Team Roster</h4>
                            </div>
                            <button 
                              type="button" 
                              className="btn btn-outline" 
                              style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px', height: '36px' }}
                              onClick={() => setRegFormData(prev => ({ ...prev, teamMembers: [...prev.teamMembers, { name: '', phone: '', role: 'Player' }] }))}
                            >
                              <Plus size={14} /> Add Member
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {regFormData.teamMembers.map((m, idx) => (
                              <div key={idx} style={{
                                display: 'grid',
                                gridTemplateColumns: '1.2fr 1.2fr 1fr auto',
                                gap: '10px',
                                alignItems: 'center',
                                background: '#ffffff',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid rgba(0, 158, 122, 0.1)'
                              }}>
                                <input 
                                  type="text" 
                                  required 
                                  placeholder="Player Name" 
                                  className="form-control" 
                                  style={{ padding: '10px 14px', fontSize: '0.88rem' }}
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
                                  style={{ padding: '10px 14px', fontSize: '0.88rem' }}
                                  value={m.phone}
                                  onChange={(e) => {
                                    const newMembers = [...regFormData.teamMembers];
                                    newMembers[idx].phone = e.target.value;
                                    setRegFormData(prev => ({ ...prev, teamMembers: newMembers }));
                                  }}
                                />
                                <select 
                                  className="form-control" 
                                  style={{ padding: '10px 14px', fontSize: '0.88rem', cursor: 'pointer' }}
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
                                  style={{
                                    padding: '10px',
                                    color: 'var(--color-error)',
                                    borderColor: 'rgba(239, 68, 68, 0.15)',
                                    height: '42px',
                                    width: '42px',
                                    borderRadius: '10px',
                                    background: 'rgba(239, 68, 68, 0.02)'
                                  }}
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
                        </div>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '16px', marginTop: '16px', fontSize: '1.05rem' }}
                      disabled={isRegistering}
                    >
                      {isRegistering ? 'Processing Registration...' : `Confirm & Go to Payment (₹${currentFee})`}
                      <ArrowRight size={18} />
                    </button>
                  </form>
                </div>
              </div>
            );
          })()}

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
                    <span>₹{getTournamentFee(selectedTournament, regFormData.categoryName)}.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    <span>Processing charges</span>
                    <span>₹0.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '1.35rem', marginTop: '16px', borderTop: '2px dashed var(--color-border)', paddingTop: '16px' }}>
                    <span>Total Cost</span>
                    <span style={{ color: 'var(--color-secondary)' }}>₹{getTournamentFee(selectedTournament, regFormData.categoryName)}.00</span>
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
                    Pay & Verify Roster Slot (₹{getTournamentFee(selectedTournament, regFormData.categoryName)})
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
                    <span style={{ color: 'var(--color-success)', fontWeight: '800' }}>₹{getTournamentFee(selectedTournament, regFormData.categoryName)}.00</span>
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
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
                
                {/* Column 1: Detailed Profile Info */}
                <div className="glass-card" style={{ padding: '32px', background: '#ffffff', border: '1px solid rgba(0, 79, 182, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid rgba(0, 0, 0, 0.06)', paddingBottom: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0, 79, 182, 0.08)', display: 'flex', alignItems: 'center', justify: 'center', color: 'var(--color-primary)' }}>
                      <User size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>My Profile</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Manage account details</span>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateProfileDashboard}>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input 
                        type="text" 
                        value={authObj.user?.phone || 'Sync User'} 
                        disabled 
                        className="form-control"
                        style={{ background: '#f8fafc', color: 'var(--color-text-muted)', cursor: 'not-allowed', border: '1px solid #e2e8f0' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">First Name *</label>
                        <input 
                          type="text" 
                          required 
                          className="form-control" 
                          placeholder="First name"
                          value={profileEditForm.firstName}
                          onChange={(e) => setProfileEditForm({ ...profileEditForm, firstName: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Last Name *</label>
                        <input 
                          type="text" 
                          required 
                          className="form-control" 
                          placeholder="Last name"
                          value={profileEditForm.lastName}
                          onChange={(e) => setProfileEditForm({ ...profileEditForm, lastName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address *</label>
                      <input 
                        type="email" 
                        required 
                        className="form-control" 
                        placeholder="e.g. name@example.com"
                        value={profileEditForm.email}
                        onChange={(e) => setProfileEditForm({ ...profileEditForm, email: e.target.value })}
                      />
                    </div>

                    {profileEditSuccess && (
                      <div style={{ color: 'var(--color-success)', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 700 }}>
                        {profileEditSuccess}
                      </div>
                    )}
                    {profileEditError && (
                      <div style={{ color: 'var(--color-error)', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 700 }}>
                        {profileEditError}
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '0.85rem', textTransform: 'none' }}
                      disabled={profileEditLoading}
                    >
                      {profileEditLoading ? 'Saving...' : 'Update Details'}
                    </button>
                  </form>
                </div>

                {/* Column 2: My Registrations */}
                <div className="glass-card" style={{ padding: '32px', background: '#ffffff', border: '1px solid rgba(0, 79, 182, 0.08)' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '8px', color: 'var(--color-text-primary)' }}>My Registrations</h2>
                  <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', fontSize: '0.88rem' }}>
                    View all of your booked tournament slots and payment statuses.
                  </p>

                  {myRegistrations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
                      <Trophy size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>No tournament registrations found.</p>
                      <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Select a tournament from the home list to register.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {myRegistrations.map((r, idx) => (
                        <div key={r._id || idx} style={{ border: '1px solid rgba(0, 79, 182, 0.1)', borderRadius: '14px', padding: '20px', background: '#ffffff' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                            <div>
                              <h4 style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '0.98rem' }}>
                                Category: {r.categoryName}
                              </h4>
                              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                Registration ID: <span style={{ fontFamily: 'monospace' }}>{r._id || r.id}</span>
                              </p>
                            </div>
                            <span style={{ 
                              padding: '4px 10px', 
                              borderRadius: '20px', 
                              fontSize: '0.72rem', 
                              fontWeight: 800, 
                              background: r.status === 'confirmed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                              color: r.status === 'confirmed' ? 'var(--color-success)' : 'var(--color-warning)'
                            }}>
                              {r.status?.toUpperCase() || 'PENDING PAYMENT'}
                            </span>
                          </div>

                          {r.teamName && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                              <strong>Team Name:</strong> {r.teamName}
                            </p>
                          )}

                          {r.teamMembers && r.teamMembers.length > 0 && (
                            <div style={{ marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '6px' }}>Roster Members:</p>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {r.teamMembers.map((m, i) => (
                                  <span key={i} style={{ fontSize: '0.72rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', color: 'var(--color-text-secondary)' }}>
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
                                setActiveOrder({ id: r.paymentOrderId || `order_${Math.random().toString(36).substr(2, 9)}` });
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '20px 0 10px', color: 'var(--color-text-muted)', fontSize: '0.8rem', justifyContent: 'center' }}>
                  <span style={{ height: '1px', background: '#e2e8f0', flex: 1 }}></span>
                  <span>Local Development</span>
                  <span style={{ height: '1px', background: '#e2e8f0', flex: 1 }}></span>
                </div>

                <button 
                  type="button" 
                  onClick={() => {
                    const mockUser = {
                      phone: '9876543210',
                      firstName: 'Prospective',
                      lastName: 'Developer',
                      email: 'dev@arenova.in'
                    };
                    localStorage.setItem('arenova_auth_token', 'mock_local_auth_token');
                    localStorage.setItem('arenova_user_data', JSON.stringify(mockUser));
                    setAuthObj({
                      token: 'mock_local_auth_token',
                      refreshToken: 'mock_local_refresh_token',
                      user: mockUser
                    });
                    setShowAuthModal(false);
                    setPhoneNumber('');
                    setOtpCode('');
                  }}
                  className="btn btn-outline"
                  style={{ width: '100%', padding: '12px', borderStyle: 'dashed', borderColor: 'var(--color-primary-light)', fontSize: '0.85rem' }}
                >
                  Bypass with Mock Profile (Test Screens)
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
            <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); setStep('privacy'); window.scrollTo(0, 0); }}>Privacy Policy</a>
            <span>•</span>
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
