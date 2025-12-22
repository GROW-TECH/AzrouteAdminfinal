'use client'
import { useState } from 'react';

import NavbarVertical from '/layouts/navbars/NavbarVertical';
import NavbarTop from '/layouts/navbars/NavbarTop';

export default function BranchLayout({ children }) {
  const [showMenu, setShowMenu] = useState(true);

  const toggleMenu = () => {
    setShowMenu(prev => !prev);
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

        {/* Page content */}
        {children}
      </div>
    </div>
  );
}
