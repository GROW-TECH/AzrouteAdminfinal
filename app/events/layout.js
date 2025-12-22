'use client';
import { useState } from 'react';

import NavbarVertical from '/layouts/navbars/NavbarVertical';
import NavbarTop from '/layouts/navbars/NavbarTop';

export default function DashboardLayout({ children }) {
  const [showMenu, setShowMenu] = useState(true);

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  return (
    <div id="db-wrapper" className={`${showMenu ? '' : 'toggled'}`}>
      {/* Vertical Sidebar (Menu) */}
      <div className="navbar-vertical navbar">
        <NavbarVertical
          showMenu={showMenu}
          onClick={(value) => setShowMenu(value)}
        />
      </div>

      {/* Main Page Content */}
      <div id="page-content">
        {/* Top Navbar with toggle button */}
        <div className="header">
          <NavbarTop
            data={{
              showMenu: showMenu,
              SidebarToggleMenu: toggleMenu
            }}
          />
        </div>

        {/* Main content rendered here */}
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
