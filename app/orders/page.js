'use client';

import { useState, useEffect, useRef } from 'react';
import { Table, Button, Row, Col, FormControl, InputGroup } from 'react-bootstrap';
import { supabase } from '../../lib/supabaseClient';

export default function OrdersPage() {   
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, product_id, quantity, total_amount, customer_name, customer_email, customer_phone, customer_address, customer_city, customer_zip, created_at, payment_id, status')
        .eq('status', 'Paid')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('fetchOrders', error);
        setOrders([]);
        setFiltered([]);
        return;
      }

      setOrders(data);
      setFiltered(data);
    } catch (err) {
      console.error('fetchOrders unexpected', err);
      setOrders([]);
      setFiltered([]);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    setFiltered(orders);
  }, [orders]);

  function handleSearchInput(e) {
    setSearchTerm(e.target.value);
  }

  function handleSearch() {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setFiltered(orders);
      return;
    }
    const res = orders.filter((o) =>
      (o.customer_name || '').toLowerCase().includes(term) ||
      (o.customer_email || '').toLowerCase().includes(term) ||
      (o.customer_phone || '').toLowerCase().includes(term) ||
      (o.product_id || '').toLowerCase().includes(term)
    );
    setFiltered(res);
  }

  return (
    <div className="page-wrap">
      <div className="container mt-4 content-card">
        <div className="d-flex align-items-center mb-3">
          <h2 className="me-auto page-title">Orders</h2>
        </div>

        <Row className="align-items-center mb-3 gx-3">
          <Col md={7}>
            <InputGroup className="search-input">
              <FormControl
                placeholder="Search by customer name, email, phone, or product"
                value={searchTerm}
                onChange={handleSearchInput}
                style={{ borderRadius: '6px', height: '42px' }}
              />
              <Button className="btn-search" onClick={handleSearch} style={{ minWidth: '95px', borderRadius: '6px' }}>
                Search
              </Button>
            </InputGroup>
          </Col>
        </Row>

        <Table bordered hover responsive className="order-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Quantity</th>
              <th>Total Amount</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="8" className="text-center">No paid orders found.</td></tr>
            ) : (
              filtered.map((o) => (
                <tr key={o.id}>
                  <td>{o.customer_name}</td>
                  <td>{o.customer_email || '—'}</td>
                  <td>{o.customer_phone}</td>
                  <td>{o.quantity}</td>
                  <td>{o.total_amount}</td>
                  <td>{o.customer_address}, {o.customer_city}, {o.customer_zip}</td>
                  
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <style jsx>{`
        .page-wrap { min-height: calc(100vh - 20px); background: #f3f6f9; padding: 12px 18px; }
        .content-card { background: #fff; border-radius: 6px; padding: 22px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
        .page-title { margin: 0; font-weight: 600; color: #1f2d3d; }
        .search-input .form-control { border-right: none; box-shadow: none; }
        .search-input .btn-search { background: linear-gradient(90deg,#6f42ff,#8b5cf6); border: none; color: #fff; box-shadow: none; }
        .order-table thead th { background: #fafbfd; border-bottom: 1px solid #e6e9ee; font-weight: 600; color: #4b5563; }
        .btn-view { background: #4caf50; border: none; color: #fff; }
        .btn-view:hover { background: #45a049; }
      `}</style>
    </div>
  );
}
