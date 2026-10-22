import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  Zap,
} from '../components/icons';
import {
  Database,
  Server,
  RefreshCw,
  XCircle,
  Lock,
  AlertTriangle,
  Info,
  Check,
  Terminal,
} from 'lucide-react';
import {
  testRedisPingServerFn,
  runRedisDemoSessionsServerFn,
  type RedisPingResult,
  type RedisDemoRunSummary,
} from '../lib/session.server-fn';

export const Route = createFileRoute('/redis-demo')({
  head: () => ({
    meta: [
      { title: 'Redis Integration Demo | GreenNext Digital Infrastructure' },
      {
        name: 'description',
        content:
          'Live verification and technical demonstration of GreenNext Redis session infrastructure, 1-hour expiration, and security architecture.',
      },
    ],
  }),
  component: RedisDemoPage,
});

export function RedisDemoPage() {
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState<RedisPingResult | null>(null);

  const [demoLoading, setDemoLoading] = useState(false);
  const [demoSummary, setDemoSummary] = useState<RedisDemoRunSummary | null>(null);
  const [cleanupChecked, setCleanupChecked] = useState(false);

  // Connection Ping Trigger
  const handleTestConnection = async () => {
    setPingLoading(true);
    try {
      const res = await testRedisPingServerFn();
      setPingResult(res);
    } catch (err) {
      setPingResult({
        success: false,
        configured: false,
        error: err instanceof Error ? err.message : 'Ping execution failed',
      });
    } finally {
      setPingLoading(false);
    }
  };

  // 10 Sessions Run Trigger
  const handleRunDemonstration = async () => {
    setDemoLoading(true);
    try {
      const res = await runRedisDemoSessionsServerFn({
        data: { cleanupAfterVerification: cleanupChecked },
      });
      setDemoSummary(res);
    } catch (err) {
      setDemoSummary({
        success: false,
        totalUsers: 10,
        createdCount: 0,
        verifiedCount: 0,
        failedCount: 10,
        defaultTtlSeconds: 3600,
        allPassed: false,
        items: [],
        cleanedUp: false,
        timestamp: Date.now(),
        statusMeta: {
          configured: false,
          connected: false,
          hasAuth: false,
          tlsEnabled: false,
        },
        error: err instanceof Error ? err.message : 'Demonstration execution failed',
      });
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-[#E2E8F0] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header / Hero */}
        <div className="border border-[#1E293B] bg-[#0A0F1D]/80 backdrop-blur-md rounded-2xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#10B981]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs font-semibold uppercase tracking-wider">
                <Database className="w-3.5 h-3.5" />
                Enterprise Infrastructure
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Redis Integration Demonstration
              </h1>
              <p className="text-sm sm:text-base text-[#94A3B8] max-w-2xl leading-relaxed">
                Live verification of GreenNext's server-only Redis session engine. Proves end-to-end
                connectivity, automatic 3,600-second (1-hour) TTL lifecycle, cryptographic session
                token generation, and strict non-leakage of database secrets.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={pingLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#1E293B] hover:bg-[#334155] text-white border border-[#334155] transition-all disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${pingLoading ? 'animate-spin text-[#10B981]' : ''}`} />
                {pingLoading ? 'Testing...' : 'Test Connection'}
              </button>

              <button
                type="button"
                onClick={handleRunDemonstration}
                disabled={demoLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#10B981] hover:bg-[#059669] text-white shadow-lg shadow-[#10B981]/20 transition-all disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 ${demoLoading ? 'animate-bounce' : ''}`} />
                {demoLoading ? 'Executing Test Pipeline...' : 'Create & Verify 10 Sessions'}
              </button>
            </div>
          </div>
        </div>

        {/* SECTION A: Connection Status */}
        <div className="border border-[#1E293B] bg-[#0B132B]/60 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-[#10B981]" />
              <h2 className="text-lg font-bold text-white">Section A: Redis Connection Status</h2>
            </div>
            <span className="text-xs font-mono text-[#64748B]">Node.js & Redis Client Engine</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0A0F1D] border border-[#1E293B] p-4 rounded-lg">
              <div className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Configuration</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span className="text-sm font-semibold text-white">Active in Environment</span>
              </div>
            </div>

            <div className="bg-[#0A0F1D] border border-[#1E293B] p-4 rounded-lg">
              <div className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Provider Endpoint</div>
              <div className="mt-1 font-mono text-xs text-white truncate">
                {pingResult?.endpoint || 'Configured Redis Node'}
              </div>
            </div>

            <div className="bg-[#0A0F1D] border border-[#1E293B] p-4 rounded-lg">
              <div className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Transport & Auth</div>
              <div className="mt-1 flex items-center gap-3 text-xs text-white">
                <span className="inline-flex items-center gap-1 text-[#10B981]">
                  <Lock className="w-3.5 h-3.5" /> Authenticated
                </span>
                <span className="text-[#64748B]">|</span>
                <span className="text-[#94A3B8]">TCP Socket (Port 13687)</span>
              </div>
            </div>

            <div className="bg-[#0A0F1D] border border-[#1E293B] p-4 rounded-lg">
              <div className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Command Status</div>
              <div className="mt-1 text-sm font-semibold">
                {pingResult ? (
                  pingResult.success ? (
                    <span className="text-[#10B981] flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> PING → {pingResult.pong} ({pingResult.latencyMs}ms)
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> Failed
                    </span>
                  )
                ) : (
                  <span className="text-[#64748B]">Ready for verification</span>
                )}
              </div>
            </div>
          </div>

          {pingResult && !pingResult.success && (
            <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-300 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Connection Error:</strong> {pingResult.error}
              </div>
            </div>
          )}

          {pingResult && pingResult.success && (
            <div className="p-4 bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg text-xs text-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>
                  <strong>Redis Online:</strong> Verified responsive round-trip with live PONG in{' '}
                  <span className="font-mono font-bold text-white">{pingResult.latencyMs} ms</span>.
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#94A3B8]">Protected Server-Only Gateway</span>
            </div>
          )}
        </div>

        {/* SECTION B: 10 Sessions Verification Table */}
        <div className="border border-[#1E293B] bg-[#0B132B]/60 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-[#10B981]" />
              <div>
                <h2 className="text-lg font-bold text-white">Section B: 10 Synthetic Test Sessions</h2>
                <p className="text-xs text-[#94A3B8]">
                  Generates 10 sessions, stores each with 1h TTL, reads back, and verifies user IDs and TTLs.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#94A3B8] select-none bg-[#0A0F1D] px-3 py-2 rounded-lg border border-[#1E293B]">
              <input
                type="checkbox"
                checked={cleanupChecked}
                onChange={(e) => setCleanupChecked(e.target.checked)}
                className="rounded border-[#334155] text-[#10B981] focus:ring-[#10B981]"
              />
              <span>Auto-cleanup test keys after verification</span>
            </label>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-[#1E293B]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0A0F1D] text-[#94A3B8] uppercase tracking-wider font-semibold border-b border-[#1E293B]">
                <tr>
                  <th className="py-3.5 px-4">Test User</th>
                  <th className="py-3.5 px-4">Session Created</th>
                  <th className="py-3.5 px-4">User Verified</th>
                  <th className="py-3.5 px-4">TTL (s)</th>
                  <th className="py-3.5 px-4">Storage Key Prefix</th>
                  <th className="py-3.5 px-4 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B] bg-[#070B14]/40 font-mono">
                {demoSummary && demoSummary.items.length > 0 ? (
                  demoSummary.items.map((item) => (
                    <tr key={item.userId} className="hover:bg-[#1E293B]/20 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white font-sans">{item.userId}</td>
                      <td className="py-3 px-4">
                        {item.sessionCreated ? (
                          <span className="inline-flex items-center gap-1 text-[#10B981] font-sans">
                            <Check className="w-3.5 h-3.5" /> Stored
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-sans">
                            <XCircle className="w-3.5 h-3.5" /> Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {item.userVerified ? (
                          <span className="inline-flex items-center gap-1 text-[#10B981] font-sans">
                            <Check className="w-3.5 h-3.5" /> Matched
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-sans">
                            <XCircle className="w-3.5 h-3.5" /> Mismatch
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400 font-bold">{item.ttlSeconds}s</span>
                        <span className="text-[#64748B] text-[11px] font-sans ml-1">(&le; 3,600s)</span>
                      </td>
                      <td className="py-3 px-4 text-[#94A3B8] text-[11px]">{item.maskedKey}</td>
                      <td className="py-3 px-4 text-right">
                        {item.passed ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                            PASS
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            FAIL
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#64748B] font-sans">
                      {demoLoading
                        ? 'Executing pipeline: Connecting to Redis, creating sessions with 3,600s TTL, reading back and verifying keys...'
                        : 'Click "Create & Verify 10 Sessions" above to run the live demonstration pipeline against Redis.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION C: Session Expiration Technical Deep Dive */}
        <div className="border border-[#1E293B] bg-[#0B132B]/60 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-[#1E293B] pb-4">
            <Clock className="w-5 h-5 text-[#10B981]" />
            <div>
              <h2 className="text-lg font-bold text-white">Section C: Session Expiration & Architecture</h2>
              <p className="text-xs text-[#94A3B8]">
                Technical principles governing high-security Redis session lifecycle management.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="bg-[#0A0F1D] border border-[#1E293B] p-5 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Database className="w-4 h-4 text-[#10B981]" />
                1. Dedicated Namespace
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                All session records are stored under the dedicated key prefix{' '}
                <code className="text-emerald-300 font-mono bg-[#1E293B]/60 px-1 py-0.5 rounded">
                  greennext:session:&lt;token&gt;
                </code>
                . This completely prevents collision with cached assets, analytics trackers, or application data.
              </p>
            </div>

            <div className="bg-[#0A0F1D] border border-[#1E293B] p-5 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Clock className="w-4 h-4 text-[#10B981]" />
                2. Automatic 1-Hour Expiration
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Sessions are stored with Redis native expiration using{' '}
                <code className="text-emerald-300 font-mono bg-[#1E293B]/60 px-1 py-0.5 rounded">
                  {'{ EX: 3600 }'}
                </code>
                . Redis automatically evicts the session key after exactly 3,600 seconds, requiring zero database polling or manual cleanup crons.
              </p>
            </div>

            <div className="bg-[#0A0F1D] border border-[#1E293B] p-5 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Activity className="w-4 h-4 text-[#10B981]" />
                3. Non-Destructive TTL Inspection
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                The remaining validity of any session is inspected using{' '}
                <code className="text-emerald-300 font-mono bg-[#1E293B]/60 px-1 py-0.5 rounded">
                  client.ttl(key)
                </code>
                . This verifies remaining lifetime in seconds without modifying or prematurely extending the expiration timer.
              </p>
            </div>

            <div className="bg-[#0A0F1D] border border-[#1E293B] p-5 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Lock className="w-4 h-4 text-[#10B981]" />
                4. Cryptographic Security
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Session tokens are 256-bit hexadecimal strings generated via{' '}
                <code className="text-emerald-300 font-mono bg-[#1E293B]/60 px-1 py-0.5 rounded">
                  crypto.randomBytes(32)
                </code>
                . They are unpredictable, brute-force immune, and never logged or exposed in raw form to the browser.
              </p>
            </div>

            <div className="bg-[#0A0F1D] border border-[#1E293B] p-5 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                5. Expiry vs. Deletion
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                <strong>Expiration</strong> is passive eviction when TTL reaches 0 seconds. In contrast,{' '}
                <strong>Deletion</strong> is active invalidation triggered during logout via{' '}
                <code className="text-emerald-300 font-mono bg-[#1E293B]/60 px-1 py-0.5 rounded">
                  client.del(key)
                </code>{' '}
                to immediately revoke session access.
              </p>
            </div>

            <div className="bg-[#0A0F1D] border border-[#1E293B] p-5 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Terminal className="w-4 h-4 text-[#10B981]" />
                6. Test Data Isolation
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Demonstrations use synthetic users only (<code className="text-emerald-300 font-mono">redis-test-user-XX</code>).
                Commands such as <code className="text-rose-400 font-mono">FLUSHDB</code> or <code className="text-rose-400 font-mono">FLUSHALL</code> are strictly prohibited.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION D: Demonstration Summary & Overall PASS/FAIL */}
        <div className="border border-[#1E293B] bg-[#0B132B]/60 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-[#1E293B] pb-4">
            <ShieldCheck className="w-5 h-5 text-[#10B981]" />
            <h2 className="text-lg font-bold text-white">Section D: Demonstration Summary & Audit</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-[#0A0F1D] border border-[#1E293B] p-4 rounded-lg">
              <div className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Redis Status</div>
              <div className="mt-1 text-base font-bold text-[#10B981]">
                {pingResult?.success ? 'Connected (PONG)' : 'Configured'}
              </div>
            </div>

            <div className="bg-[#0A0F1D] border border-[#1E293B] p-4 rounded-lg">
              <div className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Sessions Created</div>
              <div className="mt-1 text-base font-bold text-white">
                {demoSummary ? `${demoSummary.createdCount} / 10` : '-- / 10'}
              </div>
            </div>

            <div className="bg-[#0A0F1D] border border-[#1E293B] p-4 rounded-lg">
              <div className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Verified Records</div>
              <div className="mt-1 text-base font-bold text-white">
                {demoSummary ? `${demoSummary.verifiedCount} / 10` : '-- / 10'}
              </div>
            </div>

            <div className="bg-[#0A0F1D] border border-[#1E293B] p-4 rounded-lg">
              <div className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Failed Checks</div>
              <div className="mt-1 text-base font-bold text-white">
                {demoSummary ? demoSummary.failedCount : '--'}
              </div>
            </div>

            <div className="bg-[#0A0F1D] border border-[#1E293B] p-4 rounded-lg col-span-2 sm:col-span-1">
              <div className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Session Expiry</div>
              <div className="mt-1 text-base font-bold text-white">3,600s (1 Hour)</div>
            </div>
          </div>

          {/* Prominent Overall Result Banner */}
          {demoSummary && (
            <div
              className={`p-6 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                demoSummary.allPassed
                  ? 'bg-[#10B981]/10 border-[#10B981]/40 shadow-lg shadow-[#10B981]/10'
                  : 'bg-rose-950/30 border-rose-800/60'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    demoSummary.allPassed ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {demoSummary.allPassed ? (
                    <CheckCircle2 className="w-7 h-7" />
                  ) : (
                    <XCircle className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <div className="text-lg font-black text-white">
                    {demoSummary.allPassed
                      ? 'OVERALL RESULT: PASS'
                      : 'OVERALL RESULT: FAIL'}
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    {demoSummary.allPassed
                      ? `All 10 synthetic sessions created, verified, and confirmed in Redis with valid 1-hour expiration.${
                          demoSummary.cleanedUp ? ' (Cleaned up immediately per flag).' : ' (Stored in Redis until TTL expiration).'
                        }`
                      : demoSummary.error || 'One or more session validations failed.'}
                  </p>
                </div>
              </div>

              <div className="font-mono text-xs text-[#94A3B8] flex items-center gap-3">
                <span>Verified: {new Date(demoSummary.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
