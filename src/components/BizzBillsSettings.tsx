import { useEffect, useState } from 'react';
import apiClient from '../lib/api';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Link2,
  Unlink,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface StatusData {
  baseUrl: string;
  appOnline: boolean;
  appError: string | null;
  connected: boolean;
  connectedEmail: string | null;
  lastSyncAt: string | null;
}

export default function BizzBillsSettings() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      const res = await apiClient.get('/bizzbills/status');
      if (res.data?.success) {
        setStatus(res.data.data);
        if (res.data.data.connectedEmail) setEmail(res.data.data.connectedEmail);
      }
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleConnect = async () => {
    setError(null);
    setSuccessMsg(null);
    setChecking(true);
    try {
      const res = await apiClient.post('/bizzbills/connect', { email, password });
      if (res.data?.success) {
        setSuccessMsg(`Connected as ${res.data.data.connectedAs || email}`);
        setPassword('');
        await loadStatus();
      }
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setChecking(false);
    }
  };

  const handleDisconnect = async () => {
    setError(null);
    setSuccessMsg(null);
    setChecking(true);
    try {
      const res = await apiClient.post('/bizzbills/disconnect');
      if (res.data?.success) {
        setSuccessMsg('BizzBills disconnected');
        setPassword('');
        await loadStatus();
      }
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const appOnline = status?.appOnline ?? false;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-100 rounded-xl">
          <FileText size={28} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">BizzBills</h1>
          <p className="text-sm text-gray-500">Billing, Invoicing &amp; Accounting integration</p>
        </div>
        <a
          href={status?.baseUrl}
          target="_blank"
          rel="noreferrer"
          className="ml-auto flex items-center gap-1 text-sm text-indigo-600 hover:underline"
        >
          Open App <ExternalLink size={14} />
        </a>
      </div>

      {/* App status */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">BizzBills App Status</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">App URL</span>
            <code className="text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{status?.baseUrl}</code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">App Online</span>
            {appOnline ? (
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle2 size={16} /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-red-500 font-medium">
                <XCircle size={16} /> Offline {status?.appError ? `(${status.appError})` : ''}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Integration</span>
            {status?.connected ? (
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle2 size={16} /> Connected
                {status.connectedEmail ? ` as ${status.connectedEmail}` : ''}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-gray-400 font-medium">
                <XCircle size={16} /> Not connected
              </span>
            )}
          </div>
          {status?.lastSyncAt && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Last Sync</span>
              <span className="text-gray-700">{new Date(status.lastSyncAt).toLocaleString()}</span>
            </div>
          )}
          <button
            onClick={loadStatus}
            className="mt-2 flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw size={14} /> Refresh Status
          </button>
        </div>
      </div>

      {/* Connect / Disconnect */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {status?.connected ? 'Disconnect Integration' : 'Connect BizzBills'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
            {successMsg}
          </div>
        )}

        {!status?.connected ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BizzBills Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BizzBills Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={handleConnect}
              disabled={checking || !email || !password}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
            >
              {checking ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
              {checking ? 'Connecting...' : 'Connect & Verify'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Connected as <strong>{status.connectedEmail}</strong>. You can disconnect or reconnect with
              different credentials.
            </p>
            <button
              onClick={handleDisconnect}
              disabled={checking}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
            >
              {checking ? <Loader2 size={16} className="animate-spin" /> : <Unlink size={16} />}
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
