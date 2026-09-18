import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import { SidebarNavigationSimpleDemo } from '../components/sideBar';
// import Footer from './Footer';

const RootLayout = () => {
  return (
    <div className="flex">
      <SidebarNavigationSimpleDemo />
      <div className="flex-1">
        <NavBar />
        <main className="pt-14">
          {' '}
          {/* offset for fixed NavBar height */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RootLayout;
