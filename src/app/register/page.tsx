import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BriefcaseBusiness, GraduationCap } from 'lucide-react';
import { CONFERENCE, REGISTRATION_PRICING } from '@/config/conference';

const formatRupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

export default function RegisterPage() {
  const options = [
    {
      type: 'student' as const,
      title: 'Student',
      description: 'For students currently enrolled in academic programs.',
      document: 'Student ID card required',
      href: '/register/student',
      icon: GraduationCap,
    },
    {
      type: 'industry_professional' as const,
      title: 'Industry Professional',
      description: 'For professionals working across the automotive value chain.',
      document: 'Professional identity or employment document required',
      href: '/register/industry',
      icon: BriefcaseBusiness,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f4f5f2] text-[#14221e]">
      <nav className="border-b border-[#14221e]/15 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-semibold tracking-wide">{CONFERENCE.organizer}</Link>
          <Link href="/" aria-label="Back to conference home">
            <Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Home</Button>
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#47735d]">{CONFERENCE.initiative}</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">Choose your registration category</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[#42534d]">
          {CONFERENCE.title} <span className="font-medium">· {CONFERENCE.dates} · Virtual</span>
        </p>

        <div className="mt-9 grid gap-5 md:grid-cols-2">
          {options.map(({ type, title, description, document, href, icon: Icon }) => {
            const pricing = REGISTRATION_PRICING[type];
            return (
              <Card key={type} className="rounded-md border-[#14221e]/20 bg-white shadow-none">
                <CardHeader>
                  <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-md bg-[#e7eee8] text-[#27543f]"><Icon className="h-5 w-5" /></div>
                  <CardTitle className="text-xl">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between gap-4 border-t border-[#14221e]/10 pt-4 text-sm"><span>Base fee</span><span className="font-medium">{formatRupees(pricing.baseFeePaise)}</span></div>
                  <div className="flex justify-between gap-4 text-sm"><span>GST ({pricing.gstRate}%)</span><span className="font-medium">{formatRupees(pricing.gstAmountPaise)}</span></div>
                  <div className="flex justify-between gap-4 border-t border-[#14221e]/15 pt-3"><span className="font-semibold">Total payable</span><span className="text-lg font-semibold">{formatRupees(pricing.totalAmountPaise)}</span></div>
                  <p className="pt-1 text-sm text-[#53635c]">{document}. Uploads are reviewed separately from payment.</p>
                  <Link href={href} className="block pt-2"><Button className="w-full">Register as {title}</Button></Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="mt-7 max-w-4xl text-xs leading-relaxed text-[#586761]">
          GST rate and totals are displayed as configured by the organizer. Please confirm applicable tax treatment with the organizer’s accountant.
        </p>
      </section>
    </main>
  );
}
