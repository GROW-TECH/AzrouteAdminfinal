'use client';
import { useState } from 'react';

import NavbarVertical from '/layouts/navbars/NavbarVertical';
import NavbarTop from '/layouts/navbars/NavbarTop';

export default function RookieLayout({ children }) {
  const [showMenu, setShowMenu] = useState(true);

  const ToggleMenu = () => {
    setShowMenu(!showMenu);
  };

  return (
    <div id="db-wrapper" className={`${showMenu ? '' : 'toggled'}`}>
      {/* SIDEBAR */}
      <div className="navbar-vertical navbar">
        <NavbarVertical
          showMenu={showMenu}
          onClick={(value) => setShowMenu(value)}
        />
      </div>

      {/* PAGE CONTENT */}
      <div id="page-content">
        {/* TOP NAVBAR */}
        <div className="header">
          <NavbarTop
            data={{
              showMenu: showMenu,
              SidebarToggleMenu: ToggleMenu
            }}
          />
        </div>

        {/* ROOKIE PAGES RENDER HERE */}
        {children}
      </div>
    </div>
  );
}
