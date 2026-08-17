import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Calendar, Users, Gamepad2, CreditCard, CheckCircle2, ShieldCheck, 
  MapPin, Clock, ArrowRight, ArrowLeft, Download, Check, Sparkles, AlertCircle,
  HelpCircle, ExternalLink, Printer
} from 'lucide-react';
import { getArenovaLogo } from './utils/secureAsset';
import { ErrorBoundary } from './components/ErrorBoundary';

// Mock Tournament Data
const TOURNAMENTS = [
  {
    id: 'arn-bgmi-26',
    title: 'Arenova BGMI Master Series',
    game: 'BGMI (Mobile)',
    prizePool: '₹5,00,000',
    date: 'Sept 15 - Sept 20, 2026',
    regDeadline: 'Sept 12, 2026',
    teamSize: 'Squad (4 Players + 1 Sub)',
    fee: 499,
    description: 'The ultimate battleground championship returns. Bring your squad, drop into Erangel, and claim the championship trophy.',
    rules: [
      'All players must be level 40+ to register.',
      'Emulators are strictly prohibited.',
      'Detailed schedule and map order will be emailed 24 hours prior.',
      'Decisions made by the Arenova admins are final.'
    ]
  },
  {
    id: 'arn-val-26',
    title: 'Arenova Valorant Open Rivals',
    game: 'Valorant (PC)',
    prizePool: '₹3,00,000',
    date: 'Oct 02 - Oct 08, 2026',
    regDeadline: 'Sept 28, 2026',
    teamSize: '5v5 Team (5 Players)',
    fee: 799,
    description: 'Tactical shooter dominance starts here. Compete on Mumbai servers against the best squads in India for national glory.',
    rules: [
      'Matches will be hosted on Mumbai server.',
      'Rank requirement: Diamond 1 or above recommended.',
      'Vanguard anti-cheat must be active.',
      'No match rescheduling will be entertained.'
    ]
  },
  {
    id: 'arn-fifa-26',
    title: 'Arenova FIFA 26 Pro Cup',
    game: 'EA FC 26 (Console/PC)',
    prizePool: '₹1,50,000',
    date: 'Oct 18 - Oct 22, 2026',
    regDeadline: 'Oct 15, 2026',
    teamSize: 'Solo (1v1)',
    fee: 199,
    description: 'Showcase your controller skills in the EA Sports FC 26 launch cup. Battle through the knockout rounds to lift the golden boot.',
    rules: [
      'Platform: PS5 / Xbox Series X/S / PC.',
      'Tactical defending is mandatory.',
      'Standard match time: 6 minutes halves.',
      'Connection requirement: Stable broadband wired connection.'
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
    players: ['', '', '', ''] // Squad details
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

  // Load logo dynamically using the secure asset helper
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
    // Initialize default squad sizes based on tournament rules
    const defaultPlayerCount = t.id.includes('fifa') ? 0 : 4;
    setIsTeamMode(!t.id.includes('fifa'));
    setFormData({
      teamName: '',
      captainName: '',
      email: '',
      phone: '',
      players: Array(defaultPlayerCount).fill('')
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

  // Simulate payment processing flow with status updates
  const handleProcessPayment = (e) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    setProcessingState(0);

    const states = [
      'Establishing secure SSL channel with banking servers...',
      'Verifying payment parameters and routing coordinates...',
      'Authorizing transaction clearance token...',
      'Finalizing booking reservation and generating receipts...'
    ];

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current < states.length) {
        setProcessingState(current);
      } else {
        clearInterval(interval);
        // Complete payment successfully
        const generatedReg = `ARN-26-${Math.floor(100000 + Math.random() * 900000)}`;
        const generatedTxn = `TXN-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
        setRegId(generatedReg);
        setTxnId(generatedTxn);
        setIsProcessingPayment(false);
        setStep('success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 1500);
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
      <header className="glass-card" style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderWidth: '0 0 1px 0',
        borderRadius: 0,
        background: 'rgba(7, 11, 19, 0.85)',
        backdropFilter: 'blur(16px)'
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
                style={{ height: '40px', objectFit: 'contain' }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Gamepad2 className="pulse-glow-secondary" style={{ color: 'var(--color-secondary)' }} size={32} />
                <span style={{ fontSize: '1.5rem', fontWeight: '800', tracking: '1px' }}>ARENOVA</span>
              </div>
            )}
          </div>
          <div>
            <span style={{
              fontSize: '0.8rem',
              background: 'rgba(0, 158, 122, 0.1)',
              color: 'var(--color-secondary-light)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontWeight: 600,
              border: '1px solid rgba(0, 158, 122, 0.2)'
            }}>
              🚀 LIVE CHAMPIONSHIPS
            </span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main style={{ flex: 1, padding: '40px 0' }}>
        <div className="container animate-fade-in">
          
          {/* STEP 1: Tournament List */}
          {step === 'list' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <h1 className="text-gradient-blue" style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px' }}>
                  Upcoming Esports Tournaments
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem' }}>
                  Register today and test your skills against top competitive tier teams. Secure gateways, instant confirmations, and professional league match structures.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px'
              }}>
                {TOURNAMENTS.map(t => (
                  <div key={t.id} className="glass-card" style={{
                    padding: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '24px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          background: 'rgba(0, 132, 255, 0.1)',
                          color: 'var(--color-primary-light)',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontWeight: 700
                        }}>{t.game}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-secondary-light)', fontWeight: '700' }}>
                          <Trophy size={16} />
                          <span>{t.prizePool}</span>
                        </div>
                      </div>

                      <h3 style={{ fontSize: '1.35rem', fontWeight: '700', marginBottom: '12px' }}>{t.title}</h3>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {t.description}
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={14} />
                          <span>Schedule: {t.date}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Users size={14} />
                          <span>Format: {t.teamSize}</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleSelectTournament(t)}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      View Details
                      <ArrowRight size={16} />
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
                style={{ marginBottom: '24px' }}
              >
                <ArrowLeft size={16} />
                Back to Tournaments
              </button>

              <div className="glass-card" style={{ padding: '40px' }}>
                <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '24px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      background: 'rgba(0, 132, 255, 0.1)',
                      color: 'var(--color-primary-light)',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontWeight: 700
                    }}>{selectedTournament.game}</span>
                    <span style={{
                      fontSize: '0.75rem',
                      background: 'rgba(0, 158, 122, 0.1)',
                      color: 'var(--color-secondary-light)',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontWeight: 700
                    }}>Entry Fee: ₹{selectedTournament.fee}</span>
                  </div>

                  <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '12px' }}>{selectedTournament.title}</h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', lineHeight: '1.7' }}>
                    {selectedTournament.description}
                  </p>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '20px',
                  marginBottom: '32px'
                }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px' }}>Prize Pool</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-secondary-light)' }}>{selectedTournament.prizePool}</div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px' }}>Registration Ends</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-error)' }}>{selectedTournament.regDeadline}</div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px' }}>Match Format</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>{selectedTournament.teamSize}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '40px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck style={{ color: 'var(--color-secondary)' }} />
                    Rules & Guidelines
                  </h4>
                  <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                    {selectedTournament.rules.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </div>

                <button 
                  onClick={handleGoToRegister}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '16px' }}
                >
                  Register Now
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
                style={{ marginBottom: '24px' }}
              >
                <ArrowLeft size={16} />
                Back to Details
              </button>

              <div className="glass-card" style={{ padding: '40px' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '8px' }}>Team Registration</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px', fontSize: '0.9rem' }}>
                  Please fill out the captain's contact info and player IDs correctly. Tournament invites will be shared using these details.
                </p>

                <form onSubmit={handleGoToPayment}>
                  {isTeamMode && (
                    <div className="form-group">
                      <label className="form-label">Team Name *</label>
                      <input 
                        type="text" 
                        required 
                        className="form-control" 
                        placeholder="e.g. Team Arenova Gaming" 
                        value={formData.teamName}
                        onChange={(e) => handleFormChange('teamName', e.target.value)}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">{isTeamMode ? 'Captain Name *' : 'Player Name *'}</label>
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
                    <label className="form-label">Mobile Number *</label>
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
                    <div style={{ marginTop: '32px', borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>Team Roster IDs</h4>
                      {formData.players.map((p, idx) => (
                        <div key={idx} className="form-group">
                          <label className="form-label">Player #{idx + 1} Game Username *</label>
                          <input 
                            type="text" 
                            required 
                            className="form-control" 
                            placeholder={`Enter player #${idx + 1} character ID`}
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
                    Proceed to Payment (₹{selectedTournament.fee})
                    <ArrowRight size={18} />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP 4: Payment Gateway (Simulated Secure Payment) */}
          {step === 'payment' && selectedTournament && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <button 
                onClick={() => setStep('register')}
                className="btn btn-outline"
                style={{ marginBottom: '24px' }}
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
                    background: 'rgba(7, 11, 19, 0.95)',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '32px',
                    textAlign: 'center'
                  }}>
                    <div className="pulse-glow-secondary" style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      border: '4px solid var(--color-primary-light)',
                      borderTopColor: 'transparent',
                      animation: 'spin 1s linear infinite',
                      marginBottom: '24px'
                    }} />
                    
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px' }}>
                      Processing Secure Payment
                    </h3>
                    
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', maxWidth: '380px' }}>
                      {['Establishing secure SSL channel with banking servers...',
                        'Verifying payment parameters and routing coordinates...',
                        'Authorizing transaction clearance token...',
                        'Finalizing booking reservation and generating receipts...'][processingState]}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '40px' }}>
                      <ShieldCheck size={16} />
                      <span>256-bit SSL encrypted connection</span>
                    </div>
                  </div>
                )}

                <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '20px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>FEE SUMMARY</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>🛡️ SECURE BILLING</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Entry Ticket</span>
                    <span>₹{selectedTournament.fee}.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    <span>Processing & Platform Fee</span>
                    <span>₹0.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.2rem', marginTop: '16px', borderTop: '1px dashed var(--color-border)', paddingTop: '16px' }}>
                    <span>Total Amount</span>
                    <span style={{ color: 'var(--color-secondary-light)' }}>₹{selectedTournament.fee}.00</span>
                  </div>
                </div>

                <form onSubmit={handleProcessPayment}>
                  <label className="form-label" style={{ marginBottom: '16px' }}>Choose Payment Method</label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px',
                      background: paymentMethod === 'upi' ? 'rgba(0, 132, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${paymentMethod === 'upi' ? 'var(--color-primary-light)' : 'var(--color-border)'}`,
                      borderRadius: '8px',
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
                        <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>UPI (GPay / PhonePe / Paytm / BHIM)</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Pay instantly from any mobile app</div>
                      </div>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px',
                      background: paymentMethod === 'card' ? 'rgba(0, 132, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${paymentMethod === 'card' ? 'var(--color-primary-light)' : 'var(--color-border)'}`,
                      borderRadius: '8px',
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
                        <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Credit / Debit Card</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Visa, Mastercard, RuPay cards supported</div>
                      </div>
                    </label>
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="form-group">
                      <label className="form-label">UPI ID *</label>
                      <input 
                        type="text" 
                        required 
                        className="form-control" 
                        placeholder="e.g. mobile@upi"
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
                          placeholder="Name as printed on card"
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
                          <label className="form-label">Expiry Date *</label>
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
                          <label className="form-label">CVV *</label>
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
                    style={{ width: '100%', padding: '16px', marginTop: '24px' }}
                  >
                    Authorize Payment (₹{selectedTournament.fee})
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP 5: Payment Success / Confirmed Screen */}
          {step === 'success' && selectedTournament && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div className="glass-card" style={{ padding: '40px', borderTop: '4px solid var(--color-success)', overflow: 'hidden' }}>
                
                {/* Print layout optimizations style block */}
                <style dangerouslySetInnerHTML={{__html: `
                  @media print {
                    body { background: #fff !important; color: #000 !important; }
                    .glass-card { background: #fff !important; border: 1px solid #ddd !important; box-shadow: none !important; color: #000 !important; }
                    .btn, header, footer { display: none !important; }
                    .print-logo { display: block !important; margin: 0 auto 20px !important; text-align: center; }
                    .print-only { display: block !important; color: #000 !important; }
                  }
                `}} />

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--color-success)',
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px'
                  }}>
                    <CheckCircle2 size={36} />
                  </div>
                  
                  <h2 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#ffffff', marginBottom: '8px' }}>
                    Registration Confirmed!
                  </h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                    Your ticket is booked. A confirmation copy has been sent to <strong style={{ color: '#fff' }}>{formData.email}</strong>.
                  </p>
                </div>

                {/* Receipt Grid */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  marginBottom: '32px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>REGISTRATION ID</span>
                    <strong style={{ color: 'var(--color-accent)', fontFamily: 'monospace', fontSize: '0.95rem' }}>{regId}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>TRANSACTION ID</span>
                    <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{txnId}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>TOURNAMENT</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>{selectedTournament.title}</span>
                  </div>

                  {isTeamMode && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>TEAM NAME</span>
                      <span style={{ color: '#fff', fontWeight: '600' }}>{formData.teamName}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>CAPTAIN / PLAYER</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>{formData.captainName}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>AMOUNT PAID</span>
                    <span style={{ color: 'var(--color-success)', fontWeight: '700' }}>₹{selectedTournament.fee}.00</span>
                  </div>
                </div>

                {/* Important notice */}
                <div style={{
                  background: 'rgba(245, 158, 11, 0.05)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '32px'
                }}>
                  <AlertCircle style={{ color: 'var(--color-warning)', flexShrink: 0 }} size={20} />
                  <div>
                    <h5 style={{ color: 'var(--color-warning)', fontWeight: '700', fontSize: '0.85rem', marginBottom: '4px' }}>Next Steps</h5>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', lineHeight: '1.5' }}>
                      Our match coordinators will send you a WhatsApp and Email invite to the official Arenova Discord server 24 hours before the match. Please keep your character ID updated.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <button 
                    onClick={handlePrint}
                    className="btn btn-outline"
                    style={{ width: '100%' }}
                  >
                    <Printer size={16} />
                    Print Ticket
                  </button>
                  <button 
                    onClick={handleRestart}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    Browse Other Cups
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="glass-card" style={{
        marginTop: 'auto',
        borderWidth: '1px 0 0 0',
        borderRadius: 0,
        background: 'rgba(7, 11, 19, 0.95)',
        padding: '32px 0',
        fontSize: '0.85rem',
        color: 'var(--color-text-muted)'
      }}>
        <div className="container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          textAlign: 'center'
        }}>
          <div>
            <strong>ARENOVA ESPORTS LEAGUE</strong> &copy; {new Date().getFullYear()}. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '16px', color: 'var(--color-text-secondary)' }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); alert("Secure SSL billing matches international standards."); }}>Security Policy</a>
            <span>•</span>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); alert("Contact support at support@arenova.in"); }}>Help & Support</a>
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
