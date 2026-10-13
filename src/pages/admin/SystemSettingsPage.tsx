import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { managementApi, type SystemSettings } from '../../api/managementApi';
import { ManagementPage, Notice } from '../../components/ManagementUI';
import { requestError } from '../../lib/request-error';
const empty: SystemSettings = {
  hotelName: '',
  contactEmail: '',
  contactPhone: '',
  checkInTime: '14:00',
  checkOutTime: '12:00',
  revision: 0,
};
export default function SystemSettingsPage() {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);
  const load = useCallback(async () => {
    try {
      setForm((await managementApi.settings()) || empty);
      setReady(true);
      setError('');
    } catch (e) {
      setError(requestError(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      setForm(await managementApi.saveSettings(form));
      setMessage('System settings saved.');
    } catch (e) {
      setError(requestError(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <ManagementPage
      title="System Settings"
      description="Hotel contact details and standard arrival times."
      back="/admin/dashboard"
    >
      <Notice error={error} message={message} />
      <section className="management-card">
        <h2>Hotel operations</h2>
        <p className="management-muted">
          These details appear on the service staff dashboard. Standard times are guidance for the
          team; existing reservations retain their booked times.
        </p>
        {loading && <p role="status">Loading settings…</p>}
        <form onSubmit={save}>
          <fieldset disabled={loading || saving || !ready} className="management-form">
            <label>
              Hotel name
              <input
                required
                maxLength={120}
                value={form.hotelName}
                onChange={(e) => setForm({ ...form, hotelName: e.target.value })}
              />
            </label>
            <label>
              Contact email
              <input
                required
                type="email"
                maxLength={254}
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              />
            </label>
            <label>
              Contact phone
              <input
                type="tel"
                maxLength={40}
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              />
            </label>
            <label>
              Standard check-in
              <input
                required
                type="time"
                value={form.checkInTime}
                onChange={(e) => setForm({ ...form, checkInTime: e.target.value })}
              />
            </label>
            <label>
              Standard check-out
              <input
                required
                type="time"
                value={form.checkOutTime}
                onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })}
              />
            </label>
            <div>
              <button>{saving ? 'Saving…' : 'Save settings'}</button>
            </div>
          </fieldset>
        </form>
        <div className="management-actions">
          <button
            className="secondary"
            disabled={loading || saving}
            onClick={() => {
              setLoading(true);
              setReady(false);
              setError('');
              setMessage('');
              void load();
            }}
          >
            Reload saved settings
          </button>
        </div>
      </section>
    </ManagementPage>
  );
}
