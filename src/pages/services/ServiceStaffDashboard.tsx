import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { serviceApi } from '../../api/serviceApi';
import { managementApi, type SystemSettings } from '../../api/managementApi';
import { useSocket } from '../../context/socket-state';
import { ManagementPage, Metric, Notice } from '../../components/ManagementUI';
import { requestError } from '../../lib/request-error';
interface Request {
  public_id: string;
  service_name: string;
  guest_name: string;
  room_number: string;
  usage_time: string;
  quantity: number;
  status: string;
}
export default function ServiceStaffDashboard() {
  const { socket } = useSocket();
  const requestVersion = useRef(0);
  const [requests, setRequests] = useState<Request[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [error, setError] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState('');
  const [message, setMessage] = useState('');
  const [updated, setUpdated] = useState<Date | null>(null);
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    try {
      const result = await serviceApi.listServiceUsage();
      if (!Array.isArray(result.data)) throw new Error('Unable to read the service queue.');
      if (version === requestVersion.current) {
        setError('');
        setRequests(result.data);
        setUpdated(new Date());
      }
    } catch (e) {
      if (version === requestVersion.current) setError(requestError(e));
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);
  const loadSettings = useCallback(async () => {
    try {
      setSettings(await managementApi.settings());
      setSettingsError('');
    } catch (e) {
      setSettingsError(`Hotel guidance: ${requestError(e)}`);
    }
  }, []);
  useEffect(() => {
    void load();
    void loadSettings();
    const interval = window.setInterval(() => void load(), 30000);
    return () => {
      window.clearInterval(interval);
      // The counter invalidates pending responses; it is deliberately read at cleanup time.
      // oxlint-disable-next-line react-hooks/exhaustive-deps
      requestVersion.current++;
    };
  }, [load, loadSettings]);
  useEffect(() => {
    if (!socket) return;
    const refresh = () => {
      void load();
    };
    socket.on('notification', refresh);
    return () => {
      socket.off('notification', refresh);
    };
  }, [socket, load]);
  const waiting = requests
    .filter((r) => r.status === 'Pending')
    .sort((a, b) => new Date(a.usage_time).getTime() - new Date(b.usage_time).getTime());
  async function complete(id: string) {
    if (pending) return;
    setPending(id);
    setMessage('');
    setError('');
    try {
      await serviceApi.completeService(id);
      setMessage('Service request completed.');
      await load();
    } catch (e) {
      setError(requestError(e));
    } finally {
      setPending('');
    }
  }
  return (
    <ManagementPage
      title="Service Staff Dashboard"
      description="Review pending work and complete guest service requests."
      back="/services/requests"
      backLabel="Service queue"
    >
      <Notice error={error} message={message} />
      <div className="management-actions">
        <Link to="/services/requests">Open full service queue</Link>
        <button
          disabled={loading || !!pending}
          onClick={() => {
            setLoading(true);
            void load();
            void loadSettings();
          }}
        >
          Refresh
        </button>
        {updated && (
          <span className="management-muted">Updated {updated.toLocaleTimeString()}</span>
        )}
      </div>
      {loading && <p role="status">Refreshing service requests…</p>}
      <div className="management-grid">
        <Metric label="Pending requests" value={updated ? waiting.length : '—'} />
        <Metric
          label="Completed requests (all time)"
          value={updated ? requests.filter((r) => r.status === 'Completed').length : '—'}
        />
        <Metric
          label="Pending service units"
          value={updated ? waiting.reduce((sum, r) => sum + Number(r.quantity), 0) : '—'}
        />
      </div>
      <section className="management-card">
        <h2>Next requests · oldest first</h2>
        <div className="management-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Service / guest</th>
                <th>Room</th>
                <th>Quantity</th>
                <th>Requested</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {waiting.slice(0, 10).map((r) => (
                <tr key={r.public_id}>
                  <td>
                    {r.service_name}
                    <small>{r.guest_name}</small>
                  </td>
                  <td>{r.room_number}</td>
                  <td>{r.quantity}</td>
                  <td>{new Date(r.usage_time).toLocaleString()}</td>
                  <td>
                    <button
                      disabled={!!pending || loading || !!error}
                      onClick={() => void complete(r.public_id)}
                    >
                      {pending === r.public_id ? 'Completing…' : 'Mark completed'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {updated && !waiting.length && !error && (
            <p>All caught up. No pending service requests.</p>
          )}
        </div>
      </section>
      <section className="management-card">
        <h2>{settings?.hotelName || 'Hotel guidance'}</h2>
        <Notice error={settingsError} />
        {settings ? (
          <>
            <p>
              Standard check-in: {settings.checkInTime} · Check-out: {settings.checkOutTime}
            </p>
            <p>
              Contact: {settings.contactEmail}
              {settings.contactPhone && ` · ${settings.contactPhone}`}
            </p>
          </>
        ) : (
          !settingsError && <p>The administrator has not configured hotel guidance yet.</p>
        )}
      </section>
    </ManagementPage>
  );
}
