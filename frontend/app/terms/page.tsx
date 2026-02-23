export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        <div className="prose prose-slate prose-invert max-w-none">
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Platform Nature</h2>
            <p className="mb-4">
              RealWorldClaw is a matching platform that connects users with makers and service providers. 
              We are not a manufacturer or service provider ourselves, but rather facilitate connections 
              between independent parties. We do not manufacture products or directly provide services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">User Responsibilities</h2>
            <p className="mb-4">As a user of our platform, you agree to:</p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Upload only legal, non-infringing files and documents</li>
              <li>Provide truthful and accurate information in all interactions</li>
              <li>Respect intellectual property rights of others</li>
              <li>Use the platform for legitimate business purposes only</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Maintain the confidentiality of your account credentials</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Maker Responsibilities</h2>
            <p className="mb-4">Makers and service providers on our platform are responsible for:</p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Delivering quality work that meets agreed specifications</li>
              <li>Meeting delivery timelines and communication commitments</li>
              <li>Maintaining appropriate skills and capabilities</li>
              <li>Handling customer service and support for their work</li>
              <li>Complying with all relevant industry standards and regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Platform Responsibilities</h2>
            <p className="mb-4">RealWorldClaw is responsible for:</p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Facilitating matches between users and makers</li>
              <li>Maintaining platform security and functionality</li>
              <li>Protecting user privacy in accordance with our Privacy Policy</li>
              <li>Providing customer support for platform-related issues</li>
              <li>Processing payments and transactions securely</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Intellectual Property</h2>
            <p className="mb-4">
              Users retain full ownership of all intellectual property rights in the content, 
              designs, and materials they upload to or create through the platform. 
              By using our platform, you grant us a limited license to display and process 
              your content solely for the purpose of providing our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Dispute Resolution</h2>
            <p className="mb-4">
              In case of disputes between users and makers, we encourage direct communication 
              and good faith resolution. While we may provide mediation support, 
              final resolution of disputes is the responsibility of the involved parties. 
              Any legal disputes shall be resolved through binding arbitration.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Disclaimers</h2>
            <p className="mb-4">
              The platform is provided "as is" without warranties of any kind. 
              We disclaim all warranties, express or implied, including but not limited to 
              merchantability, fitness for a particular purpose, and non-infringement. 
              We are not liable for any indirect, incidental, special, or consequential damages.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Service Termination</h2>
            <p className="mb-4">
              We reserve the right to suspend or terminate accounts that violate these terms 
              or engage in harmful behavior. Users may also terminate their accounts at any time. 
              Upon termination, access to the platform will cease, though certain data may be 
              retained as required by law or for legitimate business purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Modifications</h2>
            <p className="mb-4">
              We may modify these Terms of Service from time to time. Material changes will be 
              communicated to users via email or platform notification. Continued use of the platform 
              after modifications constitutes acceptance of the updated terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Contact Information</h2>
            <p className="mb-4">
              For questions about these Terms of Service, please contact us at:
            </p>
            <p className="font-mono text-sky-400">legal@realworldclaw.com</p>
            <p className="text-slate-400 text-sm mt-4">Last updated: February 2025</p>
          </section>
        </div>
      </div>
    </div>
  );
}