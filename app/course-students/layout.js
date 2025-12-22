'use client';

import { useState } from 'react';

// Import theme styles
import 'styles/theme.scss';

// Import subcomponents for navigation
import NavbarVertical from '/layouts/navbars/NavbarVertical';
import NavbarTop from '/layouts/navbars/NavbarTop';

export default function DashboardLayout({ children }) {
  // Controls whether sidebar menu is shown or toggled
  const [showMenu, setShowMenu] = useState(true);

  // Toggle sidebar menu visibility
  const ToggleMenu = () => setShowMenu(!showMenu);

  return (
    <div id="db-wrapper" className={`${showMenu ? '' : 'toggled'}`}>
      <div className="navbar-vertical navbar">
        <NavbarVertical showMenu={showMenu} onClick={(value) => setShowMenu(value)} />
      </div>
      <div id="page-content">
        <div className="header">
          <NavbarTop data={{ showMenu, SidebarToggleMenu: ToggleMenu }} />
        </div>
        {children}
      </div>
    </div>
  );
  
}
