'use client'
import { useState } from 'react';

import NavbarVertical from '/layouts/navbars/NavbarVertical';
import NavbarTop from '/layouts/navbars/NavbarTop';

export default function StudentListLayout({ children }) {
  const [showMenu, setShowMenu] = useState(true);

  const toggleMenu = () => {
    setShowMenu(prevShowMenu => !prevShowMenu);
  };

  return (
    <div id="db-wrapper" className={showMenu ? '' : 'toggled'}>
      <div className="navbar-vertical navbar">
        <NavbarVertical
          showMenu={showMenu}
          onClick={toggleMenu}
        />
      </div>

      <div id="page-content">
        <div className="header">
          <NavbarTop
            data={{
              showMenu,
              SidebarToggleMenu: toggleMenu
            }}
          />
        </div>

        {/* Tournament List renders here */}
        {children}
      </div>
    </div>
  );
}
