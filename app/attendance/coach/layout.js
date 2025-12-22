'use client';

import { useState } from 'react';
import NavbarVertical from '@/layouts/navbars/NavbarVertical';
import NavbarTop from '@/layouts/navbars/NavbarTop';

export default function Layout({ children }) {
  const [showMenu, setShowMenu] = useState(true);

  const toggleMenu = () => setShowMenu(!showMenu);

  return (
    <div id="db-wrapper" className={showMenu ? '' : 'toggled'}>
      <div className="navbar-vertical navbar">
        <NavbarVertical
          showMenu={showMenu}
          onClick={(value) => setShowMenu(value)}
        />
      </div>

      <div id="page-content">
        <div className="header">
          <NavbarTop
            data={{
              showMenu: showMenu,
              SidebarToggleMenu: toggleMenu,
            }}
          />
        </div>

        <main>{children}</main>
      </div>
    </div>
  );
}
