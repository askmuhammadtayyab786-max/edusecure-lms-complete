import { AuthProvider } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import "./globals.css";

export const metadata = {
  title: "EduSecure LMS",
  description: "A security-first Learning Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="container">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
