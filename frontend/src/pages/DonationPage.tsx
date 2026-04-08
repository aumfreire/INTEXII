import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
import { useAuth } from '../context/useAuth';
import { createMyDonation, getManagedProfile } from '../lib/authAPI';
import { useLocation } from 'react-router-dom';
import type { DonorDonationCreateRequest, RepeatDonationState } from '../types/DonationTypes';
import '../styles/pages/donation.css';

const donationHeroImageUrl =
  'https://images.unsplash.com/photo-1747509228690-8f1fef36d0bf?auto=format&fit=crop&w=1600&q=80';

const amounts = [250, 500, 1000, 1500, 2000, 2500];

const impactItems = [
  { amount: 250, text: 'School supplies for one girl for a full term' },
  { amount: 500, text: 'One week of trauma-informed counseling sessions' },
  { amount: 1000, text: 'Educational materials and tutoring for one month' },
  { amount: 1500, text: 'One month of safe housing and nutritious meals' },
  { amount: 2000, text: 'Complete life skills and vocational training course' },
  { amount: 2500, text: 'Full program enrollment for one girl for three months' },
];

function formatPhp(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Impact copy is based on donation amount in Philippine pesos (₱). */
function getDonationImpactMessagePhp(amountPhp: number): string {
  const php = Math.round(amountPhp * 100) / 100;
  if (php < 500) {
    return 'You provided a meal for a girl in need';
  }
  if (php <= 2000) {
    return 'You covered a week of school supplies';
  }
  return 'You funded a month of shelter and care';
}

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
  const { authSession, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const repeatDonation = location.state as RepeatDonationState | null;
  const [donationType, setDonationType] = useState<'monthly' | 'one-time'>(
    repeatDonation?.donationType === 'one-time' ? 'one-time' : 'monthly'
  );
  const [selectedAmount, setSelectedAmount] = useState<number | null>(
    repeatDonation?.amount ?? 500
  );
  const [customAmount, setCustomAmount] = useState(
    repeatDonation?.amount ? repeatDonation.amount.toString() : ''
  );
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dedication, setDedication] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [zip, setZip] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [thankYouDetails, setThankYouDetails] = useState<{
    amountPhp: number;
    donationType: 'monthly' | 'one-time';
    firstName: string;
  } | null>(null);
  const [isPrefilling, setIsPrefilling] = useState(false);

  const activeAmount = customAmount
    ? parseFloat(customAmount)
    : selectedAmount;

  const annualImpact =
    donationType === 'monthly' && activeAmount
      ? activeAmount * 12
      : null;

  const handleAmountClick = (amount: number) => {
    if (!isAuthenticated) {
      return;
    }

    setSelectedAmount(amount);
    setCustomAmount('');
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
  };

  const handleCustomAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!isAuthenticated) {
      return;
    }

    const val = e.target.value.replace(/[^0-9.]/g, '');
    setCustomAmount(val);
    if (val) setSelectedAmount(null);
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
  };

  useEffect(() => {
    if (!repeatDonation) {
      return;
    }

    if (repeatDonation.donationType === 'one-time' || repeatDonation.donationType === 'monthly') {
      setDonationType(repeatDonation.donationType);
    }

    if (typeof repeatDonation.amount === 'number' && repeatDonation.amount > 0) {
      setSelectedAmount(repeatDonation.amount);
      setCustomAmount(repeatDonation.amount.toString());
    }

    if (typeof repeatDonation.notes === 'string') {
      setDedication(repeatDonation.notes);
    }
  }, [repeatDonation]);

  const loadDonorProfile = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setIsPrefilling(true);

    try {
      const profile = await getManagedProfile();
      setFirstName(profile.firstName ?? '');
      setLastName(profile.lastName ?? '');
      setEmail(authSession.email ?? '');
    } catch {
      const fallbackDisplayName = authSession.displayName ?? authSession.userName ?? '';
      const fallbackParts = fallbackDisplayName.trim().split(/\s+/).filter(Boolean);

      setFirstName(fallbackParts[0] ?? '');
      setLastName(fallbackParts.slice(1).join(' ') || '');
      setEmail(authSession.email ?? '');
    } finally {
      setIsPrefilling(false);
    }
  }, [authSession.displayName, authSession.email, authSession.userName, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setFirstName('');
      setLastName('');
      setEmail('');
      setDedication('');
      setCardNumber('');
      setExpiry('');
      setCvc('');
      setZip('');
      return;
    }

    void loadDonorProfile();
  }, [isAuthenticated, loadDonorProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!isAuthenticated) {
      newErrors.auth = 'You need to log in or create an account to donate.';
      setErrors(newErrors);
      return;
    }

    if (!activeAmount || activeAmount <= 0)
      newErrors.amount = 'Please select or enter an amount';
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!email.trim()) newErrors.email = 'Email is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    const confirmedAmountPhp = activeAmount;
    if (!confirmedAmountPhp || confirmedAmountPhp <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: DonorDonationCreateRequest = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        donationType,
        donationDate: new Date().toISOString().slice(0, 10),
        isRecurring: donationType === 'monthly',
        campaignName: repeatDonation?.campaignName ?? null,
        channelSource: repeatDonation?.channelSource ?? null,
        currencyCode: 'PHP',
        amount: confirmedAmountPhp,
        estimatedValue: confirmedAmountPhp,
        impactUnit: null,
        notes: dedication.trim() || null,
        referralPostId: null,
      };

      await createMyDonation(payload);
      setThankYouDetails({
        amountPhp: confirmedAmountPhp,
        donationType,
        firstName: firstName.trim(),
      });
      setShowSuccess(true);
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Unable to record donation.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowSuccess(false);
    setThankYouDetails(null);
    if (typeof repeatDonation?.amount === 'number' && repeatDonation.amount > 0) {
      setSelectedAmount(repeatDonation.amount);
      setCustomAmount(repeatDonation.amount.toString());
    } else {
      setSelectedAmount(500);
      setCustomAmount('');
    }

    void loadDonorProfile();
    setDedication(repeatDonation?.notes ?? '');
    setCardNumber('');
    setExpiry('');
    setCvc('');
    setZip('');
    if (repeatDonation?.donationType === 'one-time' || repeatDonation?.donationType === 'monthly') {
      setDonationType(repeatDonation.donationType);
    } else {
      setDonationType('monthly');
    }
  };

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  useEffect(() => {
    if (!showSuccess) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showSuccess]);

  return (
    <>
      {/* Hero — full-width background like landing page */}
      <section
        className="donation-hero"
        style={{ backgroundImage: `url(${donationHeroImageUrl})` }}
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
          {!isLoading && !isAuthenticated ? (
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  padding: '16px 18px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-primary)',
                  background: 'rgba(193, 96, 58, 0.08)',
                  color: 'var(--color-dark)',
                  lineHeight: 1.6,
                }}
              >
                <strong>Log in to donate.</strong> You need an account before you can submit a donation.
                {' '}
                <Link to="/login" style={{ fontWeight: 700 }}>
                  Log in
                </Link>
                {' '}or{' '}
                <Link to="/signup" style={{ fontWeight: 700 }}>
                  create an account
                </Link>
                {' '}to continue.
              </div>
            </div>
          ) : null}

          {showSuccess ? (
            <div className="donation-success-placeholder" aria-hidden="true" />
          ) : (
            <div className="row g-4">
              {/* Left: Stepped Form */}
              <div className="col-lg-8">
                <form onSubmit={handleSubmit} noValidate>
                  {errors.auth ? (
                    <AlertBanner message={errors.auth} type="warning" onClose={() => setErrors((prev) => ({ ...prev, auth: '' }))} />
                  ) : null}

                  {errors.submit ? (
                    <div style={{ marginBottom: '16px' }}>
                      <AlertBanner
                        message={errors.submit}
                        type="warning"
                        onClose={() => setErrors((prev) => ({ ...prev, submit: '' }))}
                      />
                    </div>
                  ) : null}

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
                        disabled={!isAuthenticated}
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
                        disabled={!isAuthenticated}
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
                          disabled={!isAuthenticated}
                        >
                          {formatPhp(amt)}
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
                        ₱
                      </span>
                      <input
                        type="text"
                        placeholder="Enter custom amount"
                        value={customAmount}
                        onChange={handleCustomAmountChange}
                        className="custom-amount-input"
                        disabled={!isAuthenticated}
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
                          disabled={!isAuthenticated || isPrefilling}
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
                          disabled={!isAuthenticated || isPrefilling}
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
                      disabled={!isAuthenticated || isPrefilling}
                      required
                    />
                    <FormInput
                      label="Dedication (optional)"
                      name="dedication"
                      value={dedication}
                      onChange={(e) => setDedication(e.target.value)}
                      placeholder="In honor of..."
                      disabled={!isAuthenticated}
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
                      disabled={!isAuthenticated}
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
                          disabled={!isAuthenticated}
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
                          disabled={!isAuthenticated}
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
                          disabled={!isAuthenticated}
                        />
                      </div>
                    </div>

                    <PrimaryButton
                      type="submit"
                      fullWidth
                      loading={isSubmitting || isPrefilling}
                      disabled={isSubmitting || isPrefilling || !isAuthenticated}
                    >
                      {isSubmitting || isPrefilling ? (
                        <>
                          <Loader2 size={18} className="spin-icon" />{' '}
                          Processing...
                        </>
                      ) : !isAuthenticated ? (
                        'Log in to Donate'
                      ) : (
                        <>
                          Complete{' '}
                          {donationType === 'monthly' ? 'Monthly ' : ''}
                          Donation
                          {activeAmount && activeAmount > 0
                            ? ` — ${formatPhp(activeAmount)}`
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
                            ? formatPhp(activeAmount)
                            : '—'}
                        </strong>
                      </div>
                      {annualImpact && (
                        <div className="gift-summary-row">
                          <span>Annual Impact</span>
                          <strong
                            style={{ color: 'var(--color-primary-dark)' }}
                          >
                            {formatPhp(annualImpact)}/year
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
                            <strong>{formatPhp(item.amount)} provides</strong>
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

      {showSuccess && thankYouDetails
        ? createPortal(
            <div
              className="donation-thankyou-backdrop"
              role="presentation"
              onClick={resetForm}
            >
              <div
                className="donation-thankyou-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="donation-thankyou-title"
                onClick={(e) => e.stopPropagation()}
              >
                <CheckCircle size={56} className="donation-thankyou-icon" />
                <h2 id="donation-thankyou-title" className="donation-thankyou-heading">
                  {thankYouDetails.firstName
                    ? `Thank you, ${thankYouDetails.firstName}!`
                    : 'Thank you!'}
                </h2>
                <p className="donation-thankyou-amount">
                  Your {thankYouDetails.donationType === 'monthly' ? 'monthly ' : ''}
                  gift of{' '}
                  <strong>{formatPhp(thankYouDetails.amountPhp)}</strong>
                  {thankYouDetails.donationType === 'monthly' ? ' / month' : ''}{' '}
                  is on its way to girls who need it most.
                </p>
                <p className="donation-thankyou-impact">
                  {getDonationImpactMessagePhp(thankYouDetails.amountPhp)}
                </p>
                <PrimaryButton type="button" onClick={resetForm} fullWidth>
                  Make Another Donation
                </PrimaryButton>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
