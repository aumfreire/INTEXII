import { Shield } from 'lucide-react';
import '../styles/pages/privacy.css';

export default function PrivacyPolicyPage() {
  return (
    <div className="pp-page">
      <div className="pp-hero">
        <div className="pp-hero-inner">
          <div className="pp-hero-icon">
            <Shield size={36} />
          </div>
          <h1 className="pp-title">Privacy Policy</h1>
          <p className="pp-updated">Last updated: April 8, 2026</p>
        </div>
      </div>

      <div className="pp-content">
        <section className="pp-section">
          <h2 className="pp-section-title">1. Introduction</h2>
          <p>
            Haven of Hope ("we," "us," or "our") is committed to protecting the privacy of all individuals who interact with our organization — including donors, volunteers, and the vulnerable populations we serve. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or engage with our programs.
          </p>
          <p>
            Please read this policy carefully. If you do not agree with its terms, please refrain from using our services. We reserve the right to make changes to this policy at any time, and will notify users of significant updates.
          </p>
        </section>

        <section className="pp-section">
          <h2 className="pp-section-title">2. Information We Collect</h2>
          <h3 className="pp-subsection-title">2.1 Information You Provide Directly</h3>
          <ul className="pp-list">
            <li>Name, email address, and contact information when you register, donate, or contact us</li>
            <li>Payment information processed securely through our payment partners (we do not store full card numbers)</li>
            <li>Correspondence you send us, including inquiries and feedback</li>
            <li>Volunteer or partnership application information</li>
          </ul>
          <h3 className="pp-subsection-title">2.2 Information Collected Automatically</h3>
          <ul className="pp-list">
            <li>IP address, browser type, and device information</li>
            <li>Pages visited, time spent, and navigation patterns via cookies and analytics tools</li>
            <li>Referral URLs and search terms used to find our site</li>
          </ul>
          <h3 className="pp-subsection-title">2.3 Sensitive Program Data</h3>
          <p>
            Information about residents in our care is collected solely for case management, service delivery, and legally required reporting. This data is handled with the highest level of confidentiality, is never sold or shared for commercial purposes, and is accessible only to authorized staff on a strict need-to-know basis.
          </p>
        </section>

        <section className="pp-section">
          <h2 className="pp-section-title">3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="pp-list">
            <li>Process donations and send tax receipts</li>
            <li>Communicate program updates, newsletters, and impact reports (with your consent)</li>
            <li>Improve our website, services, and organizational operations</li>
            <li>Comply with legal obligations and regulatory reporting requirements</li>
            <li>Detect, prevent, and address technical issues or fraudulent activity</li>
            <li>Deliver and improve direct services to residents in our programs</li>
          </ul>
          <p>
            We will never sell, rent, or share your personal information with third parties for their own marketing purposes.
          </p>
        </section>

        <section className="pp-section">
          <h2 className="pp-section-title">4. Cookies and Tracking Technologies</h2>
          <p>
            Our website uses cookies and similar tracking technologies to enhance your browsing experience. You can control cookies through your browser settings. Disabling cookies may affect certain features of our site. For full details, please see our <a href="/cookies" className="pp-link">Cookie Policy</a>.
          </p>
          <p>
            We use Google Analytics and similar services for aggregate, anonymized usage statistics. These tools may use their own cookies; we encourage you to review their privacy policies.
          </p>
        </section>

        <section className="pp-section">
          <h2 className="pp-section-title">5. Data Retention</h2>
          <p>
            We retain personal data for as long as necessary to fulfill the purposes outlined in this policy, comply with legal obligations, and maintain accurate records for auditing and reporting. Donor records are typically retained for seven years per standard nonprofit accounting requirements. Resident case files are retained in accordance with applicable child welfare regulations.
          </p>
          <p>
            You may request deletion of your personal information at any time by contacting us, subject to legal retention requirements.
          </p>
        </section>

        <section className="pp-section">
          <h2 className="pp-section-title">6. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your information, including:
          </p>
          <ul className="pp-list">
            <li>SSL/TLS encryption for all data in transit</li>
            <li>Encrypted storage for sensitive personal data</li>
            <li>Role-based access controls limiting data access to authorized personnel</li>
            <li>Regular security reviews and staff training on data protection practices</li>
            <li>Secure, access-controlled physical environments for our facilities</li>
          </ul>
          <p>
            Despite these measures, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security of your data.
          </p>
        </section>

        <section className="pp-section">
          <h2 className="pp-section-title">7. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="pp-list">
            <li><strong>Access</strong> the personal data we hold about you</li>
            <li><strong>Correct</strong> inaccurate or incomplete information</li>
            <li><strong>Delete</strong> your personal data, subject to legal obligations</li>
            <li><strong>Restrict or object</strong> to how we process your data</li>
            <li><strong>Data portability</strong> — receive your data in a structured, machine-readable format</li>
            <li><strong>Withdraw consent</strong> at any time where processing is based on consent</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at <a href="mailto:privacy@havenofhope.org" className="pp-link">privacy@havenofhope.org</a>.
          </p>
        </section>

        <section className="pp-section">
          <h2 className="pp-section-title">8. Third-Party Services</h2>
          <p>
            Our website may contain links to third-party websites and integrate with payment processors and communication platforms. These services have their own privacy policies, which we encourage you to review. We are not responsible for the privacy practices of third-party sites.
          </p>
        </section>

        <section className="pp-section">
          <h2 className="pp-section-title">9. Children's Privacy</h2>
          <p>
            We do not knowingly collect personal information from children under the age of 13 through our public website. While we serve minors through our shelter programs, such data is collected exclusively by trained staff within protected, consent-based frameworks and is handled under the strictest confidentiality protocols.
          </p>
        </section>

        <section className="pp-section">
          <h2 className="pp-section-title">10. Contact Us</h2>
          <p>
            If you have questions or concerns about this Privacy Policy, or wish to exercise your data rights, please contact us:
          </p>
          <div className="pp-contact-block">
            <div className="pp-contact-row"><strong>Email:</strong> <a href="mailto:privacy@havenofhope.org" className="pp-link">privacy@havenofhope.org</a></div>
            <div className="pp-contact-row"><strong>Address:</strong> Haven of Hope, 123 Hope Lane, Your City, State 00000</div>
            <div className="pp-contact-row"><strong>Phone:</strong> +1 (555) 000-0000</div>
          </div>
          <p style={{ marginTop: '16px' }}>
            We will respond to all data-related inquiries within 30 days.
          </p>
        </section>
      </div>
    </div>
  );
}
