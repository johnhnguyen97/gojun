export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Privacy Policy</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Last updated: December 26, 2025</p>

        <div className="space-y-6 text-slate-600 dark:text-slate-300">
          <section>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Overview</h2>
            <p>Gojun ("we", "our", or "us") is a Japanese language learning application. This Privacy Policy explains how we collect, use, and protect your information.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Information:</strong> Email address when you sign up via Google authentication</li>
              <li><strong>Learning Data:</strong> Your progress, favorites, and notes stored to enhance your learning experience</li>
              <li><strong>Google Calendar Data:</strong> If you connect Google Calendar, we access calendar events and tasks solely to sync your learning schedule</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and improve the language learning service</li>
              <li>To sync your learning progress across devices</li>
              <li>To create calendar events and reminders if you opt in</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Data Storage</h2>
            <p>Your data is stored securely using Supabase with encryption. We do not sell or share your personal information with third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Google API Services</h2>
            <p>Our use of Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Your Rights</h2>
            <p>You can disconnect Google Calendar at any time in Settings. You can delete your account and all associated data by contacting us.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Contact</h2>
            <p>For questions about this Privacy Policy, contact: john.nguyen9727@gmail.com</p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <a href="/" className="text-blue-500 hover:underline">&larr; Back to Gojun</a>
        </div>
      </div>
    </div>
  );
}
