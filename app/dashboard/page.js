'use client';

import React, { Fragment, useEffect, useState } from "react";
import { Container, Col, Row, Card } from "react-bootstrap";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

// icons
import { FiUser, FiAward, FiCalendar, FiCreditCard } from "react-icons/fi";

/**
 * Restricted UUID
 */
const RESTRICTED_UUID = "415ed8d0-547d-4c84-8f82-495e59dc834a";

/* ---------------------------
   LocalStatCard
--------------------------- */
function LocalStatCard({ info }) {
  const ICON_MAP = {
    user: FiUser,
    award: FiAward,
    calendar: FiCalendar,
    "credit-card": FiCreditCard,
  };
  const Icon = ICON_MAP[info.icon];

  return (
    <div style={{ position: "relative", height: 120 }}>
      <Card className="shadow-sm">
        <Card.Body>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{info.title}</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{info.value}</div>
          <div style={{ fontSize: 12, color: "#777" }}>{info.subtitle}</div>
        </Card.Body>
      </Card>
      <div style={{ position: "absolute", right: 12, top: 10 }}>
        <Icon size={18} />
      </div>
    </div>
  );
}

/* ---------------------------
   Dashboard Page
--------------------------- */
export default function DashboardPage() {
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState([]);
  const [isRestrictedMode, setIsRestrictedMode] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      if (!localStorage.getItem("isAuthenticated")) {
        router.replace("/Authentication/sign-in");
        return;
      }

      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      /* PROFILE */
      const { data: profileData } = await supabase
        .from("profiles")
        .select("branch_name, email")
        .eq("id", user.id)
        .maybeSingle();

      setProfile(profileData);

      const isRestricted = user.id === RESTRICTED_UUID;
      setIsRestrictedMode(isRestricted);

      /* COUNTS */
      const students = await supabase.from("student_list").select("id", { count: "exact" });
      const coaches = await supabase.from("coaches").select("id", { count: "exact" });
      const classes = await supabase.from("classlist").select("id", { count: "exact" });
      const orders = await supabase.from("orders").select("id", { count: "exact" }).eq("status", "Paid");

      /* ================= TOTAL FEES FROM PAYMENTS ================= */
      let totalFees = 0;

      const { data: payments } = await supabase
        .from("payments")
        .select("method, paid_amount, amount, status");

      (payments || []).forEach(p => {
        if (String(p.status).toLowerCase() === "paid") {
          if (String(p.method).toLowerCase() === "manual") {
            totalFees += Number(p.paid_amount || 0);
          } else {
            totalFees += Number(p.amount || 0);
          }
        }
      });

      /* STATS */
      setStats([
        {
          id: "students",
          title: "Students",
          value: students.count || 0,
          subtitle: "Registered",
          icon: "user",
        },
        {
          id: "coaches",
          title: "Coaches",
          value: coaches.count || 0,
          subtitle: "Active",
          icon: "award",
        },
        {
          id: "classes",
          title: "Classes",
          value: classes.count || 0,
          subtitle: "Scheduled",
          icon: "calendar",
        },
        {
          id: "fees",
          title: "Total Fees",
          value: `₹ ${totalFees}`,
          subtitle: "Collected",
          icon: "credit-card",
        },
        {
          id: "orders",
          title: "Orders",
          value: orders.count || 0,
          subtitle: "Paid",
          icon: "credit-card",
        },
      ]);
    }

    loadDashboard();
  }, [router]);

  return (
    <Fragment>
      <div className="bg-primary p-4 text-white">
        <h3>Welcome to Your Dashboard</h3>
      </div>

      <Container fluid className="mt-4">
        <Row>
          {stats.map(s => (
            <Col xl={3} lg={6} md={12} key={s.id} className="mb-4">
              <LocalStatCard info={s} />
            </Col>
          ))}
        </Row>
      </Container>
    </Fragment>
  );
}
