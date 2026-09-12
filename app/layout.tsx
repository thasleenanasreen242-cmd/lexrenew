import './globals.css';
import type { Metadata } from 'next';
export const metadata:Metadata={title:'LexRenew | Legal & Compliance Renewal Management',description:'Track contracts, licences, insurance, leases, AMCs and certificates before they expire.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}