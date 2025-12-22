export default function SignInLayout({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f7fa",
        padding: 0,
        margin: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(31,38,135,0.09)",
          width: "100%",
          maxWidth: "420px",
          padding: "32px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
