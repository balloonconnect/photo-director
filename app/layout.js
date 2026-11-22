import './globals.css';

export const metadata = {
  title: 'Photo Director',
  description: 'Upload a reference photo and your location. Get a step-by-step shooting plan for your own gear.',
  applicationName: 'Photo Director',
};
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#141312', colorScheme: 'dark' };

export default function RootLayout({ children }) {
  return (<html lang="en"><body>{children}</body></html>);
}
