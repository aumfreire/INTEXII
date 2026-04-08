import {
  Heart,
  Users,
  HandHeart,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';
import SectionHeading from '../components/ui/SectionHeading';
import Card from '../components/ui/Card';
import TestimonialCard from '../components/ui/TestimonialCard';
import CountUpStat from '../components/ui/CountUpStat';
import '../styles/pages/landing.css';

const heroImageUrl =
  'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1600&q=80';
const missionImageUrl =
  'https://images.unsplash.com/photo-1497486751825-1233686d5d80?auto=format&fit=crop&w=1200&q=80';

const impactStats = [
  { end: 2500, suffix: '+', label: 'Girls Protected & Served' },
  { end: 94, suffix: '%', label: 'Program Completion Rate' },
  { end: 15, suffix: '+', label: 'Years of Service' },
  { end: 2.8, prefix: '$', suffix: 'M', decimals: 1, label: 'Invested in Girl-Centered Programs' },
];

const helpCards = [
  {
    icon: <Heart size={32} />,
    title: 'Make a Donation',
    description:
      'Your financial gift directly funds shelter, counseling, education, and care for girls in crisis. Every dollar makes a difference.',
    link: '/donate',
    linkText: 'Donate Now',
  },
  {
    icon: <Users size={32} />,
    title: 'Spread the Word',
    description:
      'Share our mission with your network. Follow us on social media, share our stories, and help raise awareness about the challenges girls face.',
    link: '/coming-soon?topic=share-our-story',
    linkText: 'Share Our Story',
  },
  {
    icon: <HandHeart size={32} />,
    title: 'Corporate Partnership',
    description:
      'Align your business with a cause that matters. Corporate sponsors enjoy brand visibility while making a meaningful impact on girls\' lives.',
    link: '/coming-soon?topic=corporate-partnership',
    linkText: 'Become a Partner',
  },
];

const testimonials = [
  {
    quote:
      'Haven gave me a safe place when I had nowhere to go. The counselors helped me believe in myself again. Now I\'m in college studying to become a nurse.',
    name: 'Amara J.',
    role: 'Program Graduate, Age 19',
  },
  {
    quote:
      'I was afraid of everything when I arrived. The teachers were so patient with me. For the first time, I felt like someone cared about my future.',
    name: 'Priya M.',
    role: 'Current Participant, Age 16',
  },
  {
    quote:
      'Supporting Haven has been one of the most meaningful decisions our foundation has made. The transparency and impact are truly exceptional.',
    name: 'Margaret Chen',
    role: 'Foundation Director & Donor',
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero — full-width background image */}
      <section
        className="hero-section"
        style={{
          backgroundImage: `url(${heroImageUrl})`,
        }}
      >
        <div className="hero-overlay" />
        <div className="container hero-content" style={{ padding: '0 24px' }}>
          <div className="hero-label">
            <span className="hero-label-line" />
            HAVEN FOR GIRLS
          </div>
          <h1>
            Every Girl Deserves to Be Safe, Seen, and Free.
          </h1>
          <p className="hero-subtitle">
            Haven provides emergency shelter, trauma-informed counseling,
            education support, and long-term care for girls facing abuse,
            trafficking, and neglect.
          </p>
          <div className="hero-buttons">
            <PrimaryButton href="/donate">
              <Heart size={18} />
              Donate Now
            </PrimaryButton>
            <SecondaryButton href="/#impact" light>
              See Our Impact
              <ArrowRight size={18} />
            </SecondaryButton>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="mission-section" id="mission">
        <div className="container" style={{ padding: '0 24px' }}>
          <SectionHeading
            label="Our Mission"
            title="Protecting the Most Vulnerable"
            subtitle="We exist to protect, support, heal, and empower girls who have experienced abuse, trafficking, and neglect."
          />
          <div className="mission-content">
            <div className="mission-image">
              <img
                src={missionImageUrl}
                alt="Counselor working with girls in a safe environment"
              />
            </div>
            <div>
              <p className="mission-text">
                Haven was founded on the belief that every girl deserves
                safety, dignity, and the opportunity to reach her full
                potential. We provide comprehensive, trauma-informed care that
                addresses the immediate and long-term needs of girls in crisis.
              </p>
              <p className="mission-text">
                Our holistic approach combines emergency shelter with
                counseling, education support, life skills training, and
                community reintegration programs. We don't just rescue girls
                from dangerous situations — we walk alongside them on their
                journey to healing and independence.
              </p>
              <p className="mission-text" style={{ marginBottom: 0 }}>
                Every program, every resource, and every staff member is
                dedicated to one goal: helping girls transform from survivors
                into thriving young women who can shape their own futures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="impact-section" id="impact">
        <div className="container" style={{ padding: '0 24px' }}>
          <SectionHeading
            label="Our Impact"
            title="Measurable Change, Real Lives"
            subtitle="Every number represents a real girl whose life has been transformed through safety, care, and opportunity."
            light
          />
          <div className="row mt-4">
            {impactStats.map((stat, i) => (
              <div className="col-6 col-md-3" key={i}>
                <CountUpStat
                  end={stat.end}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                  label={stat.label}
                  duration={2200}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How You Can Help */}
      <section className="help-section">
        <div className="container" style={{ padding: '0 24px' }}>
          <SectionHeading
            label="Get Involved"
            title="How You Can Help"
            subtitle="There are many ways to support our mission and make a lasting impact in the lives of vulnerable girls."
          />
          <div className="row g-4 mt-2">
            {helpCards.map((card, i) => (
              <div className="col-md-4" key={i}>
                <Card
                  icon={card.icon}
                  title={card.title}
                  description={card.description}
                  accentColor="var(--color-primary)"
                >
                  <Link
                    to={card.link}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--color-primary-dark)',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      textDecoration: 'none',
                    }}
                  >
                    {card.linkText}
                    <ArrowRight size={16} />
                  </Link>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stories of Hope */}
      <section className="stories-section">
        <div className="container" style={{ padding: '0 24px' }}>
          <SectionHeading
            label="Stories of Hope"
            title="Voices of Courage and Resilience"
            subtitle="Hear from the girls whose lives have been transformed and the supporters who make it possible."
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

      {/* Final CTA */}
      <section className="cta-band">
        <div className="container" style={{ padding: '0 24px' }}>
          <h2>Be Part of Her Story</h2>
          <p>
            Your donation creates safety, healing, and opportunity for girls
            who need it most. Every gift, no matter the size, changes a life.
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
          </div>
        </div>
      </section>
    </>
  );
}
