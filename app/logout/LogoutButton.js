"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("isAuthenticated");
      // Redirect to sign-in page after logout
      router.push("./Authentication/sign-in");
    }
  };

  return (
    <button onClick={handleLogout} className="btn btn-danger" type="button">
      Logout
    </button>
  );
}
