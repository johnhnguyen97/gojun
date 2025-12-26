import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  connectKeep,
  isKeepConnected,
  getKeepEmail,
  disconnectKeep,
  handleKeepCallback
} from '../services/keepApi';

interface SettingsProps {
  onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
  const { user, signOut, hasApiKey, checkApiKey, session, hasGoogleLinked, linkGoogleAccount, unlinkGoogleAccount } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Google Keep state
  const [keepConnected, setKeepConnected] = useState(false);
  const [keepEmail, setKeepEmail] = useState<string | null>(null);
  const [keepLoading, setKeepLoading] = useState(false);

  // Google account linking state
  const [googleLinkLoading, setGoogleLinkLoading] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    requestAnimationFrame(() => setIsVisible(true));

    // Check Keep connection status (tokens should already be in localStorage)
    const connected = isKeepConnected();
    const email = getKeepEmail();
    console.log('Settings mount - Keep connected:', connected, 'email:', email);
    setKeepConnected(connected);
    setKeepEmail(email);

    // Handle OAuth callback if returning from Google (in case Settings is open during redirect)
    try {
      const tokens = handleKeepCallback();
      if (tokens) {
        console.log('Settings handleKeepCallback got tokens:', tokens.email);
        setKeepConnected(true);
        setKeepEmail(tokens.email);
      }
    } catch (err) {
      console.error('Keep callback error:', err);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!apiKey.startsWith('sk-ant-')) {
      setError('Invalid API key format. Anthropic API keys start with "sk-ant-"');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ apiKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save API key');
      }

      setSuccess('API key saved securely!');
      setApiKey('');
      await checkApiKey();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!confirm('Are you sure you want to delete your API key?')) {
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/api-key', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete API key');
      }

      setSuccess('API key deleted successfully');
      await checkApiKey();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete API key');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    handleClose();
  };

  const handleConnectKeep = async () => {
    setKeepLoading(true);
    try {
      await connectKeep();
    } catch (err) {
      console.error('Failed to connect Keep:', err);
      setKeepLoading(false);
    }
  };

  const handleDisconnectKeep = () => {
    disconnectKeep();
    setKeepConnected(false);
    setKeepEmail(null);
  };

  const handleLinkGoogle = async () => {
    setGoogleLinkLoading(true);
    setError('');
    try {
      const { error } = await linkGoogleAccount();
      if (error) {
        setError(error.message);
        setGoogleLinkLoading(false);
      }
      // If no error, user will be redirected to Google OAuth
    } catch (err) {
      setError('Failed to link Google account');
      setGoogleLinkLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!confirm('Are you sure you want to unlink your Google account?')) {
      return;
    }
    setGoogleLinkLoading(true);
    setError('');
    try {
      const { error } = await unlinkGoogleAccount();
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Google account unlinked successfully');
      }
    } catch (err) {
      setError('Failed to unlink Google account');
    } finally {
      setGoogleLinkLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden transform transition-all duration-200 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Settings</h2>
                <p className="text-white/80 text-sm">Manage your account</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Account Card */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Signed in as</p>
                <p className="font-semibold text-gray-800 truncate">{user?.email}</p>
                {hasGoogleLinked && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-xs text-gray-500">Google linked</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Google Account Linking Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Google Account
              </h3>
              {hasGoogleLinked ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Linked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  Not Linked
                </span>
              )}
            </div>

            {hasGoogleLinked ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Your Google account is linked. You can sign in with Google or email/password.
                </p>
                <button
                  onClick={handleUnlinkGoogle}
                  disabled={googleLinkLoading}
                  className="w-full py-2.5 px-4 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 font-medium rounded-xl transition-all border border-gray-200 hover:border-red-200 disabled:opacity-50"
                >
                  {googleLinkLoading ? 'Unlinking...' : 'Unlink Google Account'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Link your Google account to sign in faster and sync across devices.
                </p>
                <button
                  onClick={handleLinkGoogle}
                  disabled={googleLinkLoading}
                  className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {googleLinkLoading ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  {googleLinkLoading ? 'Linking...' : 'Link Google Account'}
                </button>
              </div>
            )}
          </div>

          {/* API Key Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                API Configuration
              </h3>
              {hasApiKey ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 animate-pulse">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  Not Set
                </span>
              )}
            </div>

            {/* Messages */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm animate-shake">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            )}

            {/* API Key Form */}
            <form onSubmit={handleSaveApiKey} className="space-y-3">
              <div className="relative group">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasApiKey ? 'Enter new API key to update' : 'sk-ant-api03-...'}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all font-mono text-sm placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showApiKey ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading || !apiKey}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/25"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : hasApiKey ? 'Update Key' : 'Save Key'}
                </button>

                {hasApiKey && (
                  <button
                    type="button"
                    onClick={handleDeleteApiKey}
                    disabled={loading}
                    className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl transition-all disabled:opacity-50 border-2 border-red-200 hover:border-red-300"
                  >
                    Delete
                  </button>
                )}
              </div>
            </form>

            {/* Security Info */}
            <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-blue-800">Encrypted Storage</p>
                <p className="text-blue-600 mt-0.5">
                  Your key is encrypted with AES-256 and only decrypted server-side for API calls.
                </p>
              </div>
            </div>

            {/* Get API Key Link */}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-amber-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Get an API key from Anthropic
            </a>
          </div>

          {/* Google Keep Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Google Keep Sync
              </h3>
              {keepConnected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  Not Connected
                </span>
              )}
            </div>

            {keepConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
                  <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-900" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">Google Keep</p>
                    <p className="text-sm text-gray-600 truncate">{keepEmail}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-500">
                  Your notes can be synced with Google Keep. Go to Notes to import or export.
                </p>

                <button
                  onClick={handleDisconnectKeep}
                  className="w-full py-2.5 px-4 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 font-medium rounded-xl transition-all border border-gray-200 hover:border-red-200"
                >
                  Disconnect Google Keep
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Connect your Google Keep to sync your Japanese study notes between devices.
                </p>

                <button
                  onClick={handleConnectKeep}
                  disabled={keepLoading}
                  className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {keepLoading ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Connect with Google
                    </>
                  )}
                </button>

                <div className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs text-amber-700">
                    This uses an unofficial API. Google Keep sync is experimental and may not work perfectly.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 border-2 border-transparent hover:border-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
