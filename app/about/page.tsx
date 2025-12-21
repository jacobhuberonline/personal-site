import Image from "next/image";

export default function AboutPage() {
  return (
    <article className="prose prose-neutral max-w-none dark:prose-invert">
      <div className="not-prose mb-6">
        <div className="inline-flex items-center gap-4 rounded-2xl border border-neutral-200/80 bg-white/80 px-4 py-3 shadow-sm dark:border-neutral-800/70 dark:bg-neutral-900/80">
          <Image
            src="/images/pfp.png"
            alt="Portrait of Jacob Huber"
            width={80}
            height={80}
            className="h-16 w-16 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-neutral-800"
            priority
          />
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Jacob Huber
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Engineer building healthcare integrations and modern web products.
            </p>
          </div>
        </div>
      </div>

      <h1>About</h1>

      <p>
        I&apos;m a software engineer focused on healthcare data integrations, API-driven
        automation, and high-reliability import/export pipelines. Most of my work centers
        around building tools that help clinical and payer systems exchange data cleanly
        and efficiently—custom ETL workflows, staging logic, credentialing data flows,
        and internal automation used across multiple organizations.
      </p>

      <p>
        I work extensively with C#, .NET, SQL, PowerShell, and modern web tooling like
        Next.js and TypeScript. I enjoy taking messy systems and making them predictable:
        validating data, tightening workflows, improving interfaces, and finding ways to
        automate the parts teams struggle with the most.
      </p>

      <p>
        Outside of my core engineering work, most of my side projects focus on creating
        and running websites, building small tools, and experimenting with ideas that
        help simplify daily life or explore new technologies.
      </p>

      <p>
        When I&apos;m not coding, I&apos;m usually spending time with my wife and our baby,
        playing games, studying systems and strategy, or experimenting with new
        technology I can integrate into future projects.
      </p>
    </article>
  );
}
