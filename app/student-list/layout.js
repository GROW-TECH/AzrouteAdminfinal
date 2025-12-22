'use client'
import { useState } from 'react';

import NavbarVertical from '/layouts/navbars/NavbarVertical';
import NavbarTop from '/layouts/navbars/NavbarTop';

export default function StudentListLayout({ children }) {
  // State for menu visibility
  const [showMenu, setShowMenu] = useState(true);

  // Toggle function to switch menu state
  const toggleMenu = () => {
    setShowMenu(prevShowMenu => !prevShowMenu);
  };

  return (
    <div id="db-wrapper" className={showMenu ? '' : 'toggled'}>
      <div className="navbar-vertical navbar">
        <NavbarVertical
          showMenu={showMenu}
          // Pass a function that toggles, not a setter expecting value
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
        {/* Main content */}
        {children}
      </div>
    </div>
  );
}
