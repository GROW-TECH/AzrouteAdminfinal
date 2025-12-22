// app/layout.js
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children} {/* This is where the nested pages will render */}
      </body>
    </html>
  );
}
