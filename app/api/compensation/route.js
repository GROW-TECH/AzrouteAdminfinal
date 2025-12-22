import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    /* 1️⃣ Get compensation classes */
    const { data: comps, error: compErr } = await supabase
      .from("compensation_classes")
      .select("*")
      .order("created_at", { ascending: false });

    if (compErr) throw compErr;
    if (!comps || comps.length === 0) {
      return NextResponse.json({ data: [] });
    }

    /* 2️⃣ Collect IDs */
    const studentIds = [...new Set(comps.map(c => c.student_id))];
    const coachIds = [...new Set(comps.map(c => c.coach_id))];

    /* 3️⃣ Fetch students */
    const { data: students, error: stuErr } = await supabase
      .from("student_list")
      .select("id, name, reg_no")
      .in("id", studentIds);

    if (stuErr) throw stuErr;

    /* 4️⃣ Fetch coaches */
    const { data: coaches, error: coachErr } = await supabase
      .from("coaches")
      .select("id, name")
      .in("id", coachIds);

    if (coachErr) throw coachErr;

    /* 5️⃣ Build lookup maps */
    const studentMap = {};
    students?.forEach(s => {
      studentMap[s.id] = s;
    });

    const coachMap = {};
    coaches?.forEach(c => {
      coachMap[c.id] = c;
    });

    /* 6️⃣ Merge data */
    const result = comps.map(c => ({
      id: c.id,
      original_date: c.original_date,
      compensation_date: c.compensation_date,
      batch_time: c.batch_time,
      note: c.note,
      student_list: studentMap[c.student_id] || null,
      coaches: coachMap[c.coach_id] || null,
    }));

    return NextResponse.json({ data: result });
  } catch (e) {
    console.error("compensation admin error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
