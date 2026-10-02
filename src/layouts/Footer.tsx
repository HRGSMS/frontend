import type { FC } from 'react';
import { PhoneCall, Mail, Clock, MapPin } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const FacebookIcon: FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const TwitterIcon: FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon: FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Footer: FC = () => {
  return (
    <footer className="bg-linear-to-br from-violet-950 via-purple-950 to-green-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="images/logo-1.png" alt="Smart Care Flow" className="h-10 w-auto" />
              <span className="text-lg font-semibold whitespace-nowrap">Smart Care Flow</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-5">
              Connecting patients with the right doctors at the right time — fast, simple, and
              reliable e-channeling for modern healthcare.
            </p>
            <div className="flex gap-3">
              <a
                href="##"
                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:border-violet-400 hover:text-violet-400 transition-all duration-200"
              >
                <FacebookIcon />
              </a>
              <a
                href="##"
                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:border-violet-400 hover:text-violet-400 transition-all duration-200"
              >
                <TwitterIcon />
              </a>
              <a
                href="##"
                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:border-violet-400 hover:text-violet-400 transition-all duration-200"
              >
                <InstagramIcon />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-violet-400">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {[
                { label: 'Home', to: '/' },
                { label: 'Find a Doctor', to: '/doctor' },
                { label: 'Patient Portal', to: '/patient' },
                { label: 'Get Started', to: '/getstarted' },
                { label: 'Sign In', to: '/signin' },
              ].map(({ label, to }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className="text-white/60 text-sm hover:text-violet-400 transition-colors duration-200"
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-green-400">
              Services
            </h4>
            <ul className="space-y-2">
              {[
                'Online Appointments',
                'Doctor Availability',
                'Medical Records',
                'Prescription Tracking',
                'Lab Results',
                'Emergency Booking',
              ].map((item) => (
                <li key={item}>
                  <a
                    href="##"
                    className="text-white/60 text-sm hover:text-green-400 transition-colors duration-200"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-amber-400">
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:support@smartcareflow.lk"
                  className="text-white/60 text-sm hover:text-amber-400 transition-colors"
                >
                  support@smartcareflow.lk
                </a>
              </li>
              <li className="flex items-start gap-3">
                <PhoneCall size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <a
                  href="tel:+94112345678"
                  className="text-white/60 text-sm hover:text-amber-400 transition-colors"
                >
                  +94 11 234 5678
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-white/60 text-sm">Mon – Sat, 8:00 AM – 8:00 PM</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-white/60 text-sm">Colombo 03, Sri Lanka</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-xs">© 2026 Smart Care Flow. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="##" className="text-white/40 text-xs hover:text-white/70 transition-colors">
                Privacy Policy
              </a>
              <a href="###" className="text-white/40 text-xs hover:text-white/70 transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
