import { useState } from 'react';
import {
  Heart,
  Lock,
  Shield,
  CheckCircle,
  CreditCard,
  Loader2,
  Sparkles,
} from 'lucide-react';
import PrimaryButton from '../components/ui/PrimaryButton';
import SectionHeading from '../components/ui/SectionHeading';
import FormInput from '../components/ui/FormInput';
import AlertBanner from '../components/ui/AlertBanner';
import TestimonialCard from '../components/ui/TestimonialCard';
import FAQAccordion from '../components/ui/FAQAccordion';
import Card from '../components/ui/Card';
import '../styles/pages/donation.css';

const amounts = [25, 50, 100, 250];

const impactItems = [
  { amount: 25, text: 'Provides essential supplies for a girl in need' },
  { amount: 50, text: 'Supports mentorship resources for one month' },
  { amount: 100, text: 'Funds program needs and learning materials' },
  { amount: 250, text: 'Helps sustain safe spaces and ongoing care' },
];

const faqItems = [
  {
    question: 'Is my donation secure?',
    answer:
      'Absolutely. All donations are processed through encrypted, secure channels. Your personal and financial information is never stored or shared.',
  },
  {
    question: 'Can I donate monthly?',
    answer:
      'Yes! Monthly giving is one of the most impactful ways to support our mission. You can choose the monthly option on our donation form to set up recurring support.',
  },
  {
    question: 'Will I receive a receipt?',
    answer:
      'Yes, you will receive an email receipt immediately after your donation. All gifts are tax-deductible, and we provide annual giving summaries upon request.',
  },
  {
    question: 'How are donations used?',
    answer:
      'Donations go directly to programs that support girls — including safe housing, mentorship, education, and emotional care. We are committed to transparent use of every dollar.',
  },
  {
    question: 'Can I dedicate my gift?',
    answer:
      'Yes, you can add a dedication or personal message when making your donation. This is a meaningful way to honor someone special while supporting our mission.',
  },
];

const whyGiveCards = [
  {
    title: 'Direct Impact',
    description:
      'Every dollar goes toward creating safety, healing, and opportunity for girls who need it most.',
    accent: 'var(--color-sage-green)',
  },
  {
    title: 'Lasting Change',
    description:
      'Your support helps build futures — through education, mentorship, and programs that create real transformation.',
    accent: 'var(--color-lavender)',
  },
  {
    title: 'Community of Care',
    description:
      'Join a community of donors who believe in the power of compassion and the potential of every girl.',
    accent: 'var(--color-peach-accent)',
  },
];

export default function DonationPage() {
  const [donationType, setDonationType] = useState<'one-time' | 'monthly'>(
    'one-time'
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
    setDonationType('one-time');
  };

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <>
      {/* Hero */}
      <section className="donation-hero">
        <div className="container" style={{ padding: '0 24px' }}>
          <h1>Make a Difference Today</h1>
          <p>
            Your generosity helps create safety, healing, and opportunity for
            girls who need it most. Every gift matters.
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
                meaningful change in the lives of girls who need it most.
              </p>
              <PrimaryButton onClick={resetForm}>
                Make Another Donation
              </PrimaryButton>
            </div>
          ) : (
            <div className="row g-4">
              {/* Left: Form */}
              <div className="col-lg-7">
                <div className="donation-form-card">
                  <form onSubmit={handleSubmit} noValidate>
                    {/* Type toggle */}
                    <div className="donation-type-toggle">
                      <button
                        type="button"
                        className={`donation-type-btn ${donationType === 'one-time' ? 'active' : ''}`}
                        onClick={() => setDonationType('one-time')}
                      >
                        One-Time
                      </button>
                      <button
                        type="button"
                        className={`donation-type-btn ${donationType === 'monthly' ? 'active' : ''}`}
                        onClick={() => setDonationType('monthly')}
                      >
                        Monthly
                      </button>
                    </div>

                    {/* Amounts */}
                    <p className="form-section-title">Choose an Amount</p>
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
                    <div style={{ marginBottom: '24px' }}>
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
                          placeholder="Custom amount"
                          value={customAmount}
                          onChange={handleCustomAmountChange}
                          style={{
                            width: '100%',
                            padding: '10px 12px 10px 28px',
                            border: `1.5px solid ${errors.amount ? 'var(--color-cta)' : 'var(--color-light-gray)'}`,
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.95rem',
                            fontFamily: 'var(--font-body)',
                            color: 'var(--color-charcoal)',
                            outline: 'none',
                            transition:
                              'border-color var(--transition-fast), box-shadow var(--transition-fast)',
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor =
                              'var(--color-lavender)';
                            e.currentTarget.style.boxShadow =
                              '0 0 0 3px rgba(151,142,196,0.2)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor =
                              'var(--color-light-gray)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                      {errors.amount && (
                        <span
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--color-cta)',
                            marginTop: '4px',
                            display: 'block',
                          }}
                        >
                          {errors.amount}
                        </span>
                      )}
                    </div>

                    {/* Donor Info */}
                    <p className="form-section-title">Your Information</p>
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

                    {/* Payment */}
                    <p className="form-section-title">
                      <CreditCard
                        size={18}
                        style={{
                          display: 'inline',
                          verticalAlign: 'middle',
                          marginRight: '6px',
                        }}
                      />
                      Payment Details
                    </p>
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

                    {/* Cover fees */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '24px',
                        fontSize: '0.9rem',
                        color: 'var(--color-charcoal)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={coverFees}
                        onChange={(e) => setCoverFees(e.target.checked)}
                        style={{ accentColor: 'var(--color-cta)' }}
                      />
                      Cover processing fees so 100% goes to the mission
                    </label>

                    {/* Submit */}
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
                          Donate
                          {activeAmount && activeAmount > 0
                            ? ` $${activeAmount.toFixed(2)}`
                            : ''}{' '}
                          Now
                        </>
                      )}
                    </PrimaryButton>
                  </form>
                </div>

                {/* Monthly encouragement */}
                {donationType === 'one-time' && (
                  <div className="monthly-callout">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                      }}
                    >
                      <Sparkles
                        size={20}
                        style={{
                          color: 'var(--color-lavender)',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      />
                      <div>
                        <p
                          style={{
                            fontWeight: 600,
                            marginBottom: '4px',
                            fontSize: '0.95rem',
                          }}
                        >
                          Consider Monthly Giving
                        </p>
                        <p
                          style={{
                            color: 'var(--color-muted)',
                            fontSize: '0.9rem',
                            marginBottom: '8px',
                            lineHeight: '1.6',
                          }}
                        >
                          Monthly donors provide the steady, reliable support
                          that helps us plan ahead and sustain programs
                          year-round.
                        </p>
                        <button
                          onClick={() => setDonationType('monthly')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-cta)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '0.9rem',
                            fontFamily: 'var(--font-body)',
                          }}
                        >
                          Switch to monthly &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Sidebar */}
              <div className="col-lg-5">
                <div className="impact-sidebar">
                  {/* Impact panel */}
                  <div className="impact-panel">
                    <h3
                      style={{
                        fontSize: '1.15rem',
                        marginBottom: '16px',
                      }}
                    >
                      What Your Gift Can Do
                    </h3>
                    {impactItems.map((item, i) => (
                      <div className="impact-item" key={i}>
                        <CheckCircle
                          size={18}
                          style={{
                            color: 'var(--color-sage-green)',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        />
                        <p
                          style={{
                            fontSize: '0.9rem',
                            lineHeight: '1.5',
                            marginBottom: 0,
                            color: 'var(--color-charcoal)',
                          }}
                        >
                          <strong>${item.amount}</strong> — {item.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Trust cues */}
                  <div
                    style={{
                      padding: '20px 28px',
                      backgroundColor: 'var(--color-white)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-sm)',
                      marginBottom: '20px',
                    }}
                  >
                    <div className="trust-cue">
                      <Lock size={18} style={{ color: 'var(--color-sage-green)' }} />
                      <span>Secure & Encrypted</span>
                    </div>
                    <div className="trust-cue">
                      <Shield
                        size={18}
                        style={{ color: 'var(--color-sage-green)' }}
                      />
                      <span>Tax Deductible</span>
                    </div>
                    <div className="trust-cue">
                      <Heart
                        size={18}
                        style={{ color: 'var(--color-sage-green)' }}
                      />
                      <span>100% Supports Our Mission</span>
                    </div>
                  </div>

                  {/* Testimonial */}
                  <TestimonialCard
                    quote="Giving to Haven of Hope is one of the most meaningful things I do each month. Knowing that my contribution directly supports a girl's safety and growth makes all the difference."
                    name="Rebecca Owens"
                    role="Monthly Donor since 2022"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Extra sections */}
      <section className="donation-extra">
        <div className="container" style={{ padding: '0 24px' }}>
          {/* Why Give */}
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

          {/* FAQ */}
          <div
            style={{
              maxWidth: '700px',
              margin: '0 auto',
            }}
          >
            <SectionHeading title="Common Questions" />
            <FAQAccordion items={faqItems} />
          </div>

          {/* Reassurance */}
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
                color: 'var(--color-rose-accent)',
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
