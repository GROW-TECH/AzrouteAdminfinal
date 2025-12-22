'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function StudentDetail() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const storedStudents = JSON.parse(localStorage.getItem('students')) || [];
    const found = storedStudents.find(s => String(s.regNo) === id);
    setStudent(found);
  }, [id]);

  if (!student) return <div className="container mt-4">Student not found</div>;

  return (
    <div className="container mt-4">
      <h2>Student Detail</h2>
      <p><strong>Name:</strong> {student.name}</p>
      <p><strong>Reg No:</strong> {student.regNo}</p>
      <p><strong>DOB:</strong> {student.dob}</p>
      <p><strong>Email:</strong> {student.email}</p>
      <p><strong>Phone:</strong> {student.phone}</p>
      <p><strong>Place:</strong> {student.place}</p>
      <p><strong>Class Type:</strong> {student.classType}</p>
      <p><strong>Group Name:</strong> {student.groupName || '-'}</p>
    </div>
  );
}