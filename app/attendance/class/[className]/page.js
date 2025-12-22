'use client';
import { useSearchParams, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Container, Row, Col, Table, Card, Form, Button } from 'react-bootstrap';
import { FaUserCheck, FaUserTimes, FaUsers } from 'react-icons/fa';
import { supabase } from '../../../../lib/supabaseClient';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const StudentTable = () => {
  const params = useParams();
  const searchParams = useSearchParams();

  const selectedDate = searchParams.get('date');
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');
  const className = decodeURIComponent(params.className);

  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceMap, setAttendanceMap] = useState({});
  const [attendanceDates, setAttendanceDates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { data: studentData, error: studentError } = await supabase
          .from('student_list')
          .select('id, name, reg_no')
          .eq('course', className);

        if (studentError) throw studentError;
        setStudents(studentData || []);
        if (!studentData || studentData.length === 0) {
          setAttendanceMap({});
          setAttendanceDates([]);
          setLoading(false);
          return;
        }

        const studentIds = studentData.map(s => s.id);
        let attendanceQuery = supabase
          .from('attendance')
          .select('student_id, attendance_date, status')
          .eq('class_type', className)
          .in('student_id', studentIds);

        if (fromDate && toDate) {
          attendanceQuery = attendanceQuery
            .gte('attendance_date', fromDate)
            .lte('attendance_date', toDate);
        } else if (fromDate && !toDate) {
          const currentDate = dayjs().format('YYYY-MM-DD');
          attendanceQuery = attendanceQuery
            .gte('attendance_date', fromDate)
            .lte('attendance_date', currentDate);
        } else if (selectedDate) {
          attendanceQuery = attendanceQuery.eq('attendance_date', selectedDate);
        } else {
          const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
          const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD');
          attendanceQuery = attendanceQuery
            .gte('attendance_date', monthStart)
            .lte('attendance_date', monthEnd);
        }

        const { data: attendanceData, error: attendanceError } = await attendanceQuery;
        if (attendanceError) throw attendanceError;

        let uniqueDates = [];
        if (selectedDate) {
          uniqueDates = [selectedDate];
        } else if (fromDate && toDate) {
          let curr = dayjs(fromDate);
          const last = dayjs(toDate);
          while (curr.isSame(last, 'day') || curr.isBefore(last, 'day')) {
            uniqueDates.push(curr.format('YYYY-MM-DD'));
            curr = curr.add(1, 'day');
          }
        } else if (fromDate && !toDate) {
          let curr = dayjs(fromDate);
          const last = dayjs();
          while (curr.isSame(last, 'day') || curr.isBefore(last, 'day')) {
            uniqueDates.push(curr.format('YYYY-MM-DD'));
            curr = curr.add(1, 'day');
          }
        } else {
          let curr = dayjs().startOf('month');
          const last = dayjs().endOf('month');
          while (curr.isSame(last, 'day') || curr.isBefore(last, 'day')) {
            uniqueDates.push(curr.format('YYYY-MM-DD'));
            curr = curr.add(1, 'day');
          }
        }
        uniqueDates = uniqueDates.sort();
        setAttendanceDates(uniqueDates);

        const amap = {};
        (attendanceData || []).forEach(({ student_id, attendance_date, status }) => {
          if (!amap[student_id]) amap[student_id] = {};
          amap[student_id][attendance_date] = status;
        });
        setAttendanceMap(amap);
      } catch (error) {
        console.error('Error loading data:', error.message);
        setStudents([]);
        setAttendanceMap({});
        setAttendanceDates([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [className, fromDate, toDate, selectedDate]);

  const filteredStudents = students.filter(
    s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         s.reg_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  let totalPresent = 0, totalAbsent = 0;
  filteredStudents.forEach(s => {
    totalPresent += attendanceDates.filter(date => attendanceMap[s.id]?.[date] === 'P').length;
    totalAbsent += attendanceDates.filter(date => attendanceMap[s.id]?.[date] === 'A').length;
  });

  // Download Excel handler
  const handleDownload = () => {
    const sheetData = [];
    const header = ["S.No", "Reg No", "Student Name", ...attendanceDates.map(d => dayjs(d).format("DD/MM/YYYY"))];
    if (attendanceDates.length > 1) header.push("Attendance %");
    sheetData.push(header);

    filteredStudents.forEach((s, idx) => {
      const presentDays = attendanceDates.filter(date => attendanceMap[s.id]?.[date] === 'P').length;
      const attendancePercentage = attendanceDates.length > 0
        ? ((presentDays / attendanceDates.length) * 100).toFixed(1)
        : '0.0';
      const row = [
        idx + 1,
        s.reg_no,
        s.name,
        ...attendanceDates.map(date => attendanceMap[s.id]?.[date] || "-")
      ];
      if (attendanceDates.length > 1) row.push(`${attendancePercentage}%`);
      sheetData.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `${className}_Attendance.xlsx`);
  };

  return (
    <Container fluid className="p-4">
      <h3 className="mb-4">
        {className} Attendance Details
        {selectedDate ? ` (${dayjs(selectedDate).format('DD/MM/YYYY')})` : ''}
        {(!selectedDate && fromDate && toDate) ? ` (${dayjs(fromDate).format('DD/MM/YYYY')} to ${dayjs(toDate).format('DD/MM/YYYY')})` : ''}
        {(!selectedDate && fromDate && !toDate) ? ` (${dayjs(fromDate).format('DD/MM/YYYY')} to ${dayjs().format('DD/MM/YYYY')})` : ''}
        {(!selectedDate && !fromDate && !toDate) ? ` (${dayjs().format('MMMM YYYY')})` : ''}
      </h3>

      <Button variant="secondary" className="mb-3" onClick={handleDownload}>
        📥 Download Attendance (Excel)
      </Button>

      {loading ? <p>Loading...</p> : (
        <>
          <Row className="mb-4">
            <Col md={4}>
              <Card className="bg-primary text-white mb-3 shadow-sm">
                <Card.Body>
                  <Card.Title><FaUsers /> Total Students</Card.Title>
                  <Card.Text style={{ fontSize: '2rem' }}>{filteredStudents.length}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="bg-success text-white mb-3 shadow-sm">
                <Card.Body>
                  <Card.Title><FaUserCheck /> Present</Card.Title>
                  <Card.Text style={{ fontSize: '2rem' }}>{totalPresent}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="bg-danger text-white mb-3 shadow-sm">
                <Card.Body>
                  <Card.Title><FaUserTimes /> Absent</Card.Title>
                  <Card.Text style={{ fontSize: '2rem' }}>{totalAbsent}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Form.Control
            type="text"
            placeholder="Search by student name or reg no"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="mb-3"
          />

          <Table bordered hover responsive className="shadow-sm text-center align-middle">
            <thead className="table-dark">
              <tr>
                <th>S.No</th>
                <th>Reg No</th>
                <th>Student Name</th>
                {attendanceDates.map(date => (
                  <th key={date}>Status<br />({dayjs(date).format('DD/MM/YYYY')})</th>
                ))}
                {attendanceDates.length > 1 && <th>Attendance %</th>}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={3 + attendanceDates.length + (attendanceDates.length > 1 ? 1 : 0)} className="text-center">
                    No students found for {className}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const presentDays = attendanceDates.filter(date => attendanceMap[s.id]?.[date] === 'P').length;
                  const attendancePercentage = attendanceDates.length > 0
                    ? ((presentDays / attendanceDates.length) * 100).toFixed(1)
                    : '0.0';
                  return (
                    <tr key={s.id}>
                      <td>{idx + 1}</td>
                      <td>{s.reg_no}</td>
                      <td>{s.name}</td>
                      {attendanceDates.map(date => (
                        <td key={date} className={
                          attendanceMap[s.id]?.[date] === 'P' ? 'text-success' :
                          attendanceMap[s.id]?.[date] === 'A' ? 'text-danger' : ''
                        }>
                          {attendanceMap[s.id]?.[date] === 'P' ? 'Present' :
                           attendanceMap[s.id]?.[date] === 'A' ? 'Absent' : '-'}
                        </td>
                      ))}
                      {attendanceDates.length > 1 && <td>{attendancePercentage}%</td>}
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </>
      )}
    </Container>
  );
};

export default StudentTable;
