import React, { useState, useEffect } from 'react';
import { 
  Trophy, Calendar, Users, Target, ShieldCheck, 
  MapPin, Clock, ArrowRight, ArrowLeft, Download, Check, AlertCircle,
  Printer, Award, Sparkles, Smile
} from 'lucide-react';
import { getArenovaLogo } from './utils/secureAsset';
import { ErrorBoundary } from './components/ErrorBoundary';

// Mock Stadium Tournament Data
const TOURNAMENTS = [
  {
    id: 'arn-cricket-26',
    title: 'Arenova Under-19 Cricket Cup 🏏',
    game: 'Cricket (T20 Format)',
    stadium: 'Wankhede Arena, Mumbai 🏟️',
    prizePool: '₹10,00,000 + Gold Trophy 🏆',
    date: 'Oct 10 - Oct 16, 2026',
    regDeadline: 'Oct 05, 2026',
    teamSize: 'Squad (11 Players + 4 Subs)',
    fee: 999,
    emoji: '🏏',
    description: 'Hear the crowd roar! Step onto the professional pitch under the stadium lights. Get ready for an action-packed T20 tournament designed for school and academy squads.',
    rules: [
      'All players must be under 19 as of Jan 1st, 2026 (ID check mandatory).',
      'Leather balls and professional safety kits will be provided.',
      'T20 rules apply; matches will be played in full day/night slots.',
      'A qualified umpire panel will officiate all matches.'
    ]
  },
  {
    id: 'arn-badminton-26',
    title: 'Arenova Junior Badminton Stars 🏸',
    game: 'Badminton (Singles/Doubles)',
    stadium: 'Indira Gandhi Indoor Stadium 🏟️',
    prizePool: '₹2,50,000 + Yonex Pro Kits 🎒',
    date: 'Oct 24 - Oct 28, 2026',
    regDeadline: 'Oct 20, 2026',
    teamSize: 'Solo (1v1) or Duo (2v2)',
    fee: 299,
    emoji: '🏸',
    description: 'Smash your way to the top! An exciting indoor court tournament with age categories: Under-14 and Under-17. Showcase your speed and precision on dynamic synthetic courts.',
    rules: [
      'Synthetic courts require non-marking badminton shoes.',
      'Yonex feather shuttles will be used for all league matches.',
      'Knockout system: best of 3 sets, 21 points format.',
      'Parents/Coaches are allowed in designated spectator stands.'
    ]
  },
  {
    id: 'arn-basketball-26',
    title: 'Arenova Basketball Court Showdown 🏀',
    game: 'Basketball (3v3 & 5v5)',
    stadium: 'Arenova Central Court, Bengaluru 🏟️',
    prizePool: '₹5,00,000 + Jordan Sneakers 👟',
    date: 'Nov 05 - Nov 10, 2026',
    regDeadline: 'Nov 01, 2026',
    teamSize: 'Squad (5 Players + 3 Subs)',
    fee: 499,
    emoji: '🏀',
    description: 'Dribble, shoot, and score! Join the absolute best basketball championship on high-tech wooden courts. The ultimate tournament with full scoreboard, music, and snack bars.',
    rules: [
      'Standard FIBA gameplay regulations apply.',
      'Team jerseys must have clear unique back numbering.',
      'Medical first-aid team will be present at the courtside.',
      'Fair play awards will be distributed after the final matches.'
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
    // Initialize roster inputs: Cricket needs more, Badminton needs less
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
      '🤖 Syncing with banking servers safely...',
      '⚽ Authorizing registration tokens in real-time...',
      '🌟 Locking your squad slot in the stadium ledger...',
      '🎉 Securing transaction receipt credentials...'
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
              🌟 AI-Powered Sports Arena
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, padding: '40px 0' }}>
        <div className="container animate-fade-in">
          
          {/* STEP 1: Tournament List */}
          {step === 'list' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  marginBottom: '16px',
                  color: 'var(--color-primary-light)'
                }}>
                  <Sparkles size={14} /> Play, Compete, Win Golden Trophies!
                </div>
                <h1 className="text-gradient-ai" style={{ fontSize: '2.8rem', fontWeight: '900', marginBottom: '16px', letterSpacing: '-0.5px' }}>
                  Stadium Sports Tournaments
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', maxWidth: '650px', margin: '0 auto', fontSize: '1.1rem', fontWeight: '500' }}>
                  Choose your physical sport category, register your squad or solo entry, and play live inside top professional stadiums with real crowd support!
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '32px'
              }}>
                {TOURNAMENTS.map(t => (
                  <div key={t.id} className="glass-card" style={{
                    padding: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '24px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Floating background shape for AI kid style */}
                    <div style={{
                      position: 'absolute',
                      right: '-30px',
                      top: '-30px',
                      width: '120px',
                      height: '120px',
                      background: 'radial-gradient(circle, rgba(0, 194, 133, 0.1) 0%, transparent 70%)',
                      zIndex: 1
                    }} />

                    <div style={{ zIndex: 2 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <span className="badge-glow-blue" style={{
                          fontSize: '0.8rem',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontWeight: 800
                        }}>{t.game}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-accent)', fontWeight: '800', fontSize: '1.05rem' }}>
                          <Trophy size={18} />
                          <span>{t.prizePool.split(' + ')[0]}</span>
                        </div>
                      </div>

                      <h3 style={{ fontSize: '1.45rem', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {t.title}
                      </h3>
                      
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: '1.6' }}>
                        {t.description}
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={16} style={{ color: 'var(--color-secondary-light)' }} />
                          <span style={{ color: '#fff', fontWeight: 600 }}>{t.stadium}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={16} />
                          <span>Dates: {t.date}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Users size={16} />
                          <span>Squad Format: {t.teamSize}</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleSelectTournament(t)}
                      className="btn btn-primary"
                      style={{ width: '100%', zIndex: 2 }}
                    >
                      Inspect Tournament
                      <ArrowRight size={18} />
                    </button>
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
                Back to Sports List
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
                    }}>Entry: ₹{selectedTournament.fee}</span>
                  </div>

                  <h2 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '16px' }}>{selectedTournament.title}</h2>
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
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>Grand Prizes</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--color-secondary-light)' }}>{selectedTournament.prizePool}</div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '14px', border: '2px solid var(--color-border)', textAlign: 'center' }}>
                    <MapPin style={{ color: 'var(--color-primary-light)', marginBottom: '8px' }} size={28} />
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>Host Stadium</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>{selectedTournament.stadium}</div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '14px', border: '2px solid var(--color-border)', textAlign: 'center' }}>
                    <Users style={{ color: 'var(--color-accent-pink)', marginBottom: '8px' }} size={28} />
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>Format</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>{selectedTournament.teamSize}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '40px', background: 'rgba(255, 255, 255, 0.01)', padding: '24px', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck style={{ color: 'var(--color-secondary-light)' }} />
                    Stadium Fairplay Rules
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
                  Start Registration Now
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
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px', color: 'var(--color-primary-light)' }}>Roster Names</h4>
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
                    background: 'rgba(7, 14, 32, 0.96)',
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
                      border: '4px solid var(--color-secondary-light)',
                      borderTopColor: 'transparent',
                      animation: 'spin 1s linear infinite',
                      marginBottom: '24px',
                      boxShadow: 'var(--shadow-glow-green)'
                    }} />
                    
                    <h3 style={{ fontSize: '1.35rem', fontWeight: '900', marginBottom: '12px' }}>
                      Secure Gateway Link
                    </h3>
                    
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', maxWidth: '380px' }}>
                      {['🤖 Syncing with banking servers safely...',
                        '⚽ Authorizing registration tokens in real-time...',
                        '🌟 Locking your squad slot in the stadium ledger...',
                        '🎉 Securing transaction receipt credentials...'][processingState]}
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
                    <span style={{ color: 'var(--color-secondary-light)' }}>₹{selectedTournament.fee}.00</span>
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
                
                {/* Print Layout Override styling block */}
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
                  
                  <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#ffffff', marginBottom: '8px' }}>
                    Registration Confirmed! 🎉
                  </h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                    Your spot at the stadium is locked! Receipt sent to <strong style={{ color: '#fff' }}>{formData.email}</strong>.
                  </p>
                </div>

                {/* Ticket Details */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '2px solid var(--color-border)',
                  borderRadius: '14px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  marginBottom: '32px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>REGISTRATION ID</span>
                    <strong style={{ color: 'var(--color-secondary-light)', fontFamily: 'monospace', fontSize: '1rem' }}>{regId}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>TRANSACTION ID</span>
                    <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{txnId}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>STADIUM VENUE</span>
                    <span style={{ color: '#fff', fontWeight: '700' }}>{selectedTournament.stadium}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>EVENT NAME</span>
                    <span style={{ color: '#fff', fontWeight: '700' }}>{selectedTournament.title}</span>
                  </div>

                  {isTeamMode && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>SQUAD / CLUB</span>
                      <span style={{ color: '#fff', fontWeight: '700' }}>{formData.teamName}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>CAPTAIN / PLAYER</span>
                    <span style={{ color: '#fff', fontWeight: '700' }}>{formData.captainName}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>PAID AMOUNT</span>
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
