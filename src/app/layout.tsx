import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ELAM — Leave & Attendance',
    template: '%s · ELAM',
  },
  description: 'Employee Leave and Attendance Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas">{children}</body>
    </html>
  );
}
