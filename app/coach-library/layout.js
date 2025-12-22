'use client';

import { useState } from "react";
import NavbarVertical from "/layouts/navbars/NavbarVertical";
import NavbarTop from "/layouts/navbars/NavbarTop";

export default function CoachLibraryLayout({ children }) {
  const [showMenu, setShowMenu] = useState(true);

  const ToggleMenu = () => setShowMenu(!showMenu);

  return (
    <div id="db-wrapper" className={`${showMenu ? "" : "toggled"}`}>
      <div className="navbar-vertical navbar">
        <NavbarVertical showMenu={showMenu} onClick={(value) => setShowMenu(value)} />
      </div>
      <div id="page-content">
        <div className="header">
          <NavbarTop
            data={{
              showMenu: showMenu,
              SidebarToggleMenu: ToggleMenu,
            }}
          />
        </div>
        {children}
      </div>
    </div>
  );
}
