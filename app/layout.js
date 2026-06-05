export const metadata = {
  title: 'S&P 500 בשקלים',
  description: 'תשואת S&P 500 מתואמת לשקל',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: { capable: true, title: 'S&P ₪', statusBarStyle: 'black-translucent' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
