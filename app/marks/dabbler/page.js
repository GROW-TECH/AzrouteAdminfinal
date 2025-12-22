'use client';

import { useState } from 'react';
import html2canvas from 'html2canvas';

export default function CertificatePage() {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  // FORMAT DATE AS DD/MM/YYYY
  const formatDate = (d) => {
    if (!d) return 'DD/MM/YYYY';
    const dt = new Date(d);
    const day = String(dt.getDate()).padStart(2, '0');
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const year = dt.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const downloadCertificate = async () => {
    const cert = document.getElementById('certificate');
    const canvas = await html2canvas(cert, {
      scale: 2,
      useCORS: true,
    });

    const link = document.createElement('a');
    link.download = 'certificate.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="container-fluid px-4 py-4">

      <h4 className="mb-4">Certificate Generator</h4>

      {/* FORM */}
      <div className="mb-4">
        <div className="mb-2">
          <label className="me-2">Student Name:</label>
          <input
            type="text"
            value={name}
            placeholder="Enter student name"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="me-2">Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={downloadCertificate}>
          Download Certificate
        </button>
      </div>

      {/* CERTIFICATE */}
      <div className="d-flex justify-content-center">
        <div id="certificate" className="certificate">

          {/* CERTIFICATE IMAGE */}
          <img
            src="/images/Dabbler.png"
            alt="Certificate"
            className="cert-bg"
            crossOrigin="anonymous"
          />

          {/* TEXT OVERLAY */}
          <div className="overlay">

            {/* STUDENT NAME */}
            <div className="student-name">
              {name || 'Student Name'}
            </div>

            {/* DATE */}
            <div className="cert-date">
              {formatDate(date)}
            </div>

          </div>
        </div>
      </div>

      {/* STYLES */}
      <style jsx>{`
        .certificate {
          position: relative;
          width: 1000px;
          height: 700px;
        }

        .cert-bg {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .student-name {
          position: absolute;
          top: 360px;        /* ✔ aligned to name line */
          width: 100%;
          text-align: center;
          font-size: 34px;
          font-weight: 700;
          color: #000;
        }

        .cert-date {
          position: absolute;
          top: 450px;        /* ✔ matches your image */
          width: 100%;
           top: 459px;               /* aligned with your image */
  left: 660px;
  right: 220px;
  display: flex;
  justify-content: space-between;
  align-items: center;
          text-align: right;
          font-size: 18px;
          font-weight: 500;
          letter-spacing: 0.5px;
          color: #000;
        }
      `}</style>

    </div>
  );
}
