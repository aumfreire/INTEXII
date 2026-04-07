import {
  Heart,
  Shield,
  BookOpen,
  Home,
  Users,
  GraduationCap,
  HandHeart,
  Lock,
  Eye,
  CheckCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';
import SectionHeading from '../components/ui/SectionHeading';
import Card from '../components/ui/Card';
import TestimonialCard from '../components/ui/TestimonialCard';
import heroImage from '../assets/hero.png';
import '../styles/pages/landing.css';

const whyCards = [
  {
    icon: <Shield size={36} />,
    title: 'Safety First',
    description:
      'Every girl deserves to feel safe. We provide protected environments where healing can begin and futures can be reimagined.',
    accent: 'var(--color-soft-blue)',
  },
  {
    icon: <Heart size={36} />,
    title: 'Healing & Growth',
    description:
      'Through compassionate care and dedicated programs, we help girls process trauma and discover their inner strength.',
    accent: 'var(--color-rose-accent)',
  },
  {
    icon: <BookOpen size={36} />,
    title: 'Opportunity & Purpose',
    description:
      'Education, mentorship, and life skills open doors to a future where every girl can thrive on her own terms.',
    accent: 'var(--color-sage-green)',
  },
];

const programs = [
  {
    icon: <Home size={32} />,
    title: 'Safe Housing',
    description:
      'Secure, nurturing living spaces where girls can rest, recover, and feel at home.',
    accent: 'var(--color-soft-blue)',
  },
  {
    icon: <Users size={32} />,
    title: 'Mentorship',
    description:
      'One-on-one guidance from caring mentors who walk alongside each girl on her journey.',
    accent: 'var(--color-lavender)',
  },
  {
    icon: <GraduationCap size={32} />,
    title: 'Education & Skills',
    description:
      'Academic support and life skills training to build confidence and independence.',
    accent: 'var(--color-sage-green)',
  },
  {
    icon: <HandHeart size={32} />,
    title: 'Emotional Support',
    description:
      'Counseling, community care, and a safe space to express feelings and grow.',
    accent: 'var(--color-peach-accent)',
  },
];

const impactStats = [
  { number: '500+', label: 'Girls Served' },
  { number: '12', label: 'Safe Spaces Created' },
  { number: '2,400+', label: 'Mentorship Sessions' },
  { number: '1,000+', label: 'Donors Making Change' },
];

const testimonials = [
  {
    quote:
      'Knowing my monthly gift helps keep a girl safe and supported gives me more purpose than I ever expected. This organization truly puts the girls first.',
    name: 'Sarah Mitchell',
    role: 'Monthly Donor',
  },
  {
    quote:
      'Volunteering as a mentor has shown me the incredible resilience of these young women. The programs here change lives — including mine.',
    name: 'David Chen',
    role: 'Volunteer Mentor',
  },
  {
    quote:
      'I have seen firsthand how safe spaces and compassionate care transform lives. Haven of Hope gives girls the foundation they need to dream again.',
    name: 'Maria Gonzalez',
    role: 'Community Partner',
  },
];

const trustSignals = [
  {
    icon: <Lock size={22} />,
    bg: 'var(--color-soft-blue)',
    title: 'Secure Donations',
    desc: 'Every transaction is encrypted and processed securely to protect your personal information.',
  },
  {
    icon: <Heart size={22} />,
    bg: 'var(--color-rose-accent)',
    title: 'Mission-First Funds',
    desc: 'Your donations go directly to programs that support safety, healing, and opportunity for girls.',
  },
  {
    icon: <Eye size={22} />,
    bg: 'var(--color-sage-green)',
    title: 'Transparent Reporting',
    desc: 'We share regular updates on how funds are used and the impact your support creates.',
  },
  {
    icon: <CheckCircle size={22} />,
    bg: 'var(--color-lavender)',
    title: 'Community Stewardship',
    desc: 'We are accountable to our community, our donors, and the girls we serve every single day.',
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="hero-section">
        <div className="container" style={{ padding: '0 24px' }}>
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <h1>
                Helping girls find safety, healing, and a future full of
                possibility
              </h1>
              <p className="hero-subtitle">
                Your support helps create safe spaces, meaningful programs, and
                real opportunities for lasting change in the lives of vulnerable
                girls.
              </p>
              <div className="hero-buttons">
                <PrimaryButton href="/donate">Donate Now</PrimaryButton>
                <SecondaryButton href="#impact">See Our Impact</SecondaryButton>
              </div>
            </div>
            <div className="col-lg-6 hero-image-wrapper">
              <img
                src={heroImage}
                alt="Young girls smiling and learning together in a supportive environment"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="mission-section">
        <div className="container" style={{ padding: '0 24px' }}>
          <SectionHeading
            title="Our Mission"
            subtitle="We exist to support vulnerable girls through their most challenging moments — providing safety, compassionate care, and the tools they need to build a brighter future."
          />
          <div
            className="row justify-content-center mt-4"
            style={{ maxWidth: '800px', margin: '0 auto' }}
          >
            <p
              style={{
                textAlign: 'center',
                color: 'var(--color-muted)',
                fontSize: '1rem',
                lineHeight: '1.8',
              }}
            >
              Every girl deserves the chance to heal, to learn, and to discover
              who she is meant to be. Through safe housing, mentorship,
              education, and emotional support, we help girls move from
              vulnerability to empowerment. None of this is possible without the
              generosity and compassion of donors and community members who
              believe in second chances.
            </p>
          </div>
        </div>
      </section>

      {/* Why This Matters */}
      <section className="why-section">
        <div className="container" style={{ padding: '0 24px' }}>
          <SectionHeading
            title="Why This Matters"
            subtitle="Behind every statistic is a real girl who needs safety, healing, and a chance to dream."
          />
          <div className="row g-4 mt-2">
            {whyCards.map((card, i) => (
              <div className="col-md-4" key={i}>
                <Card
                  icon={card.icon}
                  title={card.title}
                  description={card.description}
                  accentColor={card.accent}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="programs-section">
        <div className="container" style={{ padding: '0 24px' }}>
          <SectionHeading
            title="Our Programs"
            subtitle="Comprehensive support designed to meet each girl where she is and help her grow."
          />
          <div className="row g-4 mt-2">
            {programs.map((prog, i) => (
              <div className="col-md-6 col-lg-3" key={i}>
                <Card
                  icon={prog.icon}
                  title={prog.title}
                  description={prog.description}
                  accentColor={prog.accent}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="impact-section" id="impact">
        <div className="container" style={{ padding: '0 24px' }}>
          <SectionHeading
            title="Our Impact"
            subtitle="Together, we are making a measurable difference in the lives of girls."
            light
          />
          <div className="row mt-4">
            {impactStats.map((stat, i) => (
              <div className="col-6 col-md-3" key={i}>
                <div className="impact-stat">
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container" style={{ padding: '0 24px' }}>
          <SectionHeading
            title="Stories of Support"
            subtitle="Hear from the people who make this mission possible."
          />
          <div className="row g-4 mt-2">
            {testimonials.map((t, i) => (
              <div className="col-md-4" key={i}>
                <TestimonialCard
                  quote={t.quote}
                  name={t.name}
                  role={t.role}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="trust-section">
        <div className="container" style={{ padding: '0 24px' }}>
          <SectionHeading
            title="Your Trust Matters"
            subtitle="We are committed to transparency, security, and putting every dollar to work for the girls we serve."
          />
          <div className="row g-4 mt-2">
            {trustSignals.map((item, i) => (
              <div className="col-md-6" key={i}>
                <div className="trust-item">
                  <div
                    className="trust-icon"
                    style={{
                      backgroundColor: item.bg,
                      color: 'var(--color-white)',
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: '1.1rem',
                        marginBottom: '6px',
                      }}
                    >
                      {item.title}
                    </h3>
                    <p
                      style={{
                        color: 'var(--color-muted)',
                        fontSize: '0.9rem',
                        lineHeight: '1.65',
                        marginBottom: 0,
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-band">
        <div className="container" style={{ padding: '0 24px' }}>
          <h2>Be Part of Her Story</h2>
          <p>
            Your donation helps create safety, healing, and opportunity for
            girls who need it most. Every gift, no matter the size, changes a
            life.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link to="/donate" className="cta-band-btn">
              <Heart size={18} />
              Donate Now
            </Link>
            <Link
              to="/"
              className="cta-band-btn"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--color-white)',
                border: '2px solid var(--color-white)',
              }}
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
