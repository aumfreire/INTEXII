import { Link, useSearchParams } from 'react-router-dom';

function formatTopic(topic: string): string {
  return topic
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function ComingSoonPage() {
  const [searchParams] = useSearchParams();
  const topicParam = searchParams.get('topic')?.trim() ?? '';
  const topic = topicParam ? formatTopic(topicParam) : 'This page';

  return (
    <section style={{ padding: '64px 24px' }}>
      <div className="container" style={{ maxWidth: '760px' }}>
        <div className="login-card" style={{ textAlign: 'center' }}>
          <h1 style={{ marginBottom: '12px' }}>Coming Soon</h1>
          <p className="login-subtitle" style={{ marginBottom: '20px' }}>
            {topic} is not available yet, but it is on the roadmap.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="btn btn-outline-secondary">
              Back to Home
            </Link>
            <Link to="/donate" className="btn btn-primary">
              Donate Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
