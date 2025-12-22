"use client";

import { useState } from "react";
import NavbarVertical from "/layouts/navbars/NavbarVertical";
import NavbarTop from "/layouts/navbars/NavbarTop";

export default function ProductsLayout({ children }) {
  const [showMenu, setShowMenu] = useState(true);
  const toggleMenu = () => setShowMenu((prev) => !prev);

  return (
    <div id="db-wrapper" className={showMenu ? "" : "toggled"}>
      
      {/* LEFT SIDEBAR */}
      <div className="navbar-vertical navbar">
        <NavbarVertical showMenu={showMenu} onClick={toggleMenu} />
      </div>

      {/* PAGE CONTENT */}
      <div id="page-content">
        
        {/* TOP NAVBAR */}
        <div className="header">
          <NavbarTop data={{ showMenu, SidebarToggleMenu: toggleMenu }} />
        </div>

        {/* MAIN BODY */}
        <main className="container mt-4">
          {children}
        </main>

      </div>
    </div>
  );
}
