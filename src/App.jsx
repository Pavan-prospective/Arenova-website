import React, { useState, useEffect } from 'react';
import { 
  Trophy, Calendar, Users, Target, ShieldCheck, 
  MapPin, Clock, ArrowRight, ArrowLeft, Download, Check, AlertCircle,
  Printer, Award, Sparkles, Smile
} from 'lucide-react';
import { getArenovaLogo } from './utils/secureAsset';
import { ErrorBoundary } from './components/ErrorBoundary';

// Import Pro Stadium Images
import cricketImg from './assets/stadium_cricket_pro.jpg';
import badmintonImg from './assets/stadium_badminton_pro.jpg';
import basketballImg from './assets/stadium_basketball_pro.jpg';

// Mock Stadium Tournament Data
const TOURNAMENTS = [
  {
    id: 'arn-cricket-26',
    title: 'Arenova Championship Cricket League',
    game: 'CRICKET (T20)',
    stadium: 'Wankhede Arena, Mumbai',
    prizePool: '₹10,00,000',
    date: 'Oct 10 - Oct 16, 2026',
    regDeadline: 'Oct 05, 2026',
    teamSize: 'Squad (11 Players + 4 Subs)',
    fee: 999,
    image: cricketImg,
    description: 'Step onto the professional turf under high-intensity stadium floodlights. Compete in a T20 league designed for elite squads, corporate clubs, and state-level players.',
    rules: [
      'Age limit: Open category. Valid ID proof mandatory.',
      'Professional leather balls and match-day safety equipment provided.',
      'FIBA/ICC tournament regulations apply. Full day/night slots.',
      'Officiated by a certified panel of neutral match referees.'
    ]
  },
  {
    id: 'arn-badminton-26',
    title: 'Arenova Badminton Pro Masters',
    game: 'BADMINTON (SINGLES/DOUBLES)',
    stadium: 'Indira Gandhi Indoor Arena',
    prizePool: '₹2,50,000',
    date: 'Oct 24 - Oct 28, 2026',
    regDeadline: 'Oct 20, 2026',
    teamSize: 'Solo (1v1) or Duo (2v2)',
    fee: 299,
    image: badmintonImg,
    description: 'Compete on synthetic indoor courts under professional lighting. Designed for seasoned singles and doubles competitors looking for ranking points and national glory.',
    rules: [
      'Synthetic courts require professional non-marking court shoes.',
      'Tournament shuttles: Yonex Aerosensa series.',
      'Knockout system: best of 3 sets, 21-point rally score format.',
      'Coaches allowed at courtside during official match intervals.'
    ]
  },
  {
    id: 'arn-basketball-26',
    title: 'Arenova Basketball Arena Showdown',
    game: 'BASKETBALL (3v3 & 5v5)',
    stadium: 'Arenova Central Court, Bengaluru',
    prizePool: '₹5,00,000',
    date: 'Nov 05 - Nov 10, 2026',
    regDeadline: 'Nov 01, 2026',
    teamSize: 'Squad (5 Players + 3 Subs)',
    fee: 499,
    image: basketballImg,
    description: 'Fast-paced basketball on premium wooden courts. Features digital scoreboards, professional shot clocks, and top-tier referee squads.',
    rules: [
      'Standard FIBA match play regulations strictly enforced.',
      'Uniform rule: Teams must wear matching jerseys with clear numberings.',
      'Full courtside first-aid and sports rehab teams present.',
      'Most Valuable Player (MVP) award will be presented after the finals.'
    ]
  }
];

function AppContent() {
  const [step, setStep] = useState('list'); // 'list', 'details', 'register', 'payment', 'success'
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [formData, setFormData] = useState({
    teamName: '',
    captainName: '',
    email: '',
    phone: '',
    players: ['', '', '', ''] // Squad roster names
  });
  const [isTeamMode, setIsTeamMode] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [upiId, setUpiId] = useState('');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [processingState, setProcessingState] = useState(0);
  const [regId, setRegId] = useState('');
  const [txnId, setTxnId] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    try {
      const decryptedLogo = getArenovaLogo();
      setLogoUrl(decryptedLogo);
    } catch (e) {
      console.error("Failed to load secure logo", e);
    }
  }, []);

  const handleSelectTournament = (t) => {
    setSelectedTournament(t);
    const defaultRosterCount = t.id.includes('cricket') ? 10 : (t.id.includes('badminton') ? 0 : 4);
    setIsTeamMode(!t.id.includes('badminton'));
    setFormData({
      teamName: '',
      captainName: '',
      email: '',
      phone: '',
      players: Array(defaultRosterCount).fill('')
    });
    setStep('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handlePlayerChange = (index, val) => {
    const newPlayers = [...formData.players];
    newPlayers[index] = val;
    setFormData(prev => ({ ...prev, players: newPlayers }));
  };

  const handleGoToRegister = () => {
    setStep('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToPayment = (e) => {
    e.preventDefault();
    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProcessPayment = (e) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    setProcessingState(0);

    const states = [
      'Connecting to bank gateway...',
      'Verifying payment parameters...',
      'Allocating slot ID in stadium database...',
      'Generating secure ticketing receipt...'
    ];

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current < states.length) {
        setProcessingState(current);
      } else {
        clearInterval(interval);
        const generatedReg = `ARN-STAD-${Math.floor(100000 + Math.random() * 900000)}`;
        const generatedTxn = `TXN-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
        setRegId(generatedReg);
        setTxnId(generatedTxn);
        setIsProcessingPayment(false);
        setStep('success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 1200);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRestart = () => {
    setStep('list');
    setSelectedTournament(null);
    setFormData({
      teamName: '',
      captainName: '',
      email: '',
      phone: '',
      players: ['', '', '', '']
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={handleRestart}>
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
          <div>
            <span style={{
              fontSize: '0.85rem',
              background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.1) 0%, rgba(0, 194, 133, 0.1) 100%)',
              color: 'var(--color-primary)',
              padding: '8px 16px',
              borderRadius: '24px',
              fontWeight: 800,
              border: '2px solid rgba(0, 102, 255, 0.15)',
              boxShadow: '0 2px 10px rgba(0, 102, 255, 0.05)'
            }}>
              ⭐ Professional League Portal
            </span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main style={{ flex: 1, padding: '40px 0' }}>
        <div className="container animate-fade-in">
          
          {/* STEP 1: Separate Tournament Cards Grid */}
          {step === 'list' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                <h1 className="text-gradient-ai" style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '16px', letterSpacing: '-0.5px' }}>
                  Stadium Championships
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', maxWidth: '650px', margin: '0 auto', fontSize: '1.05rem', fontWeight: '500' }}>
                  Select an official arena tournament, review regulations, and register. Secure payment confirmation ticket generated instantly.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '32px'
              }}>
                {TOURNAMENTS.map(t => (
                  <div key={t.id} className="glass-card" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    borderRadius: '16px',
                    background: '#ffffff',
                    border: '1px solid rgba(0, 0, 0, 0.06)'
                  }}>
                    {/* Header Image with dark gradient overlay */}
                    <div style={{
                      height: '200px',
                      position: 'relative',
                      backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url(${t.image})`,
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
                        {t.game}
                      </span>
                      
                      <div style={{ color: '#ffffff' }}>
                        <div style={{ fontSize: '0.8rem', opacity: '0.8', textTransform: 'uppercase' }}>Host Arena</div>
                        <h4 style={{ fontWeight: '800', fontSize: '1.1rem' }}>{t.stadium.split(',')[0]}</h4>
                      </div>
                    </div>

                    {/* Card details */}
                    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '8px', color: '#0f172a' }}>{t.title}</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>
                          {t.description}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#475569', borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginBottom: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>PRIZE POOL</span>
                            <span style={{ fontWeight: '700', color: 'var(--color-secondary)' }}>{t.prizePool}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>DATES</span>
                            <span style={{ fontWeight: '600' }}>{t.date}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>ROSTER</span>
                            <span style={{ fontWeight: '600' }}>{t.teamSize}</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleSelectTournament(t)}
                        className="btn btn-primary"
                        style={{ width: '100%', borderRadius: '8px', padding: '12px' }}
                      >
                        Select Tournament
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Tournament Details */}
          {step === 'details' && selectedTournament && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <button 
                onClick={() => setStep('list')}
                className="btn btn-outline"
                style={{ marginBottom: '24px', borderRadius: '20px' }}
              >
                <ArrowLeft size={16} />
                Back to Sport Events
              </button>

              <div className="glass-card" style={{ padding: '40px' }}>
                <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '24px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <span className="badge-glow-blue" style={{
                      fontSize: '0.8rem',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontWeight: 800
                    }}>{selectedTournament.game}</span>
                    <span className="badge-glow-green" style={{
                      fontSize: '0.8rem',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontWeight: 800
                    }}>Entry Fee: ₹{selectedTournament.fee}</span>
                  </div>

                  <h2 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '16px', color: 'var(--color-primary)' }}>{selectedTournament.title}</h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', lineHeight: '1.7' }}>
                    {selectedTournament.description}
                  </p>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '20px',
                  marginBottom: '32px'
                }}>
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
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>Squad Limit</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>{selectedTournament.teamSize}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '40px', background: 'rgba(255, 255, 255, 0.01)', padding: '24px', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck style={{ color: 'var(--color-secondary)' }} />
                    League Regulations
                  </h4>
                  <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                    {selectedTournament.rules.map((rule, idx) => (
                      <li key={idx} style={{ lineHeight: '1.5' }}>{rule}</li>
                    ))}
                  </ul>
                </div>

                <button 
                  onClick={handleGoToRegister}
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
              >
                <ArrowLeft size={16} />
                Back to Details
              </button>

              <div className="glass-card" style={{ padding: '40px' }}>
                <h2 style={{ fontSize: '1.85rem', fontWeight: '900', marginBottom: '8px' }}>Roster Details Form</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px', fontSize: '0.95rem' }}>
                  Please enter official information. Captain details will be used for coordination, scheduling, and kit distribution.
                </p>

                <form onSubmit={handleGoToPayment}>
                  {isTeamMode && (
                    <div className="form-group">
                      <label className="form-label">Club / Team Name *</label>
                      <input 
                        type="text" 
                        required 
                        className="form-control" 
                        placeholder="e.g. Royal Strikers FC" 
                        value={formData.teamName}
                        onChange={(e) => handleFormChange('teamName', e.target.value)}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">{isTeamMode ? 'Team Captain Name *' : 'Player Full Name *'}</label>
                    <input 
                      type="text" 
                      required 
                      className="form-control" 
                      placeholder="Enter legal name" 
                      value={formData.captainName}
                      onChange={(e) => handleFormChange('captainName', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input 
                      type="email" 
                      required 
                      className="form-control" 
                      placeholder="e.g. captain@example.com" 
                      value={formData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Mobile Number *</label>
                    <input 
                      type="tel" 
                      required 
                      className="form-control" 
                      placeholder="10-digit number" 
                      pattern="[0-9]{10}"
                      value={formData.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                    />
                  </div>

                  {isTeamMode && (
                    <div style={{ marginTop: '32px', borderTop: '2px solid var(--color-border)', paddingTop: '24px' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px', color: 'var(--color-primary)' }}>Roster Names</h4>
                      {formData.players.map((p, idx) => (
                        <div key={idx} className="form-group">
                          <label className="form-label">Player #{idx + 1} Name *</label>
                          <input 
                            type="text" 
                            required 
                            className="form-control" 
                            placeholder={`Enter player #${idx + 1} full name`}
                            value={p}
                            onChange={(e) => handlePlayerChange(idx, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '16px', marginTop: '24px' }}
                  >
                    Confirm & Go to Payment (₹{selectedTournament.fee})
                    <ArrowRight size={18} />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP 4: Payment Gateway */}
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
                      Secure Gateway Link
                    </h3>
                    
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', maxWidth: '380px' }}>
                      {['Connecting to bank gateway...',
                        'Verifying payment parameters...',
                        'Allocating slot ID in stadium database...',
                        'Generating secure ticketing receipt...'][processingState]}
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
                    Pay & Complete Ticket (₹{selectedTournament.fee})
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP 5: Payment Success */}
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
                    Your spot at the stadium is locked! Receipt sent to <strong style={{ color: 'var(--color-primary)' }}>{formData.email}</strong>.
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
                    <strong style={{ color: 'var(--color-secondary)', fontFamily: 'monospace', fontSize: '1rem' }}>{regId}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>TRANSACTION ID</span>
                    <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{txnId}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>STADIUM VENUE</span>
                    <span style={{ color: '#0f172a', fontWeight: '700' }}>{selectedTournament.stadium}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>EVENT NAME</span>
                    <span style={{ color: '#0f172a', fontWeight: '700' }}>{selectedTournament.title}</span>
                  </div>

                  {isTeamMode && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>SQUAD / CLUB</span>
                      <span style={{ color: '#0f172a', fontWeight: '700' }}>{formData.teamName}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>CAPTAIN / PLAYER</span>
                    <span style={{ color: '#0f172a', fontWeight: '700' }}>{formData.captainName}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>PAID AMOUNT</span>
                    <span style={{ color: 'var(--color-success)', fontWeight: '800' }}>₹{selectedTournament.fee}.00</span>
                  </div>
                </div>

                {/* Stadium Next Steps Card */}
                <div style={{
                  background: 'rgba(255, 215, 0, 0.05)',
                  border: '2px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '32px'
                }}>
                  <Smile style={{ color: 'var(--color-accent)', flexShrink: 0 }} size={24} />
                  <div>
                    <h5 style={{ color: 'var(--color-accent)', fontWeight: '800', fontSize: '0.9rem', marginBottom: '4px' }}>Roster Next Steps</h5>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                      A Coordinator will call you on <strong>{formData.phone}</strong> in 24 hours to assign your team locker room, match jerseys, and match day timings.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <button 
                    onClick={handlePrint}
                    className="btn btn-outline"
                    style={{ width: '100%', borderRadius: '24px' }}
                  >
                    <Printer size={18} />
                    Print Ticket
                  </button>
                  <button 
                    onClick={handleRestart}
                    className="btn btn-primary"
                    style={{ width: '100%', borderRadius: '24px' }}
                  >
                    Other Sports
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

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
            <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); alert("SSL billing gateway verified by top banks."); }}>Security Gateway</a>
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
