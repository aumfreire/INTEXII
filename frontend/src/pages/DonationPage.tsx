import { useState } from 'react';
import {
  Heart,
  Shield,
  CheckCircle,
  CreditCard,
  Loader2,
  ArrowLeft,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PrimaryButton from '../components/ui/PrimaryButton';
import SectionHeading from '../components/ui/SectionHeading';
import FormInput from '../components/ui/FormInput';
import AlertBanner from '../components/ui/AlertBanner';
import FAQAccordion from '../components/ui/FAQAccordion';
import Card from '../components/ui/Card';
import heroMain from '../assets/haven/hero-main.webp';
import '../styles/pages/donation.css';

const amounts = [25, 50, 75, 150, 300, 500];

const impactItems = [
  { amount: 25, text: 'School supplies for one girl for a full term' },
  { amount: 50, text: 'One week of trauma-informed counseling sessions' },
  { amount: 75, text: 'Educational materials and tutoring for one month' },
  { amount: 150, text: 'One month of safe housing and nutritious meals' },
  { amount: 300, text: 'Complete life skills and vocational training course' },
  { amount: 500, text: 'Full program enrollment for one girl for three months' },
];

const faqItems = [
  {
    question: 'Is my donation tax-deductible?',
    answer:
      'Yes! Haven is a registered 501(c)(3) nonprofit. All donations are tax-deductible to the fullest extent allowed by law. You will receive a receipt for your records.',
  },
  {
    question: 'Can I set up a recurring monthly donation?',
    answer:
      'Absolutely. Monthly giving is one of the most impactful ways to support our mission. Select the "Give Monthly" option on the donation form to provide consistent, reliable support.',
  },
  {
    question: 'How are donations used?',
    answer:
      'Donations go directly to programs that protect and empower girls — including emergency shelter, trauma counseling, education support, life skills training, and community reintegration.',
  },
  {
    question: 'Is my payment information secure?',
    answer:
      'Absolutely. All donations are processed through encrypted, secure channels. Your personal and financial information is never stored or shared with third parties.',
  },
  {
    question: 'Can I donate in honor or memory of someone?',
    answer:
      'Yes, you can add a dedication or personal message when making your donation. This is a meaningful way to honor someone special while supporting vulnerable girls.',
  },
];

const whyGiveCards = [
  {
    title: 'Direct Impact',
    description:
      'Every dollar goes toward creating safety, healing, and opportunity for girls who have experienced abuse, trafficking, and neglect.',
    accent: 'var(--color-sage)',
  },
  {
    title: 'Lasting Transformation',
    description:
      'Your support helps build futures — through education, counseling, and programs that create real, measurable change in girls\' lives.',
    accent: 'var(--color-primary)',
  },
  {
    title: 'Community of Protectors',
    description:
      'Join a community of donors who believe in the power of compassion and the potential of every girl to overcome and thrive.',
    accent: 'var(--color-primary-light)',
  },
];

export default function DonationPage() {
  const [donationType, setDonationType] = useState<'monthly' | 'one-time'>(
    'monthly'
  );
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dedication, setDedication] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [zip, setZip] = useState('');
  const [coverFees, setCoverFees] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const activeAmount = customAmount
    ? parseFloat(customAmount)
    : selectedAmount;

  const annualImpact =
    donationType === 'monthly' && activeAmount
      ? activeAmount * 12
      : null;

  const handleAmountClick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
  };

  const handleCustomAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    setCustomAmount(val);
    if (val) setSelectedAmount(null);
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!activeAmount || activeAmount <= 0)
      newErrors.amount = 'Please select or enter an amount';
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!cardNumber.trim()) newErrors.cardNumber = 'Card number is required';
    if (!expiry.trim()) newErrors.expiry = 'Expiration is required';
    if (!cvc.trim()) newErrors.cvc = 'CVC is required';
    if (!zip.trim()) newErrors.zip = 'ZIP code is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
    }, 1500);
  };

  const resetForm = () => {
    setShowSuccess(false);
    setSelectedAmount(50);
    setCustomAmount('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setDedication('');
    setCardNumber('');
    setExpiry('');
    setCvc('');
    setZip('');
    setCoverFees(false);
    setDonationType('monthly');
  };

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <>
      {/* Hero — full-width background like landing page */}
      <section
        className="donation-hero"
        style={{ backgroundImage: `url(${heroMain})` }}
      >
        <div className="donation-hero-overlay" />
        <div
          className="container donation-hero-content"
          style={{ padding: '0 24px' }}
        >
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'rgba(250,246,240,0.7)',
              fontSize: '0.9rem',
              textDecoration: 'none',
              marginBottom: '20px',
            }}
          >
            <ArrowLeft size={16} />
            Back to Haven
          </Link>
          <div className="donation-hero-label">
            <span className="donation-hero-label-line" />
            MAKE A DIFFERENCE
          </div>
          <h1>Your Gift Changes a Girl&rsquo;s Story.</h1>
          <p className="donation-hero-subtitle">
            Every dollar you give goes directly toward shelter, counseling,
            education, and long-term support for girls who need it most.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="donation-content">
        <div className="container" style={{ padding: '0 24px' }}>
          {showSuccess ? (
            <div className="donation-success">
              <CheckCircle size={64} className="success-icon" />
              <h2 style={{ marginBottom: '12px' }}>Thank You!</h2>
              <p
                style={{
                  color: 'var(--color-muted)',
                  fontSize: '1.1rem',
                  maxWidth: '480px',
                  margin: '0 auto 28px',
                  lineHeight: '1.7',
                }}
              >
                Your {donationType === 'monthly' ? 'monthly ' : ''}donation of
                <strong> ${activeAmount?.toFixed(2)}</strong> will help create
                safety and healing for girls who need it most.
              </p>
              <PrimaryButton onClick={resetForm}>
                Make Another Donation
              </PrimaryButton>
            </div>
          ) : (
            <div className="row g-4">
              {/* Left: Stepped Form */}
              <div className="col-lg-8">
                <form onSubmit={handleSubmit} noValidate>
                  {/* Step 1: Giving Type */}
                  <div className="donate-step-card">
                    <h3 className="donate-step-title">
                      <span className="donate-step-num">1.</span> Choose Your
                      Giving Type
                    </h3>
                    <div className="giving-type-row">
                      <button
                        type="button"
                        className={`giving-type-btn ${donationType === 'monthly' ? 'active' : ''}`}
                        onClick={() => setDonationType('monthly')}
                      >
                        <RefreshCw size={18} />
                        Give Monthly
                        {donationType === 'monthly' && (
                          <span className="giving-type-badge">Recommended</span>
                        )}
                      </button>
                      <button
                        type="button"
                        className={`giving-type-btn ${donationType === 'one-time' ? 'active' : ''}`}
                        onClick={() => setDonationType('one-time')}
                      >
                        <Heart size={18} />
                        Give Once
                      </button>
                    </div>
                    {donationType === 'monthly' && (
                      <p className="giving-type-note">
                        <CheckCircle size={14} />
                        Monthly giving provides girls with consistent, reliable
                        support. You can cancel anytime.
                      </p>
                    )}
                  </div>

                  {/* Step 2: Amount */}
                  <div className="donate-step-card">
                    <h3 className="donate-step-title">
                      <span className="donate-step-num">2.</span> Select Your
                      Amount
                    </h3>
                    <div className="amount-grid">
                      {amounts.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          className={`amount-btn ${selectedAmount === amt && !customAmount ? 'selected' : ''}`}
                          onClick={() => handleAmountClick(amt)}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--color-muted)',
                          fontWeight: 500,
                        }}
                      >
                        $
                      </span>
                      <input
                        type="text"
                        placeholder="Enter custom amount"
                        value={customAmount}
                        onChange={handleCustomAmountChange}
                        className="custom-amount-input"
                      />
                    </div>
                    {errors.amount && (
                      <span className="field-error">{errors.amount}</span>
                    )}
                  </div>

                  {/* Step 3: Your Information */}
                  <div className="donate-step-card">
                    <h3 className="donate-step-title">
                      <span className="donate-step-num">3.</span> Your
                      Information
                    </h3>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <FormInput
                          label="First Name"
                          name="firstName"
                          value={firstName}
                          onChange={(e) => {
                            setFirstName(e.target.value);
                            clearError('firstName');
                          }}
                          placeholder="Jane"
                          error={errors.firstName}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <FormInput
                          label="Last Name"
                          name="lastName"
                          value={lastName}
                          onChange={(e) => {
                            setLastName(e.target.value);
                            clearError('lastName');
                          }}
                          placeholder="Smith"
                          error={errors.lastName}
                          required
                        />
                      </div>
                    </div>
                    <FormInput
                      label="Email Address"
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearError('email');
                      }}
                      placeholder="jane@example.com"
                      error={errors.email}
                      required
                    />
                    <FormInput
                      label="Dedication (optional)"
                      name="dedication"
                      value={dedication}
                      onChange={(e) => setDedication(e.target.value)}
                      placeholder="In honor of..."
                    />
                  </div>

                  {/* Step 4: Payment */}
                  <div className="donate-step-card">
                    <h3 className="donate-step-title">
                      <span className="donate-step-num">4.</span>
                      <CreditCard
                        size={18}
                        style={{
                          display: 'inline',
                          verticalAlign: 'middle',
                          marginRight: '6px',
                        }}
                      />
                      Payment Details
                    </h3>
                    <AlertBanner
                      message="This is a design prototype. No real payment will be processed."
                      type="info"
                    />
                    <FormInput
                      label="Card Number"
                      name="cardNumber"
                      value={cardNumber}
                      onChange={(e) => {
                        setCardNumber(e.target.value);
                        clearError('cardNumber');
                      }}
                      placeholder="1234 5678 9012 3456"
                      error={errors.cardNumber}
                      required
                    />
                    <div className="row g-3">
                      <div className="col-4">
                        <FormInput
                          label="MM/YY"
                          name="expiry"
                          value={expiry}
                          onChange={(e) => {
                            setExpiry(e.target.value);
                            clearError('expiry');
                          }}
                          placeholder="MM/YY"
                          error={errors.expiry}
                          required
                        />
                      </div>
                      <div className="col-4">
                        <FormInput
                          label="CVC"
                          name="cvc"
                          value={cvc}
                          onChange={(e) => {
                            setCvc(e.target.value);
                            clearError('cvc');
                          }}
                          placeholder="123"
                          error={errors.cvc}
                          required
                        />
                      </div>
                      <div className="col-4">
                        <FormInput
                          label="ZIP Code"
                          name="zip"
                          value={zip}
                          onChange={(e) => {
                            setZip(e.target.value);
                            clearError('zip');
                          }}
                          placeholder="00000"
                          error={errors.zip}
                          required
                        />
                      </div>
                    </div>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '24px',
                        fontSize: '0.9rem',
                        color: 'var(--color-dark)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={coverFees}
                        onChange={(e) => setCoverFees(e.target.checked)}
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      Cover processing fees so 100% goes to the mission
                    </label>

                    <PrimaryButton
                      type="submit"
                      fullWidth
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="spin-icon" />{' '}
                          Processing...
                        </>
                      ) : (
                        <>
                          Complete{' '}
                          {donationType === 'monthly' ? 'Monthly ' : ''}
                          Donation
                          {activeAmount && activeAmount > 0
                            ? ` — $${activeAmount.toFixed(2)}`
                            : ''}
                          {donationType === 'monthly' ? '/mo' : ''}
                        </>
                      )}
                    </PrimaryButton>
                  </div>
                </form>
              </div>

              {/* Right: Sidebar */}
              <div className="col-lg-4">
                <div className="donate-sidebar">
                  {/* Gift Summary */}
                  <div className="gift-summary-card">
                    <div className="gift-summary-header">
                      <h3>Your Gift Summary</h3>
                    </div>
                    <div className="gift-summary-body">
                      <div className="gift-summary-row">
                        <span>Type</span>
                        <strong
                          style={{ color: 'var(--color-primary-dark)' }}
                        >
                          {donationType === 'monthly'
                            ? 'Monthly Gift'
                            : 'One-Time Gift'}
                        </strong>
                      </div>
                      <div className="gift-summary-row">
                        <span>Amount</span>
                        <strong
                          style={{
                            color: 'var(--color-primary-dark)',
                            fontSize: '1.1rem',
                          }}
                        >
                          {activeAmount && activeAmount > 0
                            ? `$${activeAmount.toFixed(0)}`
                            : '—'}
                        </strong>
                      </div>
                      {annualImpact && (
                        <div className="gift-summary-row">
                          <span>Annual Impact</span>
                          <strong
                            style={{ color: 'var(--color-primary-dark)' }}
                          >
                            ${annualImpact.toLocaleString()}/year
                          </strong>
                        </div>
                      )}
                      <div className="gift-summary-secure">
                        <Shield size={14} />
                        Secure &middot; Encrypted &middot; Tax-deductible
                      </div>
                    </div>
                  </div>

                  {/* What Your Gift Supports */}
                  <div className="gift-supports-card">
                    <h3>What Your Gift Supports</h3>
                    <div className="gift-supports-list">
                      {impactItems.map((item, i) => (
                        <div className="gift-supports-item" key={i}>
                          <BookOpen
                            size={16}
                            style={{
                              color: 'var(--color-primary)',
                              flexShrink: 0,
                              marginTop: '2px',
                            }}
                          />
                          <div>
                            <strong>${item.amount} provides</strong>
                            <p>{item.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Extra sections */}
      <section className="donation-extra">
        <div className="container" style={{ padding: '0 24px' }}>
          <SectionHeading
            title="Why Give?"
            subtitle="Your donation creates ripples of change that extend far beyond a single moment."
          />
          <div className="row g-4 mt-2 mb-5">
            {whyGiveCards.map((card, i) => (
              <div className="col-md-4" key={i}>
                <Card
                  title={card.title}
                  description={card.description}
                  accentColor={card.accent}
                />
              </div>
            ))}
          </div>

          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <SectionHeading title="Common Questions" />
            <FAQAccordion items={faqItems} />
          </div>

          <div
            style={{
              textAlign: 'center',
              marginTop: '48px',
              padding: '24px',
            }}
          >
            <Heart
              size={24}
              style={{
                color: 'var(--color-primary-light)',
                marginBottom: '12px',
              }}
            />
            <p
              style={{
                color: 'var(--color-muted)',
                fontSize: '1rem',
                fontStyle: 'italic',
                maxWidth: '500px',
                margin: '0 auto',
                lineHeight: '1.7',
              }}
            >
              Every gift, no matter the size, helps create meaningful change in
              the life of a girl who needs it.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
