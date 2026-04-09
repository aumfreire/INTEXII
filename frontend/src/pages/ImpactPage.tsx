import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Home, BookOpen, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { getPublicImpactStats, type PublicImpactStats } from '../lib/authAPI';
import '../styles/pages/impact.css';

/* Count-up animation hook */
function useCountUp(target: number, duration = 1800, shouldStart = false) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!shouldStart) return;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(ease * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, shouldStart]);

  return value;
}

function StatCard({ value, label, icon: Icon, color, started }: {
  value: number; label: string; icon: React.ElementType; color: string; started: boolean;
}) {
  const animated = useCountUp(value, 1800, started);
  return (
    <div className="ip-stat-card">
      <div className="ip-stat-icon" style={{ color, backgroundColor: `${color}18` }}>
        <Icon size={28} />
      </div>
      <div className="ip-stat-number">{animated.toLocaleString()}</div>
      <div className="ip-stat-label">{label}</div>
    </div>
  );
}

export default function ImpactPage() {
  const [stats, setStats] = useState<PublicImpactStats | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    void getPublicImpactStats().then((s) => {
      setStats(s);
      setTimeout(() => setStarted(true), 200);
    }).catch(() => {
      /* Use fallback zeros on error */
      setStats({
        totalServed: 0,
        activeResidents: 0,
        reintegrated: 0,
        activeSafehouses: 0,
        totalDonations: 0,
        totalDonors: 0,
        programStats: [],
      });
      setTimeout(() => setStarted(true), 200);
    });
  }, []);

  return (
    <div className="ip-page">
      {/* Hero */}
      <section className="ip-hero">
        <div className="ip-hero-inner">
          <span className="ip-eyebrow">Our Impact</span>
          <h1 className="ip-hero-title">
            Transforming Lives,<br />
            <span className="ip-hero-accent">One Story at a Time</span>
          </h1>
          <p className="ip-hero-subtitle">
            Every number below represents a life touched, a family restored, and a future reclaimed.
            Haven of Hope is committed to transparency — here's what your support has made possible.
          </p>
          <div className="ip-hero-actions">
            <Link to="/donate" className="ip-cta-btn primary">
              Donate Now <ArrowRight size={16} />
            </Link>
            <Link to="/about" className="ip-cta-btn secondary">
              Our Mission
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="ip-stats-section">
        <div className="ip-section-inner">
          <h2 className="ip-section-title">By the Numbers</h2>
          <p className="ip-section-sub">Real-time data from our operations</p>
          {stats && (
            <div className="ip-stats-grid">
              <StatCard value={stats.totalServed} label="Total Residents Served" icon={Users} color="#C1603A" started={started} />
              <StatCard value={stats.activeResidents} label="Currently in Care" icon={Home} color="#7A9E7E" started={started} />
              <StatCard value={stats.reintegrated} label="Successfully Reintegrated" icon={TrendingUp} color="#e67e22" started={started} />
              <StatCard value={stats.activeSafehouses} label="Active Safehouses" icon={Home} color="#5b7fa6" started={started} />
              <StatCard value={stats.totalDonors} label="Generous Donors" icon={Heart} color="#C1603A" started={started} />
              <StatCard value={Math.round(stats.totalDonations)} label="Total Contributions ($)" icon={TrendingUp} color="#7A9E7E" started={started} />
            </div>
          )}
        </div>
      </section>

      {/* Program Areas */}
      <section className="ip-programs-section">
        <div className="ip-section-inner">
          <h2 className="ip-section-title">What We Do</h2>
          <p className="ip-section-sub">Three pillars that define our approach to healing and restoration</p>
          <div className="ip-programs-grid">
            <div className="ip-program-card">
              <div className="ip-program-icon" style={{ backgroundColor: 'rgba(193,96,58,0.1)', color: '#C1603A' }}>
                <Heart size={32} />
              </div>
              <h3 className="ip-program-title">Caring</h3>
              <p className="ip-program-text">
                Safe shelter, nutritious meals, trauma-informed counseling, and 24/7 emotional support for every resident in our care. No one faces recovery alone.
              </p>
            </div>
            <div className="ip-program-card">
              <div className="ip-program-icon" style={{ backgroundColor: 'rgba(122,158,126,0.1)', color: '#7A9E7E' }}>
                <Users size={32} />
              </div>
              <h3 className="ip-program-title">Healing</h3>
              <p className="ip-program-text">
                Individual and group therapy, legal aid, medical support, and structured case management that addresses the root causes of vulnerability and builds resilience.
              </p>
            </div>
            <div className="ip-program-card">
              <div className="ip-program-icon" style={{ backgroundColor: 'rgba(230,126,34,0.1)', color: '#e67e22' }}>
                <BookOpen size={32} />
              </div>
              <h3 className="ip-program-title">Teaching</h3>
              <p className="ip-program-text">
                Education re-enrollment, vocational training, life skills development, and family reintegration planning that empowers residents to build independent, thriving lives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="ip-cta-section">
        <div className="ip-section-inner ip-cta-inner">
          <h2 className="ip-cta-title">Be Part of the Story</h2>
          <p className="ip-cta-text">
            Your contribution — no matter the size — changes the trajectory of a life. Join hundreds of donors already making a difference.
          </p>
          <Link to="/donate" className="ip-cta-btn primary large">
            Make a Donation <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
