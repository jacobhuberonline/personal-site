export type Project = {
  name: string;
  description: string;
  tech: string[];
  url?: string;
};

export const projects: Project[] = [
  {
    name: "KRH Design Co.",
    description:
      "Interior design and styling website for a St. Louis brand, with service pages, portfolio previews, journal content, curated shopping links, and a clear consultation inquiry path.",
    tech: ["Next.js", "TypeScript", "Vercel"],
    url: "https://www.krhdesignco.com",
  },
  {
    name: "Vest First Responder",
    description:
      "A dedicated information and contact site for the VEST First Responder training program, providing curriculum details, program structure, and an easy way for EMS, fire, and healthcare teams to request training.",
    tech: ["Next.js", "Supabase", "Bunny.net"],
    url: "https://www.vestfirstresponder.com",
  },
  {
    name: "Vest First Responder Reviews",
    description:
      "Public review hub for VEST post-class evaluation feedback, including aggregate statistics, recent testimonials, common training themes, FAQs, and a review submission flow.",
    tech: ["Next.js", "TypeScript", "Vercel"],
    url: "https://reviews.vestfirstresponder.com",
  },
  {
    name: "First Responder Violence",
    description:
      "Secure incident reporting portal for first responders to document workplace violence after a call, find support resources, and help agencies identify safety patterns.",
    tech: ["Next.js", "TypeScript", "Vercel"],
    url: "https://www.firstresponderviolence.com",
  },
  {
    name: "St. Andrew's Episcopal Church (Unofficial)",
    description:
      "Unofficial parish website prototype for St. Andrew's Episcopal Church in Edwardsville, with worship details, visit planning, sermons, events, ministry pages, and giving information.",
    tech: ["Next.js", "Tailwind CSS", "Vercel"],
    url: "https://st-andrews-church-nu.vercel.app",
  },
  {
    name: "Off-Duty Studio",
    description:
      "St. Louis real estate drone photo and video website with portfolio sections, service positioning, booking links, social-ready media messaging, and search-focused content.",
    tech: ["Next.js", "TypeScript", "Vercel"],
    url: "https://www.offdutystudiostl.com",
  },
  {
    name: "Legends Photography",
    description:
      "Florida real estate media website for listing photography, drone coverage, floor plans, and walkthrough video, with service, pricing, coverage, and booking content.",
    tech: ["Next.js", "TypeScript", "Vercel"],
    url: "https://legends-photography.vercel.app",
  },
  {
    name: "LapQuest",
    description:
      "Hardware lap timer dashboard with a race screen, live stats, and run history. Built to pair with a Pico over Web Serial and save results to Supabase.",
    tech: ["Next.js", "TypeScript", "Supabase", "Web Serial"],
    url: "/lapquest",
  },
  {
    name: "Address Validator",
    description:
      "Audit and clean healthcare address data using external verification services and repeatable import/export workflows. Focused on catching bad data before it hits downstream systems.",
    tech: [".NET", "C#", "SQL"],
  },
  {
    name: "Baby Schedule",
    description:
      "Live, shareable daily schedule for the baby with feeding, wake-window, and nap blocks that adjust as they grow—built so caregivers can always see what’s happening now and what’s next.",
    tech: ["Next.js", "TypeScript", "Tailwind CSS"],
    url: "/family/baby",
  },
  {
    name: "Personal Site & Blog",
    description:
      "This site: a place to document projects, write about healthcare integrations, and experiment with modern web tooling, MDX content, and simple publishing workflows.",
    tech: ["Next.js", "MDX", "Vercel"],
    url: "https://github.com/jacobhuberonline/personal-site",
  },
];
