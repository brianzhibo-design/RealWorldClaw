export const metadata = {
  title: "Privacy Policy — RealWorldClaw",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <div className="prose prose-slate prose-invert max-w-none">
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
            <p className="mb-4">
              RealWorldClaw collects the following types of information to provide and improve our matching platform:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li><strong>Account Information:</strong> Email address and username when you register</li>
              <li><strong>Technical Data:</strong> IP addresses for security and service delivery</li>
              <li><strong>User Content:</strong> Files and documents you upload for matching purposes</li>
              <li><strong>Communication Data:</strong> Messages sent through our platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
            <p className="mb-4">Your information is used to:</p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Facilitate matching between users and makers</li>
              <li>Provide customer support and platform services</li>
              <li>Maintain platform security and prevent fraud</li>
              <li>Improve our services and user experience</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Information Sharing</h2>
            <p className="mb-4">
              We <strong>do not sell</strong> your personal information to third parties. Your data may be shared only:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>With other platform users as necessary for matching (e.g., project details)</li>
              <li>With service providers who assist in platform operations</li>
              <li>When required by law or to protect platform integrity</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Access and update your personal information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of non-essential communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Cookies and Tracking</h2>
            <p className="mb-4">
              We use cookies only for essential platform functionality, specifically to maintain your session token. 
              We do not use tracking cookies for advertising or analytics purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Data Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
            <p className="mb-4">
              For any questions about this Privacy Policy or to exercise your privacy rights, please contact us at:
            </p>
            <p className="font-mono text-sky-400">privacy@realworldclaw.com</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Updates to This Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify users of any material changes 
              via email or platform notification.
            </p>
            <p className="text-slate-400 text-sm">Last updated: February 2025</p>
          </section>
        </div>
      </div>
    </div>
  );
}