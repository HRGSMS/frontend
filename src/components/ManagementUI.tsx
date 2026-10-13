import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './ManagementUI.css';
export function ManagementPage({
  title,
  description,
  children,
  back = '/manager/dashboard',
  backLabel = 'Dashboard',
}: {
  title: string;
  description: string;
  children: ReactNode;
  back?: string;
  backLabel?: string;
}) {
  return (
    <main className="management-page">
      <header className="management-heading">
        <div>
          <p className="management-eyebrow">SKYNEST · HOTEL OPERATIONS</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <Link to={back}>← {backLabel}</Link>
      </header>
      {children}
    </main>
  );
}
export function Notice({ error, message }: { error?: string; message?: string }) {
  return (
    <>
      {error && (
        <p role="alert" className="management-error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="management-success">
          {message}
        </p>
      )}
    </>
  );
}
export function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <article className="management-card">
      <p>{label}</p>
      <strong className="management-metric">{value}</strong>
    </article>
  );
}
