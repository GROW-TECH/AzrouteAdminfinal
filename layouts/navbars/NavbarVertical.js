'use client'
// import node module libraries
import { Fragment, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'
import { useMediaQuery } from 'react-responsive';
import {
    ListGroup,
    Card,
    Image,
    Badge,
} from 'react-bootstrap';
import Accordion from 'react-bootstrap/Accordion';
import AccordionContext from 'react-bootstrap/AccordionContext';
import { useAccordionButton } from 'react-bootstrap/AccordionButton';

// import simple bar scrolling used for notification item scrolling
import SimpleBar from 'simplebar-react';
import 'simplebar/dist/simplebar.min.css';

// import routes file
import { DashboardMenu } from 'routes/DashboardRoutes';

// import supabase client (adjusted to your project layout)
import { supabase } from '../../lib/supabaseClient';

const NavbarVertical = (props) => {
    const location = usePathname()
    const isMobile = useMediaQuery({ maxWidth: 767 });

    // restrict flag
    const [isRestrictedUser, setIsRestrictedUser] = useState(false);

    // The single UUID you wanted restricted
    const ONLY_RESTRICTED_ID = '415ed8d0-547d-4c84-8f82-495e59dc834a';
    const ITEMS_TO_HIDE = new Set(['Add Branch', 'Attendance', 'Payment']);

    useEffect(() => {
      let mounted = true;
      async function checkUser() {
        try {
          const resp = await supabase.auth.getUser();
          const user = resp?.data?.user;
          if (!mounted) return;
          if (user && user.id === ONLY_RESTRICTED_ID) setIsRestrictedUser(true);
          else setIsRestrictedUser(false);
        } catch (err) {
          console.error('Failed to fetch user for sidebar restrictions', err);
          if (mounted) setIsRestrictedUser(false);
        }
      }
      checkUser();
      return () => { mounted = false; };
    }, []);

    const CustomToggle = ({ children, eventKey, icon }) => {
        const { activeEventKey } = useContext(AccordionContext);
        const decoratedOnClick = useAccordionButton(eventKey, () =>
            console.log('totally custom!')
        );
        const isCurrentEventKey = activeEventKey === eventKey;
        return (
            <li className="nav-item">
                <Link
                    href="#"
                    className="nav-link "
                    onClick={decoratedOnClick}
                    data-bs-toggle="collapse"
                    data-bs-target="#navDashboard"
                    aria-expanded={isCurrentEventKey ? true : false}
                    aria-controls="navDashboard">
                  <span className="nav-icon me-2 d-inline-flex align-items-center">
  {icon}
</span>
<span>{children}</span>

                </Link>
            </li>
        );
    };

    const CustomToggleLevel2 = ({ children, eventKey, icon }) => {
        const { activeEventKey } = useContext(AccordionContext);
        const decoratedOnClick = useAccordionButton(eventKey, () =>
            console.log('totally custom!')
        );
        const isCurrentEventKey = activeEventKey === eventKey;
        return (
            <Link
                href="#"
                className="nav-link "
                onClick={decoratedOnClick}
                data-bs-toggle="collapse"
                data-bs-target="#navDashboard"
                aria-expanded={isCurrentEventKey ? true : false}
                aria-controls="navDashboard">
                {children}
            </Link>
        );
    };

    const generateLink = (item) => {
        return (
            <Link
                href={item.link}
                className={`nav-link ${location === item.link ? 'active' : ''}`}
                onClick={() => isMobile && props.onClick(!props.showMenu)}
            >
                {item.name || item.title}
                {item.badge ? (
                    <Badge
                        className="ms-1"
                        bg={item.badgecolor ? item.badgecolor : 'primary'}
                    >
                        {item.badge}
                    </Badge>
                ) : null}
            </Link>
        );
    };

    // compute menu to render (filter only top-level items that should be hidden)
    const menuToRender = DashboardMenu.filter(m => {
      // if restricted user, hide items whose title is in ITEMS_TO_HIDE
      if (isRestrictedUser && ITEMS_TO_HIDE.has(m.title)) return false;
      return true;
    });

    return (
        <Fragment>
            <SimpleBar style={{ maxHeight: '100vh' }}>
          <div className="nav-scroller d-flex justify-content-center align-items-center"
  style={{ 
    color: 'white', 
    height: '70px', 
    fontWeight: 'bold', 
    fontSize: '1.8rem', 
    paddingTop: '16px' // or marginTop: '8px'
  }}>
  <Link 
    href="/dashboard"
    style={{ color: 'inherit', textDecoration: 'none' }}
    className="cursor-pointer"
  >
    AZROUTE
  </Link>
</div>

              
                {/* Dashboard Menu */}
                <Accordion defaultActiveKey="0" as="ul" className="navbar-nav flex-column">
                    {menuToRender.map(function (menu, index) {
                        if (menu.grouptitle) {
                            return (
                                <Card bsPrefix="nav-item" key={index}>
                                    {/* group title item */}
                                    <div className="navbar-heading">{menu.title}</div>
                                    {/* end of group title item */}
                                </Card>
                            );
                        } else {
                            if (menu.children) {
                                return (
                                    <Fragment key={index}>
                                        {/* main menu / root menu level / root items */}
                                        <CustomToggle eventKey={index} icon={menu.icon}>
                                            {menu.title}
                                            {menu.badge ? (
                                                <Badge className="ms-1" bg={menu.badgecolor ? menu.badgecolor : 'primary'}>
                                                    {menu.badge}
                                                </Badge>
                                            ) : null}
                                        </CustomToggle>
                                        <Accordion.Collapse eventKey={index} as="li" bsPrefix="nav-item">
                                            <ListGroup as="ul" bsPrefix="" className="nav flex-column">
                                                {menu.children.map(function (menuLevel1Item, menuLevel1Index) {
                                                    if (menuLevel1Item.children) {
                                                        return (
                                                            <ListGroup.Item as="li" bsPrefix="nav-item" key={menuLevel1Index}>
                                                                {/* first level menu started  */}
                                                                <Accordion defaultActiveKey="0" className="navbar-nav flex-column">
                                                                    <CustomToggleLevel2 eventKey={0}>
                                                                        {menuLevel1Item.title}
                                                                        {menuLevel1Item.badge ? (
                                                                            <Badge className="ms-1" bg={menuLevel1Item.badgecolor ? menuLevel1Item.badgecolor : 'primary'}>
                                                                                {menuLevel1Item.badge}
                                                                            </Badge>
                                                                        ) : null}
                                                                    </CustomToggleLevel2>
                                                                    <Accordion.Collapse eventKey={0} bsPrefix="nav-item">
                                                                        <ListGroup as="ul" bsPrefix="" className="nav flex-column">
                                                                            {/* second level menu started  */}
                                                                            {menuLevel1Item.children.map(function (menuLevel2Item, menuLevel2Index) {
                                                                                if (menuLevel2Item.children) {
                                                                                    return (
                                                                                        <ListGroup.Item as="li" bsPrefix="nav-item" key={menuLevel2Index}>
                                                                                            {/* second level accordion menu started  */}
                                                                                            <Accordion defaultActiveKey="0" className="navbar-nav flex-column">
                                                                                                <CustomToggleLevel2 eventKey={0}>
                                                                                                    {menuLevel2Item.title}
                                                                                                    {menuLevel2Item.badge ? (
                                                                                                        <Badge className="ms-1" bg={menuLevel2Item.badgecolor ? menuLevel2Item.badgecolor : 'primary'}>
                                                                                                            {menuLevel2Item.badge}
                                                                                                        </Badge>
                                                                                                    ) : null}
                                                                                                </CustomToggleLevel2>
                                                                                                <Accordion.Collapse eventKey={0} bsPrefix="nav-item">
                                                                                                    <ListGroup as="ul" bsPrefix="" className="nav flex-column">
                                                                                                        {/* third level menu started  */}
                                                                                                        {menuLevel2Item.children.map(function (menuLevel3Item, menuLevel3Index) {
                                                                                                            return (
                                                                                                                <ListGroup.Item key={menuLevel3Index} as="li" bsPrefix="nav-item">
                                                                                                                    {generateLink(menuLevel3Item)}
                                                                                                                </ListGroup.Item>
                                                                                                            );
                                                                                                        })}
                                                                                                        {/* end of third level menu  */}
                                                                                                    </ListGroup>
                                                                                                </Accordion.Collapse>
                                                                                            </Accordion>
                                                                                            {/* end of second level accordion */}
                                                                                        </ListGroup.Item>
                                                                                    );
                                                                                } else {
                                                                                    return (
                                                                                        <ListGroup.Item key={menuLevel2Index} as="li" bsPrefix="nav-item">
                                                                                            {generateLink(menuLevel2Item)}
                                                                                        </ListGroup.Item>
                                                                                    );
                                                                                }
                                                                            })}
                                                                            {/* end of second level menu  */}
                                                                        </ListGroup>
                                                                    </Accordion.Collapse>
                                                                </Accordion>
                                                                {/* end of first level menu */}
                                                            </ListGroup.Item>
                                                        );
                                                    } else {
                                                        return (
                                                            <ListGroup.Item as="li" bsPrefix="nav-item" key={menuLevel1Index}>
                                                                {/* first level menu items */}
                                                                {generateLink(menuLevel1Item)}
                                                                {/* end of first level menu items */}
                                                            </ListGroup.Item>
                                                        );
                                                    }
                                                })}
                                            </ListGroup>
                                        </Accordion.Collapse>
                                        {/* end of main menu / menu level 1 / root items */}
                                    </Fragment>
                                );
                            } else {
                                // This is where we render menu items that have no children
                                // Add logout button handling here
                               // Logout Menu Item
                                if (menu.title === 'Logout') {
                                    return (
                                        <Card bsPrefix="nav-item" key={index}>
                                            <Link
                                                href="#"
                                                className={`nav-link ${location === menu.link ? 'active' : ''}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (typeof window !== "undefined") {
                                                        localStorage.removeItem('isAuthenticated');
                                                    }
                                                    if (isMobile && props.onClick) props.onClick(false);
                                                    window.location.href = '/Authentication/sign-in';
                                                }}
                                            >
                                             <span className="nav-icon me-2 d-inline-flex align-items-center">
  {menu.icon}
</span>
<span>{menu.title}</span>

                                                {menu.badge ? (
                                                    <Badge
                                                        className="ms-1"
                                                        bg={menu.badgecolor ? menu.badgecolor : 'primary'}
                                                    >
                                                        {menu.badge}
                                                    </Badge>
                                                ) : null}
                                            </Link>
                                        </Card>
                                    );
                                }

                                // Normal menu item rendering
                                return (
                                    <Card bsPrefix="nav-item" key={index}>
                                        <Link href={menu.link} className={`nav-link ${location === menu.link ? 'active' : ''} ${menu.title === 'Download' ? 'bg-primary text-white' : ''}`}
                                            onClick={() => isMobile && props.onClick(!props.showMenu)}
                                        >
                                         <span className="nav-icon me-2 d-inline-flex align-items-center">
  {menu.icon}
</span>
<span>{menu.title}</span>

                                            {menu.badge ? (
                                                <Badge className="ms-1" bg={menu.badgecolor ? menu.badgecolor : 'primary'}>
                                                    {menu.badge}
                                                </Badge>
                                            ) : null}
                                        </Link>
                                    </Card>
                                );
                            }
                        }
                    })}
                </Accordion>
                {/* end of Dashboard Menu */}
            </SimpleBar>
        </Fragment>
    );
};

export default NavbarVertical;
