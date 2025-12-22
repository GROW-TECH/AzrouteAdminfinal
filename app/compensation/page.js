"use client";

import { useEffect, useState } from "react";
import { Table, Row, Col, Card } from "react-bootstrap";

export default function CompensationPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch("/api/compensation")
      .then((res) => res.json())
      .then((json) => setRows(json.data || []));
  }, []);

  return (
    <div className="page-wrap">
      <div className="container mt-4 content-card">

        {/* HEADER */}
        <div className="d-flex align-items-center mb-3">
          <h2 className="me-auto page-title">Compensation Classes</h2>
        </div>

        {/* TABLE */}
        <Table bordered hover responsive>
          <thead>
            <tr>
              <th>Coach</th>
              <th>Student</th>
              <th>Reg No</th>
              <th>Missed Date</th>
              <th>Compensation Date</th>
              <th>Batch</th>
              <th>GMeet Link</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  No compensation records found
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.coaches?.name || "-"}</td>
                  <td>{r.student_list?.name || "-"}</td>
                  <td>{r.student_list?.reg_no || "-"}</td>
                  <td>{r.original_date}</td>
                  <td>{r.compensation_date}</td>
                  <td>{r.batch_time}</td>
                  <td>
                    {r.note ? (
                      <a
                        href={r.note}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary"
                      >
                        Open Link
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* STYLES – SAME FEEL AS PRODUCT PAGE */}
      <style jsx>{`
        .page-wrap {
          background: #f3f6f9;
          padding: 12px 18px;
        }
        .content-card {
          background: white;
          border-radius: 6px;
          padding: 22px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .page-title {
          font-weight: 600;
        }
        a {
          text-decoration: none;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
