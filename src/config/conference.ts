export const CONFERENCE = {
  organizer: 'JUST POLYMER SOLUTIONS',
  initiative: 'Chem Petchem Education Drive',
  programme: 'Virtual Industry Programme',
  title: 'Automotive Industry: The Materials & Mobility Revolution',
  dates: 'October 31 – November 1, 2026',
  format: 'Virtual',
  tagline: 'Bridging Academics and Industry for a Brighter Tomorrow',
  audience: ['Students', 'Industry Professionals'],
  description: 'A platform where Industry and Students will come together to explore materials, technologies, markets and career opportunities in the automotive value chain.',
  focusAreas: [
    { title: 'Automotive OEMs', description: 'Designing the Future of Mobility' },
    { title: 'Auto Components', description: 'Engineering Excellence' },
    { title: 'Petrochemicals', description: 'Building Blocks for a Sustainable Future' },
    { title: 'Polymers', description: 'Materials that Move the World' },
    { title: 'Specialty Chemicals', description: 'Advanced Solutions for Next-Gen Vehicles' },
    { title: 'Battery & Energy Systems', description: 'Powering the Future of Mobility' },
    { title: 'Sustainability', description: 'Mobility for a Healthier Planet' },
  ],
  careerOpportunities: [
    'Chemical Engineers',
    'Polymer Engineers',
    'Chemists',
    'Materials Scientists',
    'Process Engineers',
    'R&D Scientists',
    'Application Engineers',
    'Quality Engineers',
    'Technical Sales & Marketing',
    'Sustainability Professionals',
    'Consultants',
  ],
} as const;

export const REGISTRATION_PRICING = {
  student: {
    baseFeePaise: 99900,
    gstRate: 18,
    gstAmountPaise: 18000,
    totalAmountPaise: 117900,
  },
  industry_professional: {
    baseFeePaise: 199900,
    gstRate: 18,
    gstAmountPaise: 36000,
    totalAmountPaise: 235900,
  },
} as const;

export type NewRegistrationType = keyof typeof REGISTRATION_PRICING;

