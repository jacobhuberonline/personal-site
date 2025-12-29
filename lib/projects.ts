export type Project = {
  name: string;
  description: string;
  tech: string[];
  url?: string;
};

export const projects: Project[] = [
  {
    name: "LapQuest",
    description:
      "Hardware lap timer dashboard with a race screen, live stats, and run history. Built to pair with a Pico over Web Serial and save results to Supabase.",
    tech: ["Next.js", "TypeScript", "Supabase", "Web Serial"],
    url: "/lapquest",
  },
  {
    name: "Vest First Responder",
    description:
      "A dedicated information and contact site for the VEST First Responder training program, providing curriculum details, program structure, and an easy way for EMS, fire, and healthcare teams to request training.",
    tech: ["Next.js", "Supabase", "Bunny.net"],
    url: "https://www.vestfirstresponder.com",
  },
  {
    name: "Address Validator",
    description:
      "Audit and clean healthcare address data using external verification services and repeatable import/export workflows. Focused on catching bad data before it hits downstream systems.",
    tech: [".NET", "C#", "SQL"],
  },
  {
    name: "Family Schedule (Francis)",
    description:
      "Live, shareable daily schedule for Francis with feeding, wake-window, and nap blocks that adjust as he grows—built so caregivers can always see what’s happening now and what’s next.",
    tech: ["Next.js", "TypeScript", "Tailwind CSS"],
    url: "/family/schedule",
  },
  {
    name: "Personal Site & Blog",
    description:
      "This site: a place to document projects, write about healthcare integrations, and experiment with modern web tooling, MDX content, and simple publishing workflows.",
    tech: ["Next.js", "MDX", "Vercel"],
    url: "https://github.com/jacobhuberonline/personal-site",
  },
];
