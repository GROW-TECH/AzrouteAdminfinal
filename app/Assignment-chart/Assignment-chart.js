'use client';

import React from 'react';
import { Card, Dropdown } from 'react-bootstrap';
import Link from 'next/link';
import { MoreVertical } from 'react-feather';
import dynamic from 'next/dynamic';

// Dynamically import react-apexcharts for client-side rendering only
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const AssessmentChart = () => {
  // Example data for assessment completion percentages
  const assessmentSeries = [65, 25, 10];
  const assessmentOptions = {
    labels: ['Completed', 'Pending', 'Overdue'],
    colors: ['#4caf50', '#ff9800', '#f44336'], // Green, Orange, Red
    chart: { type: 'radialBar' },
    plotOptions: { radialBar: { hollow: { size: '55%' } } },
    dataLabels: { enabled: false },
    stroke: { lineCap: 'round' }
  };

  // Custom dropdown toggle using Next.js Link and forwarded ref
  const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
    <Link
      href="#"
      ref={ref}
      onClick={e => {
        e.preventDefault();
        onClick(e);
      }}
      className="text-muted text-primary-hover"
    >
      {children}
    </Link>
  ));
  CustomToggle.displayName = 'CustomToggle';

  // Dropdown menu for actions
  const ActionMenu = () => (
    <Dropdown>
      <Dropdown.Toggle as={CustomToggle}>
        <MoreVertical size="15px" className="text-muted" />
      </Dropdown.Toggle>
      <Dropdown.Menu align="end">
        <Dropdown.Item eventKey="1">View Details</Dropdown.Item>
        <Dropdown.Item eventKey="2">Export Report</Dropdown.Item>
        <Dropdown.Item eventKey="3">Settings</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );

  return (
    <Card className="h-100">
      <Card.Body>
        <div className="d-flex align-items-center justify-content-between">
          <h4 className="mb-0">Assessment Status</h4>
          <ActionMenu />
        </div>
        <div className="mb-8" style={{ width: '350px', height: '320px', margin: 'auto' }}>
          <Chart options={assessmentOptions} series={assessmentSeries} type="radialBar" width="100%" height="100%" />
        </div>
        <div className="d-flex align-items-center justify-content-around">
          <div className="text-center">
            <i className="fe fe-check-circle text-success fs-3"></i>
            <h1 className="mt-3 mb-1 fw-bold">{assessmentSeries[0]}%</h1>
            <p>Completed</p>
          </div>
          <div className="text-center">
            <i className="fe fe-trending-up text-warning fs-3"></i>
            <h1 className="mt-3 mb-1 fw-bold">{assessmentSeries[1]}%</h1>
            <p>Pending</p>
          </div>
          <div className="text-center">
            <i className="fe fe-alert-triangle text-danger fs-3"></i>
            <h1 className="mt-3 mb-1 fw-bold">{assessmentSeries[2]}%</h1>
            <p>Overdue</p>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default AssessmentChart;
