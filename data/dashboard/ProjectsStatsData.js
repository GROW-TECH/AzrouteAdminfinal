import {
   Briefcase,
   ListTask,
   People,
   Bullseye
} from 'react-bootstrap-icons';
import { CreditCard2Front } from 'react-bootstrap-icons';

export const ProjectsStats = [
    {
       id: 1,
       title: "Student Count",
       value: 180,
       icon: <Briefcase size={18} />,
       // statInfo: '<span className="text-dark me-2">2</span> Completed' 
    },
    {
       id: 2,
       title: "Staff count",
       value: 132,
       icon: <ListTask size={18} />,
       // statInfo: '<span className="text-dark me-2">28</span> Completed' 
    },
    {
       id: 3,
       title: "Today Class",
       value: 12,
       icon: <People size={18} />,
       // statInfo: '<span className="text-dark me-2">1</span> Completed' 
    },
    {
       id: 4,
       title: "Student Progress",
       value: '76%',
       icon: <Bullseye size={18} />,
      // statInfo: '<span className="text-dark me-2"></span> Completed' 
    },
    {
       id: 5,
       title: "Total Class",
       value: 10,
       icon: <Briefcase size={18} />,
      // statInfo: '<span className="text-dark me-2">1</span> Completed'
    },
    {
       id: 6,
       title: "Payments",
       value: 180, // Set this to the total paid students or total payments
       icon: <CreditCard2Front size={18} />, // Use a relevant icon
       statInfo: '<span className="text-dark me-2">93</span> Paid'
    }
];

export default ProjectsStats;