'use client';

import { useState, useEffect } from 'react';
import {
  Container, Row, Col, Table, Card, Badge,
  Button, Modal, Spinner, Form
} from 'react-bootstrap';
import {
  FaCreditCard, FaCheckCircle,
  FaMoneyBillWave, FaUser, FaPlus
} from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

/* ---------- helpers ---------- */
const statusBadge = (status) => {
  const s = String(status || '').toLowerCase();
  return s === 'paid'
    ? <Badge bg="success"><FaCheckCircle /> Paid</Badge>
    : <Badge bg="secondary">Not paid</Badge>;
};

/* ---------- component ---------- */
export default function PaymentDashboard() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal
  const [show, setShow] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [classType, setClassType] = useState(''); // ✅ added
  const [method, setMethod] = useState('Manual');
  const [transactionId, setTransactionId] = useState('');
  const [totalFee, setTotalFee] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [balanceFee, setBalanceFee] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  /* ---------- fetch ---------- */
  const fetchData = async () => {
    setLoading(true);

    const { data: paymentData } = await supabase
      .from('payments')
      .select(`*, student_list ( name )`)
      .order('date', { ascending: false });

    const { data: studentData } = await supabase
      .from('student_list')
      .select('id, name')
      .order('name');

    setPayments(paymentData || []);
    setStudents(studentData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  /* ---------- totals ---------- */
  const totalCollection = payments.reduce((sum, p) => {
    const st = String(p.status || '').toLowerCase();
    return st === 'paid'
      ? sum + Number(p.amount || 0)
      : sum;
  }, 0);

  /* ---------- auto balance ---------- */
  useEffect(() => {
    setBalanceFee(Number(totalFee || 0) - Number(paidAmount || 0));
  }, [totalFee, paidAmount]);

  /* ---------- save ---------- */
  const savePayment = async () => {
    if (!studentId) return alert('Select student');
    if (!classType) return alert('Select class type'); // ✅ added

    setSaving(true);

    let payload = {};

    if (method === 'Manual') {
      payload = {
        student_id: studentId,
        class_type: classType, // ✅ added
        method: 'Manual',
        transaction_id: transactionId || null,
        total_fee: totalFee || null,
        paid_amount: paidAmount || null,
        balance_fee: balanceFee || null,
        amount: paidAmount || 0,
        status: 'paid',
        date: new Date().toISOString()
      };
    } else {
      payload = {
        student_id: studentId,
        class_type: classType, // ✅ added
        method: 'Razorpay',
        amount: amount || 0,
        status: 'paid',
        date: new Date().toISOString()
      };
    }

    await supabase.from('payments').insert([payload]);

    setSaving(false);
    setShow(false);
    fetchData();
  };

  /* ---------- filters ---------- */
  const onlinePayments = payments.filter(
    p => String(p.method).toLowerCase() === 'razorpay'
  );

  const manualPayments = payments.filter(
    p => String(p.method).toLowerCase() === 'manual'
  );

  /* ---------- UI ---------- */
  return (
    <Container fluid className="p-4">
      <h2><FaMoneyBillWave /> Payment Dashboard</h2>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="bg-primary text-white">
            <Card.Body>
              <FaUser /> Total Students
              <h3>{students.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-success text-white">
            <Card.Body>
              <FaCreditCard /> Total Collection
              <h3>₹ {totalCollection}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="d-flex justify-content-end mb-3">
        <Button onClick={() => setShow(true)}>
          <FaPlus /> Add Payment
        </Button>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* ONLINE PAYMENTS */}
          <h5 className="mt-4">Online Payments (Razorpay)</h5>
          <Table bordered hover responsive>
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Class Type</th> {/* ✅ */}
                <th>Order ID</th>
                <th>Payment ID</th>
                <th>Signature</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {onlinePayments.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td>{p.student_list?.name}</td>
                  <td className="text-capitalize">
                    {p.class_type?.replaceAll('_', ' ') || '-'}
                  </td>
                  <td>{p.razorpay_order_id || '-'}</td>
                  <td>{p.razorpay_payment_id || '-'}</td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.razorpay_signature || '-'}
                  </td>
                  <td>{p.amount}</td>
                  <td>{statusBadge(p.status)}</td>
                  <td>{p.date?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* MANUAL PAYMENTS */}
          <h5 className="mt-5">Manual Payments</h5>
          <Table bordered hover responsive>
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Class Type</th> {/* ✅ */}
                <th>Txn ID</th>
                <th>Total Fee</th>
                <th>Paid Fee</th>
                <th>Bal Fee</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {manualPayments.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td>{p.student_list?.name}</td>
                  <td className="text-capitalize">
                    {p.class_type?.replaceAll('_', ' ') || '-'}
                  </td>
                  <td>{p.transaction_id || '-'}</td>
                  <td>{p.total_fee || '-'}</td>
                  <td>{p.paid_amount || '-'}</td>
                  <td>{p.balance_fee || '-'}</td>
                  <td>{statusBadge(p.status)}</td>
                  <td>{p.date?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      {/* ADD PAYMENT MODAL */}
      <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Select onChange={e => setStudentId(e.target.value)}>
              <option value="">Select Student</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Form.Select>

            {/* ✅ CLASS TYPE */}
            <Form.Select className="mt-2" onChange={e => setClassType(e.target.value)}>
              <option value="">Select Class Type</option>
              <option value="individual_offline">Individual Offline</option>
              <option value="individual_online">Individual Online</option>
              <option value="hybrid_monthly">Hybrid Monthly</option>
              <option value="group_offline">Group Offline</option>
              <option value="yearly_plan">Yearly Plan</option>
              <option value="group_online">Group Online</option>
            </Form.Select>

            <Form.Select className="mt-2" onChange={e => setMethod(e.target.value)}>
              <option value="Manual">Manual</option>
              <option value="Razorpay">Online (Razorpay)</option>
            </Form.Select>

            {method === 'Manual' && (
              <>
                <Form.Control className="mt-2" placeholder="Transaction ID"
                  onChange={e => setTransactionId(e.target.value)} />
                <Form.Control className="mt-2" type="number" placeholder="Total Fee"
                  onChange={e => setTotalFee(e.target.value)} />
                <Form.Control className="mt-2" type="number" placeholder="Paid Fee"
                  onChange={e => setPaidAmount(e.target.value)} />
                <Form.Control className="mt-2" disabled value={`Balance: ₹ ${balanceFee}`} />
              </>
            )}

            {method === 'Razorpay' && (
              <Form.Control className="mt-2" type="number" placeholder="Amount"
                onChange={e => setAmount(e.target.value)} />
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button>
          <Button onClick={savePayment} disabled={saving}>
            {saving ? <Spinner size="sm" /> : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
