'use client';

import { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';

export default function AddMarks() {
  const [formData, setFormData] = useState({
    student: '',
    subject: '',
    mark: '',
  });
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add backend API integration here
    setSuccess(true);
    setFormData({ student: '', subject: '', mark: '' });
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Container fluid className="p-4 bg-white rounded shadow-sm" style={{ maxWidth: 600 }}>
        <Row>
          <Col>
            <h2 className="mb-4 text-center">Add Marks</h2>
            {success && <Alert variant="success">Marks added successfully!</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="student">
                <Form.Label>Student Name</Form.Label>
                <Form.Control
                  required
                  type="text"
                  name="student"
                  placeholder="Enter student's name"
                  value={formData.student}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="subject">
                <Form.Label>Subject</Form.Label>
                <Form.Control
                  required
                  type="text"
                  name="subject"
                  placeholder="Enter subject"
                  value={formData.subject}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="mark">
                <Form.Label>Mark</Form.Label>
                <Form.Control
                  required
                  type="number"
                  name="mark"
                  placeholder="Enter mark"
                  min="0"
                  max="100"
                  value={formData.mark}
                  onChange={handleChange}
                />
              </Form.Group>

              <Button variant="primary" type="submit" className="w-100">Add Mark</Button>
            </Form>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
