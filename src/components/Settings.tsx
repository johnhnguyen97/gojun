import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  isKeepConnected,
  getKeepEmail,
  disconnectKeep,
  handleKeepCallback
} from '../services/keepApi';

interface SettingsProps {
  onClose: () => void;
}

type AIProvider = 'claude' | 'groq';

export function Settings({ onClose }: SettingsProps) {
  const { user, signOut, hasApiKey, checkApiKey, session, hasGoogleLinked, linkGoogleAccount, unlinkGoogleAccount } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // AI Provider state
  const [aiProvider, setAiProvider] = useState<AIProvider>(() => {
    return (localStorage.getItem('gojun-ai-provider') as AIProvider) || 'groq';
  });

  // Google Keep state
  const [keepConnected, setKeepConnected] = useState(false);
  const [keepEmail, setKeepEmail] = useState<string | null>(null);

  // Google account linking state
  const [googleLinkLoading, setGoogleLinkLoading] = useState(false);

  // Expanded sections
  const [expandedSection, setExpandedSection] = useState<string | null>('ai');

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const connected = isKeepConnected();
    const email = getKeepEmail();
    setKeepConnected(connected);
    setKeepEmail(email);

    try {
      const tokens = handleKeepCallback();
      if (tokens) {
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

  const handleAiProviderChange = (provider: AIProvider) => {
    setAiProvider(provider);
    localStorage.setItem('gojun-ai-provider', provider);
    setSuccess(`Switched to ${provider === 'claude' ? 'Claude' : 'Groq (Free)'}`);
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!apiKey.startsWith('sk-ant-')) {
      setError('Invalid API key format. Keys start with "sk-ant-"');
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
      if (!response.ok) throw new Error(data.error || 'Failed to save API key');

      setSuccess('API key saved!');
      setApiKey('');
      await checkApiKey();
      // Auto-switch to Claude when key is added
      handleAiProviderChange('claude');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!confirm('Delete your API key?')) return;
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/api-key', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete');

      setSuccess('API key deleted');
      await checkApiKey();
      // Auto-switch to Groq when key is deleted
      handleAiProviderChange('groq');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    handleClose();
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
    } catch (err) {
      setError('Failed to link Google account');
      setGoogleLinkLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!confirm('Unlink your Google account?')) return;
    setGoogleLinkLoading(true);
    try {
      const { error } = await unlinkGoogleAccount();
      if (error) setError(error.message);
      else setSuccess('Google account unlinked');
    } catch (err) {
      setError('Failed to unlink');
    } finally {
      setGoogleLinkLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden transform transition-all duration-200 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Messages */}
          {(error || success) && (
            <div className="px-6 pt-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {success}
                </div>
              )}
            </div>
          )}

          {/* Account Section */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  {hasGoogleLinked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">
                      <svg className="w-3 h-3" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      </svg>
                      Google
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                    aiProvider === 'claude' && hasApiKey
                      ? 'bg-purple-50 text-purple-600'
                      : 'bg-green-50 text-green-600'
                  }`}>
                    {aiProvider === 'claude' && hasApiKey ? '🧠 Claude' : '🆓 Free AI'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Settings List */}
          <div className="divide-y divide-gray-100">

            {/* AI Provider Section */}
            <div className="px-6 py-4">
              <button
                onClick={() => toggleSection('ai')}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">AI Model</p>
                    <p className="text-sm text-gray-500">
                      {aiProvider === 'claude' && hasApiKey ? 'Claude (Your Key)' : 'Groq Llama 3 (Free)'}
                    </p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'ai' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedSection === 'ai' && (
                <div className="mt-4 space-y-3">
                  {/* Provider Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Groq Card */}
                    <button
                      onClick={() => handleAiProviderChange('groq')}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        aiProvider === 'groq'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">🆓</span>
                        {aiProvider === 'groq' && (
                          <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900">Groq</p>
                      <p className="text-xs text-gray-500">Llama 3.3 70B</p>
                      <p className="text-xs text-green-600 mt-1">Free forever</p>
                    </button>

                    {/* Claude Card */}
                    <button
                      onClick={() => hasApiKey && handleAiProviderChange('claude')}
                      disabled={!hasApiKey}
                      className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                        aiProvider === 'claude' && hasApiKey
                          ? 'border-purple-500 bg-purple-50'
                          : hasApiKey
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      {/* Key saved indicator */}
                      {hasApiKey && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">🧠</span>
                        {aiProvider === 'claude' && hasApiKey && (
                          <span className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900">Claude</p>
                      <p className="text-xs text-gray-500">Sonnet 4</p>
                      <p className={`text-xs mt-1 ${hasApiKey ? 'text-green-600' : 'text-gray-400'}`}>
                        {hasApiKey ? '✓ Key saved' : 'Requires key'}
                      </p>
                    </button>
                  </div>

                  {/* API Key Input */}
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Anthropic API Key</p>
                    <form onSubmit={handleSaveApiKey} className="space-y-2">
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={hasApiKey ? 'Update key...' : 'sk-ant-api03-...'}
                          className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showApiKey ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Saving...' : hasApiKey ? 'Update' : 'Save Key'}
                        </button>
                        {hasApiKey && (
                          <button
                            type="button"
                            onClick={handleDeleteApiKey}
                            disabled={loading}
                            className="py-2 px-4 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-xl transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </form>
                    <a
                      href="https://console.anthropic.com/settings/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-gray-500 hover:text-purple-600"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Get API key from Anthropic
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Account Section */}
            <div className="px-6 py-4">
              <button
                onClick={() => toggleSection('account')}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Account</p>
                    <p className="text-sm text-gray-500">Google link, sign out</p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'account' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedSection === 'account' && (
                <div className="mt-4 space-y-3">
                  {/* Google Account */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="text-sm text-gray-700">Google Account</span>
                    </div>
                    {hasGoogleLinked ? (
                      <button
                        onClick={handleUnlinkGoogle}
                        disabled={googleLinkLoading}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        {googleLinkLoading ? 'Working...' : 'Unlink'}
                      </button>
                    ) : (
                      <button
                        onClick={handleLinkGoogle}
                        disabled={googleLinkLoading}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {googleLinkLoading ? 'Working...' : 'Link'}
                      </button>
                    )}
                  </div>

                  {/* Sign Out */}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="text-sm text-gray-700">Sign Out</span>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Data & Sync Section */}
            <div className="px-6 py-4">
              <button
                onClick={() => toggleSection('sync')}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Data & Sync</p>
                    <p className="text-sm text-gray-500">
                      {keepConnected ? `Keep: ${keepEmail}` : 'Google Keep, export'}
                    </p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'sync' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedSection === 'sync' && (
                <div className="mt-4 space-y-3">
                  {/* Google Keep */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-yellow-900" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>
                      <div>
                        <span className="text-sm text-gray-700">Google Keep</span>
                        {keepConnected && (
                          <p className="text-xs text-gray-500">{keepEmail}</p>
                        )}
                      </div>
                    </div>
                    {keepConnected ? (
                      <button
                        onClick={handleDisconnectKeep}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">Coming soon</span>
                    )}
                  </div>

                  {/* Info */}
                  <p className="text-xs text-gray-500 px-1">
                    Export your notes from the Notes panel using the export button.
                  </p>
                </div>
              )}
            </div>

            {/* About Section */}
            <div className="px-6 py-4">
              <button
                onClick={() => toggleSection('about')}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">About</p>
                    <p className="text-sm text-gray-500">Version, info</p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'about' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedSection === 'about' && (
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between p-2">
                    <span>Version</span>
                    <span className="text-gray-900 font-mono">{__GIT_COMMIT__}</span>
                  </div>
                  <div className="flex justify-between p-2">
                    <span>Last updated</span>
                    <span className="text-gray-900">{__GIT_DATE__}</span>
                  </div>
                  <div className="flex justify-between p-2">
                    <span>Made with</span>
                    <span className="text-gray-900">React + Vite</span>
                  </div>
                  <p className="text-xs text-gray-400 pt-2">
                    語順 (Gojun) - Learn Japanese word order by rearranging sentences.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom padding */}
          <div className="h-4"></div>
        </div>
      </div>
    </div>
  );
}
