'use client'
import React from "react";
import { Card, Dropdown } from 'react-bootstrap';
import Link from 'next/link';
import { MoreVertical } from 'react-feather';
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const PaymentsChart = () => {
    const paymentSeries = [70, 20, 10];
    const paymentOptions = {
        labels: ['Paid', 'Pending', 'Overdue'],
        colors: ['#28a745', '#ffc107', '#dc3545'],
        chart: { type: 'radialBar' },
        plotOptions: { radialBar: { hollow: { size: '55%' } } },
        dataLabels: { enabled: false },
        stroke: { lineCap: "round" }
    };

    const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
        <Link href="" ref={ref} onClick={e => { e.preventDefault(); onClick(e); }} className="text-muted text-primary-hover">
            {children}
        </Link>
    ));
    CustomToggle.displayName = 'CustomToggle';

    const ActionMenu = () => (
        <Dropdown>
            <Dropdown.Toggle as={CustomToggle}>
                <MoreVertical size="15px" className="text-muted" />
            </Dropdown.Toggle>
            <Dropdown.Menu align={'end'}>
                <Dropdown.Item eventKey="1">Action</Dropdown.Item>
                <Dropdown.Item eventKey="2">Another action</Dropdown.Item>
                <Dropdown.Item eventKey="3">Something else here</Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
    );

    return (
        <Card className="h-100">
            <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                    <h4 className="mb-0">Payments Status</h4>
                    <ActionMenu />
                </div>
                <div className="mb-8" style={{ width: '350px', height: '320px', margin: 'auto' }}>
                    <Chart options={paymentOptions} series={paymentSeries} type="radialBar" width="100%" height="100%" />
                </div>
                <div className="d-flex align-items-center justify-content-around">
                    <div className="text-center">
                        <i className="fe fe-check-circle text-success fs-3"></i>
                        <h1 className="mt-3 mb-1 fw-bold">70%</h1>
                        <p>Paid</p>
                    </div>
                    <div className="text-center">
                        <i className="fe fe-trending-up text-warning fs-3"></i>
                        <h1 className="mt-3 mb-1 fw-bold">20%</h1>
                        <p>Pending</p>
                    </div>
                    <div className="text-center">
                        <i className="fe fe-trending-down text-danger fs-3"></i>
                        <h1 className="mt-3 mb-1 fw-bold">10%</h1>
                        <p>Overdue</p>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default PaymentsChart;