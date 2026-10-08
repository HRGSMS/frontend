import type { FC } from 'react';
import { Outlet } from 'react-router-dom';
// import NavBar from './NavBar';
import { SidebarNavigationSimpleDemo } from '../components/sideBar';
// import Footer from './Footer';

const RootLayout: FC = () => {
  return (
    <div className="flex">
      <SidebarNavigationSimpleDemo />
      <div className="flex-1">
        {/* <NavBar /> */}
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RootLayout;
