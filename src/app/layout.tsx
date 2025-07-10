import "./globals.css";
import Header from './components/Header'
import MobileNotice from './components/MobileNotice'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50">
        <MobileNotice />
        <div className="sticky top-0 z-50 w-full">
          <Header showNavigation={true} />
        </div>
        {children}
      </body>
    </html>
  );
}
