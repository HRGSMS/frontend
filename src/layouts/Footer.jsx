// import React from 'react';
// import { PhoneCall, Mail, Clock, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';
// import { NavLink } from 'react-router';

// const Footer = () => {
//   return (
//     <footer className="bg-linear-to-br from-violet-950 via-purple-950 to-green-900 text-white mt-auto">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//         {/* Top Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
//           {/* Brand */}
//           <div className="col-span-1">
//             <div className="flex items-center gap-2 mb-4">
//               <img src="images/logo-1.png" alt="Smart Care Flow" className="h-10 w-auto" />
//               <span className="text-lg font-semibold whitespace-nowrap">Smart Care Flow</span>
//             </div>
//             <p className="text-white/60 text-sm leading-relaxed mb-5">
//               Connecting patients with the right doctors at the right time — fast, simple, and
//               reliable e-channeling for modern healthcare.
//             </p>
//             <div className="flex gap-3">
//               <a
//                 href="##"
//                 className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:border-violet-400 hover:text-violet-400 transition-all duration-200"
//               >
//                 <Facebook size={14} />
//               </a>
//               <a
//                 href="##"
//                 className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:border-violet-400 hover:text-violet-400 transition-all duration-200"
//               >
//                 <Twitter size={14} />
//               </a>
//               <a
//                 href="##"
//                 className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:border-violet-400 hover:text-violet-400 transition-all duration-200"
//               >
//                 <Instagram size={14} />
//               </a>
//             </div>
//           </div>

//           {/* Quick Links */}
//           <div>
//             <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-violet-400">
//               Quick Links
//             </h4>
//             <ul className="space-y-2">
//               {[
//                 { label: 'Home', to: '/' },
//                 { label: 'Find a Doctor', to: '/doctor' },
//                 { label: 'Patient Portal', to: '/patient' },
//                 { label: 'Get Started', to: '/getstarted' },
//                 { label: 'Sign In', to: '/signin' },
//               ].map(({ label, to }) => (
//                 <li key={to}>
//                   <NavLink
//                     to={to}
//                     className="text-white/60 text-sm hover:text-violet-400 transition-colors duration-200"
//                   >
//                     {label}
//                   </NavLink>
//                 </li>
//               ))}
//             </ul>
//           </div>

//           {/* Services */}
//           <div>
//             <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-green-400">
//               Services
//             </h4>
//             <ul className="space-y-2">
//               {[
//                 'Online Appointments',
//                 'Doctor Availability',
//                 'Medical Records',
//                 'Prescription Tracking',
//                 'Lab Results',
//                 'Emergency Booking',
//               ].map((item) => (
//                 <li key={item}>
//                   <a
//                     href="##"
//                     className="text-white/60 text-sm hover:text-green-400 transition-colors duration-200"
//                   >
//                     {item}
//                   </a>
//                 </li>
//               ))}
//             </ul>
//           </div>

//           {/* Contact */}
//           <div>
//             <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-amber-400">
//               Contact Us
//             </h4>
//             <ul className="space-y-4">
//               <li className="flex items-start gap-3">
//                 <Mail size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
//                 <a
//                   href="mailto:support@smartcareflow.lk"
//                   className="text-white/60 text-sm hover:text-amber-400 transition-colors"
//                 >
//                   support@smartcareflow.lk
//                 </a>
//               </li>
//               <li className="flex items-start gap-3">
//                 <PhoneCall size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
//                 <a
//                   href="tel:+94112345678"
//                   className="text-white/60 text-sm hover:text-amber-400 transition-colors"
//                 >
//                   +94 11 234 5678
//                 </a>
//               </li>
//               <li className="flex items-start gap-3">
//                 <Clock size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
//                 <span className="text-white/60 text-sm">Mon – Sat, 8:00 AM – 8:00 PM</span>
//               </li>
//               <li className="flex items-start gap-3">
//                 <MapPin size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
//                 <span className="text-white/60 text-sm">Colombo 03, Sri Lanka</span>
//               </li>
//             </ul>
//           </div>
//         </div>

//         {/* Divider */}
//         <div className="border-t border-white/10 pt-6">
//           <div className="flex flex-col md:flex-row items-center justify-between gap-4">
//             <p className="text-white/40 text-xs">© 2026 Smart Care Flow. All rights reserved.</p>
//             <div className="flex gap-6">
//               <a href="##" className="text-white/40 text-xs hover:text-white/70 transition-colors">
//                 Privacy Policy
//               </a>
//               <a href="###" className="text-white/40 text-xs hover:text-white/70 transition-colors">
//                 Cookie Policy
//               </a>
//             </div>
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;
