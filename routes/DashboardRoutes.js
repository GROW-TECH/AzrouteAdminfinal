import { v4 as uuid } from 'uuid';
import {
  FaHome,
  FaUsers,
  FaCreditCard,
  FaCalendarAlt,
  FaCalendarCheck,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaFileAlt,
  FaUserCircle,
  FaSignOutAlt,
  FaBox,
  FaBoxes,
  FaSchool,
  FaClipboardList 
} from 'react-icons/fa';

// --- Dashboard Menu ---
export const DashboardMenu = [
  {
    id: uuid(),
    title: 'Dashboard',
    icon: <FaHome />,
    link: '/dashboard'
  },
  {
    id: uuid(),
    title: 'Add Branch',
    icon: <FaHome />,
    link: '/branch'
  },
  {
    id: uuid(),
    title: 'Student List',
    icon: <FaUsers />,
    link: '/student-list'
  },
  {
    id: uuid(),
    title: 'Coach List',
    icon: <FaChalkboardTeacher />,
    link: '/coach-list'
  },
  {
    id: uuid(),
    title: 'Course Register',
    icon: <FaSchool />,
    link: '/course-students'
  },
  {
    id: uuid(),
    title: 'Self study & course',
    icon: <FaSchool />,
    link: '/courses'
  },
  {
    id: uuid(),
    title: 'Add Course Video',
    icon: <FaSchool />,
    link: '/courses-video'
  },
  {
    id: uuid(),
    title: 'Payment',
    icon: <FaCreditCard />,
    link: '/payment'
  },
 {
    id: uuid(),
    title: 'Coach Library',
    icon: <FaSchool />,
    link: '/coach-library'
  },
  {
    id: uuid(),
    title: 'Compensation Classes',
    icon: <FaChalkboardTeacher />,
    link: '/compensation'
  },
  // ✅ ATTENDANCE (FIXED)
  {
    id: uuid(),
    title: 'Attendance',
    icon: <FaClipboardList />,
    link: '/attendance',
    children: [
      {
        id: uuid(),
        title: 'Student Attendance',
        icon: <FaUserGraduate />,
        link: '/attendance/student'
      },
      {
        id: uuid(),
        title: 'Coach Attendance',
        icon: <FaChalkboardTeacher />,
        link: '/attendance/coach'
      },
      {
        id: uuid(),
        title: 'Employee Attendance',
        icon: <FaUsers />,
        link: '/attendance/employee'
      }
    ]
  },

  // ✅ STUDENT CERTIFICATE
  {
    id: uuid(),
    title: 'Student Certificate',
    icon: <FaUserGraduate />,
    link: '/marks',
    children: [
      { id: uuid(), title: 'Rookie', link: '/marks/rookie' },
      { id: uuid(), title: 'Dabbler', link: '/marks/dabbler' },
      { id: uuid(), title: 'Beginner', link: '/marks/beginner' },
      { id: uuid(), title: 'Competent', link: '/marks/competent' },
      { id: uuid(), title: 'Intermediate', link: '/marks/intermediate' },
      { id: uuid(), title: 'Advanced', link: '/marks/advanced' }
    ]
  },

  {
    id: uuid(),
    title: 'Events',
    icon: <FaCalendarAlt />,
    link: '/events'
  },
  {
    id: uuid(),
    title: 'tournament Preparation',
    icon: <FaUserGraduate />,
    link: '/tournament-list'
  },
  {
    id: uuid(),
    title: 'Class Scheduled',
    icon: <FaUserGraduate />,
    link: '/class-list'
  },
  {
    id: uuid(),
    title: 'Offline Class',
    icon: <FaChalkboardTeacher />,
    link: '/offline-class'
  },
  {
    id: uuid(),
    title: 'Demo Class',
    icon: <FaChalkboardTeacher />,
    link: '/demo-class'
  },
  {
    id: uuid(),
    title: 'Student Report',
    icon: <FaFileAlt />,
    link: '/assessments'
  },
  {
    id: uuid(),
    title: 'Profile',
    icon: <FaUserCircle />,
    link: '/profile'
  },
  {
    id: uuid(),
    title: 'Products',
    icon: <FaBox />,
    link: '/products'
  },
  {
    id: uuid(),
    title: 'Employee List',
    icon: <FaUsers />,
    link: '/employ-list'
  },
  {
    id: uuid(),
    title: 'Orders',
    icon: <FaBoxes />,
    link: '/orders'
  },
  {
    id: uuid(),
    title: 'Logout',
    icon: <FaSignOutAlt />,
    link: '/logout'
  }
];

// --- helper for filtering ---
const itemsToHideForRestricted = new Set(['Add Branch', 'Attendance' , 'Orders' ,'Employee List']);

export function filterMenuForUser(userId) {
  const restrictedIds = ['415ed8d0-547d-4c84-8f82-495e59dc834a'];

  if (!userId) return DashboardMenu;
  if (restrictedIds.includes(userId)) {
    return DashboardMenu.filter(item => !itemsToHideForRestricted.has(item.title));
  }
  return DashboardMenu;
}

export default DashboardMenu;
