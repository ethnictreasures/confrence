import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  MonitorPlay,
  UsersRound,
} from 'lucide-react';
import { CONFERENCE, REGISTRATION_PRICING } from '@/config/conference';

export const metadata: Metadata = {
  title: 'Automotive Industry: The Materials & Mobility Revolution | JUST POLYMER SOLUTIONS',
  description: 'Join the virtual industry programme on October 31 – November 1, 2026, bringing students and industry professionals together to explore the automotive materials and mobility value chain.',
};

const formatRupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f7f3] text-[#171916] [font-family:var(--font-geist-sans),sans-serif]">
      <style>{`
        @keyframes page-arrive {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .page-arrive { animation: page-arrive 650ms cubic-bezier(.2,.7,.2,1) both; }
        .page-arrive-late { animation-delay: 120ms; }
        .page-arrive-last { animation-delay: 220ms; }
        @media (prefers-reduced-motion: reduce) {
          .page-arrive, .page-arrive-late, .page-arrive-last { animation: none; }
          html { scroll-behavior: auto; }
        }
      `}</style>

      {/* <header className="border-b border-[#d4d7cf] bg-[#f7f7f3]">
        <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <Link href="#top" className="group flex min-w-0 items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a84e2b]">
            <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center border border-[#171916] text-[11px] font-black leading-none tracking-[0.08em]">
              JPS
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[11px] font-bold uppercase tracking-[0.11em] sm:text-xs">JUST POLYMER SOLUTIONS</span>
              <span className="mt-0.5 block text-[10px] text-[#646960] sm:text-[11px]">Chem Petchem Education Drive</span>
            </span>
          </Link>
          <Link href="/admin/login" className="inline-flex min-h-10 items-center gap-1.5 border-b border-transparent px-2 text-xs font-semibold text-[#4b5149] transition-colors hover:border-[#a84e2b] hover:text-[#171916] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a84e2b]">
            Admin <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </header> */}

      <main id="top">
        {/* <section aria-labelledby="branding-heading" className="border-b border-[#d4d7cf] bg-[#e8eef5]">
          <h2 id="branding-heading" className="sr-only">JUST POLYMER SOLUTIONS Chem Petchem Education Drive branding</h2>
          <Image
            src="/img19.jpg"
            alt="JUST POLYMER SOLUTIONS Chem Petchem Education Drive, connecting industry and academia"
            width={1600}
            height={900}
            priority
            className="mx-auto h-auto w-full max-h-[min(56vh,560px)] object-contain object-center"
          />
        </section> */}

        
        <section
          aria-labelledby="conference-title"
          className="relative isolate overflow-hidden border-b border-[#d4d7cf] bg-[#171916] text-[#f7f7f3]"
        >
          {/* Background photograph */}
          <Image
            src="/img19.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="pointer-events-none -z-20 object-cover object-center"
          />

          {/* Dark overlay for text readability */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#111410]/95 via-[#171916]/80 to-[#171916]/55"
          />

          {/* Subtle grid texture */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.10]"
            style={{
              backgroundImage:
                'linear-gradient(to right, #f7f7f3 1px, transparent 1px), linear-gradient(to bottom, #f7f7f3 1px, transparent 1px)',
              backgroundSize: '72px 72px',
            }}
          />

          <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:px-12 lg:pb-20 lg:pt-20">
            {/* Full-width title allows the heading to use two lines */}
            <div className="page-arrive">
              <p className="mb-7 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4db62] sm:text-xs">
                <span className="h-px w-8 bg-[#d4db62]" />
                Virtual Industry Programme
              </p>

              <h1
                id="conference-title"
                className="max-w-none text-[clamp(2rem,5.1vw,4.8rem)] font-semibold leading-[1.02] tracking-[-0.055em]"
              >
                <span className="block">
                  Automotive Industry: The Materials
                </span>

                <span className="mt-1 block text-[#d4db62]">
                  &amp; Mobility Revolution
                  <span className="text-[#c46a44]">.</span>
                </span>
              </h1>
            </div>

            {/* Supporting content and event details */}
            <div className="mt-10 grid gap-10 sm:mt-12 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
              <div className="page-arrive page-arrive-late">
                <p className="max-w-xl border-l-2 border-[#c46a44] pl-4 text-sm leading-6 text-[#d4d7cf] sm:text-base sm:leading-7">
                  {CONFERENCE.tagline}
                </p>

                <p className="mt-6 max-w-lg text-sm leading-6 text-[#c0c4bb]">
                  {CONFERENCE.description}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href="#registration"
                    className="inline-flex min-h-12 items-center gap-3 bg-[#d4db62] px-5 text-sm font-bold text-[#171916] transition-colors hover:bg-[#e4eb7b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d4db62]"
                  >
                    Explore registration
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>

                  <a
                    href="#focus-areas"
                    className="inline-flex min-h-12 items-center gap-2 px-4 text-sm font-medium text-[#f7f7f3] transition-colors hover:text-[#d4db62] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4db62]"
                  >
                    Explore the themes
                    <ArrowDown aria-hidden="true" className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <aside
                aria-label="Event date and format"
                className="page-arrive page-arrive-late border-t border-white/30 pt-6 lg:ml-auto lg:w-full lg:max-w-sm lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"
              >
                <div className="flex items-end gap-3">
                  <p className="text-[5.4rem] font-semibold leading-[0.78] tracking-[-0.08em] text-[#d4db62] sm:text-[7rem]">
                    31
                  </p>

                  <div className="pb-1">
                    <p className="text-sm font-bold uppercase tracking-[0.16em]">
                      October
                    </p>
                    <p className="mt-1 text-xs text-[#d4d7cf]">
                      Saturday · 2026
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3 border-y border-white/30 py-3">
                  <span className="text-3xl font-light text-[#c46a44]">
                    /
                  </span>
                  <p className="text-sm font-bold uppercase tracking-[0.16em]">
                    01 NOV 2026
                  </p>
                  <span className="ml-auto text-[10px] uppercase tracking-[0.16em] text-[#d4d7cf]">
                    Sunday
                  </span>
                </div>

                <div className="mt-6 flex items-center gap-3 text-sm">
                  <span className="grid h-9 w-9 place-items-center border border-white/30 text-[#d4db62]">
                    <MonitorPlay aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-semibold">Virtual event</span>
                    <span className="mt-0.5 block text-xs text-[#d4d7cf]">
                      Join online · October 31 – November 1
                    </span>
                  </span>
                </div>
              </aside>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="absolute bottom-0 right-0 h-1.5 w-[36%] bg-[#c46a44]"
          />
        </section>


        <section aria-labelledby="overview-heading" className="border-b border-[#d4d7cf] bg-white">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a84e2b]">Chem Petchem Education Drive</p>
            <h2 id="overview-heading" className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">Industry and students, in the same conversation.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[#555b52]">{CONFERENCE.description}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#30352e]">For Students and Industry Professionals · Virtual · October 31 – November 1, 2026</p>
          </div>
        </section>

        <section aria-labelledby="focus-heading" id="focus-areas" className="scroll-mt-8 border-b border-[#d4d7cf]">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
            <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
              <div className="page-arrive">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a84e2b]">01 / The landscape</p>
                <h2 id="focus-heading" className="mt-4 max-w-sm text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">One industry.<br />Many material futures.</h2>
                <p className="mt-5 max-w-md text-sm leading-6 text-[#555b52]">From vehicle design to energy storage, discover the systems and disciplines reshaping mobility.</p>
              </div>
              <ol className="grid gap-px border border-[#d4d7cf] bg-[#d4d7cf] sm:grid-cols-2">
                {CONFERENCE.focusAreas.map((area, index) => {
                  const number = String(index + 1).padStart(2, '0');
                  const { title, description } = area;
                  return (
                  <li key={title} className="group flex min-h-[132px] gap-4 bg-[#f7f7f3] p-5 transition-colors hover:bg-white sm:p-6">
                    <span className="pt-1 font-mono text-[10px] text-[#a84e2b]">{number}</span>
                    <span>
                      <span className="block text-sm font-bold">{title}</span>
                      <span className="mt-2 block text-xs leading-5 text-[#646960]">{description}</span>
                    </span>
                  </li>
                );
                })}
              </ol>
            </div>
          </div>
        </section>

        <section aria-labelledby="careers-heading" className="border-b border-[#d4d7cf] bg-[#e9ebe3]">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16 lg:px-12">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a84e2b]">02 / People &amp; practice</p>
              <h2 id="careers-heading" className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">Where your work<br />can take you.</h2>
              <p className="mt-5 max-w-md text-sm leading-6 text-[#555b52]">A cross-section of career paths contributing to the automotive materials and mobility value chain.</p>
            </div>
            <ul className="flex flex-wrap content-start gap-x-2 gap-y-2.5" aria-label="Career opportunities">
              {CONFERENCE.careerOpportunities.map((career) => (
                <li key={career} className="border border-[#bdc2b8] bg-[#f7f7f3] px-3 py-2 text-xs font-medium text-[#30352e] sm:text-sm">{career}</li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="registration-heading" id="registration" className="scroll-mt-6 border-b border-[#d4d7cf]">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
            <div className="mb-10 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a84e2b]">03 / Take part</p>
                <h2 id="registration-heading" className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">Choose your registration.</h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-[#555b52]">For students and industry professionals. GST is shown as configured by the organizer.</p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="rounded-none border border-[#c9cdc4] bg-white shadow-none transition-colors hover:border-[#a84e2b]">
                <CardHeader className="border-b border-[#e1e3dd] px-6 pb-5 pt-6 sm:px-8 sm:pt-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="mb-4 grid h-10 w-10 place-items-center bg-[#e9ebe3] text-[#30352e]"><GraduationCap aria-hidden="true" className="h-5 w-5" /></span>
                      <CardTitle className="text-xl font-semibold tracking-[-0.03em]">Student</CardTitle>
                      <CardDescription className="mt-1 text-sm text-[#646960]">For students currently enrolled in an academic programme.</CardDescription>
                    </div>
                    <span className="shrink-0 bg-[#d4db62] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#171916]">Student rate</span>
                  </div>
                </CardHeader>
                <CardContent className="px-6 py-5 sm:px-8">
                  <dl className="space-y-2.5 text-sm">
                    <div className="flex justify-between gap-4 text-[#555b52]"><dt>Base price</dt><dd className="font-medium text-[#171916]">{formatRupees(REGISTRATION_PRICING.student.baseFeePaise)}</dd></div>
                    <div className="flex justify-between gap-4 text-[#555b52]"><dt>GST ({REGISTRATION_PRICING.student.gstRate}%)</dt><dd className="font-medium text-[#171916]">{formatRupees(REGISTRATION_PRICING.student.gstAmountPaise)}</dd></div>
                    <div className="mt-4 flex items-end justify-between gap-4 border-t border-[#d4d7cf] pt-4"><dt className="text-xs font-bold uppercase tracking-[0.1em]">Total</dt><dd className="text-3xl font-semibold tracking-[-0.05em]">{formatRupees(REGISTRATION_PRICING.student.totalAmountPaise)}</dd></div>
                  </dl>
                  <div className="mt-6 border-l-2 border-[#d4db62] pl-3 text-xs leading-5 text-[#555b52]"><span className="font-semibold text-[#171916]">Document:</span> Upload a valid student ID for review.</div>
                  <Link href="/register/student" className="mt-6 inline-flex min-h-12 w-full items-center justify-between bg-[#171916] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#343a32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a84e2b]">
                    Register as a student <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>

              <Card className="rounded-none border border-[#c9cdc4] bg-white shadow-none transition-colors hover:border-[#a84e2b]">
                <CardHeader className="border-b border-[#e1e3dd] px-6 pb-5 pt-6 sm:px-8 sm:pt-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="mb-4 grid h-10 w-10 place-items-center bg-[#f2e7df] text-[#a84e2b]"><UsersRound aria-hidden="true" className="h-5 w-5" /></span>
                      <CardTitle className="text-xl font-semibold tracking-[-0.03em]">Industry Professional</CardTitle>
                      <CardDescription className="mt-1 text-sm text-[#646960]">For working professionals across the automotive value chain.</CardDescription>
                    </div>
                    <span className="shrink-0 border border-[#bdc2b8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#4b5149]">Industry</span>
                  </div>
                </CardHeader>
                <CardContent className="px-6 py-5 sm:px-8">
                  <dl className="space-y-2.5 text-sm">
                    <div className="flex justify-between gap-4 text-[#555b52]"><dt>Base price</dt><dd className="font-medium text-[#171916]">{formatRupees(REGISTRATION_PRICING.industry_professional.baseFeePaise)}</dd></div>
                    <div className="flex justify-between gap-4 text-[#555b52]"><dt>GST ({REGISTRATION_PRICING.industry_professional.gstRate}%)</dt><dd className="font-medium text-[#171916]">{formatRupees(REGISTRATION_PRICING.industry_professional.gstAmountPaise)}</dd></div>
                    <div className="mt-4 flex items-end justify-between gap-4 border-t border-[#d4d7cf] pt-4"><dt className="text-xs font-bold uppercase tracking-[0.1em]">Total</dt><dd className="text-3xl font-semibold tracking-[-0.05em]">{formatRupees(REGISTRATION_PRICING.industry_professional.totalAmountPaise)}</dd></div>
                  </dl>
                  <div className="mt-6 border-l-2 border-[#c46a44] pl-3 text-xs leading-5 text-[#555b52]"><span className="font-semibold text-[#171916]">Document:</span> Upload proof of employment or professional identity for review.</div>
                  <Link href="/register/industry" className="mt-6 inline-flex min-h-12 w-full items-center justify-between bg-[#171916] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#343a32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a84e2b]">
                    Register as an industry professional <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            </div>

            <p className="mt-4 text-[11px] leading-5 text-[#646960]">GST rate and amounts are displayed as configured by the organizer; this is not tax advice.</p>
          </div>
        </section>

        <section aria-labelledby="process-heading" className="bg-[#171916] text-[#f7f7f3]">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16 lg:px-12">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4db62]">04 / What happens next</p>
              <h2 id="process-heading" className="mt-4 max-w-sm text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">A clear path<br />to confirmation.</h2>
            </div>
            <ol className="divide-y divide-[#555a51]">
              <li className="flex gap-4 py-4 first:pt-0">
                <span className="grid h-9 w-9 shrink-0 place-items-center border border-[#555a51] text-[#d4db62]"><ClipboardCheck aria-hidden="true" className="h-4 w-4" /></span>
                <span><span className="block text-sm font-semibold">Complete registration</span><span className="mt-1 block text-xs leading-5 text-[#aeb3a9]">Choose your category and submit the registration form with the required ID document.</span></span>
                <span className="ml-auto pt-1 font-mono text-[10px] text-[#aeb3a9]">01</span>
              </li>
              <li className="flex gap-4 py-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center border border-[#555a51] text-[#d4db62]"><CreditCard aria-hidden="true" className="h-4 w-4" /></span>
                <span><span className="block text-sm font-semibold">Pay the published fee</span><span className="mt-1 block text-xs leading-5 text-[#aeb3a9]">Your registration is saved first. Proceed to the category’s specific Razorpay Payment Channel for the displayed GST-inclusive total. Document review is separate from payment status.</span></span>
                <span className="ml-auto pt-1 font-mono text-[10px] text-[#aeb3a9]">02</span>
              </li>
              <li className="flex gap-4 py-4 last:pb-0">
                <span className="grid h-9 w-9 shrink-0 place-items-center border border-[#555a51] text-[#d4db62]"><Check aria-hidden="true" className="h-4 w-4" /></span>
                <span><span className="block text-sm font-semibold">Wait for confirmation</span><span className="mt-1 block text-xs leading-5 text-[#aeb3a9]">It Usually Takes 2-3 Hours for the registration to be confirmed.</span></span>
                <span className="ml-auto pt-1 font-mono text-[10px] text-[#aeb3a9]">03</span>
              </li>
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#d4d7cf] bg-[#f7f7f3]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <div>
            {/* <p className="text-xs font-bold uppercase tracking-[0.12em]">JUST POLYMER SOLUTIONS</p> */}
            <p className="mt-1 text-[11px] text-[#646960]">Chem Petchem Education Drive · Virtual Industry Programme</p>
          </div>
          <p className="flex items-center gap-2 text-xs text-[#555b52]"><CalendarDays aria-hidden="true" className="h-4 w-4 text-[#a84e2b]" /> October 31 – November 1, 2026</p>
          <Link href="#top" className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-[#30352e] hover:text-[#a84e2b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a84e2b]">Back to top <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
        </div>
      </footer>
    </div>
  );
}
