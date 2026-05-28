import type { Metadata } from "next";
import Image from "next/image";

const phoneNumber = "6362840428";
const formattedPhoneNumber = "(636) 284-0428";

const photos = [
  {
    src: "/images/missing-cat/portrait.jpeg",
    alt: "Missing white and gray tabby cat resting on a blanket",
    width: 360,
    height: 480,
  },
  {
    src: "/images/missing-cat/collar.jpeg",
    alt: "Missing white and gray tabby cat sitting indoors",
    width: 360,
    height: 480,
  },
  {
    src: "/images/missing-cat/couch.jpeg",
    alt: "Missing white and gray tabby cat lying on a couch",
    width: 1536,
    height: 2048,
  },
] as const;

export const metadata: Metadata = {
  title: "Missing Cat",
  description:
    "Please call or text if you have seen this kind but skittish white and gray tabby cat.",
  openGraph: {
    title: "Missing Cat",
    description:
      "Please call or text if you have seen this kind but skittish white and gray tabby cat.",
    images: [
      {
        url: "/images/missing-cat/couch.jpeg",
        width: 1536,
        height: 2048,
        alt: "Missing white and gray tabby cat lying on a couch",
      },
    ],
  },
};

export default function MissingCatPage() {
  return (
    <article className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <section className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight text-neutral-950 sm:text-6xl dark:text-neutral-50">
              Missing Cat
            </h1>
            <p className="max-w-2xl text-xl leading-8 text-neutral-700 dark:text-neutral-200">
              Our cat is missing, and we are very worried about him. He is kind
              but skittish. If you have seen him, even briefly, any information
              would mean a lot.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={`tel:+1${phoneNumber}`}
              className="inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-950"
            >
              Call {formattedPhoneNumber}
            </a>
            <a
              href={`sms:+1${phoneNumber}`}
              className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-5 py-3 text-base font-bold text-neutral-950 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:focus:ring-offset-neutral-950"
            >
              Text {formattedPhoneNumber}
            </a>
          </div>

          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-base leading-7 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
            If you spot him, please do not chase him. A photo, location, and
            time would help us get to him safely.
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <Image
            src="/images/missing-cat/couch.jpeg"
            alt="Missing white and gray tabby cat lying on a couch"
            width={1536}
            height={2048}
            className="h-full max-h-[680px] w-full object-cover"
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-2xl font-bold text-neutral-950 dark:text-neutral-50">
            What he looks like
          </h2>
          <ul className="mt-4 space-y-3 text-base leading-7 text-neutral-700 dark:text-neutral-200">
            <li>White face, chest, belly, and legs.</li>
            <li>Gray tabby markings on his head, back, and tail.</li>
            <li>Pink nose, large ears, and a long dark striped tail.</li>
            <li>Sweet and kind, but easily scared when outside.</li>
          </ul>
          <p className="mt-5 text-base leading-7 text-neutral-700 dark:text-neutral-200">
            Please check porches, garages, sheds, under decks, and quiet hiding
            spots nearby. Thank you for keeping an eye out for him.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {photos.map((photo) => (
            <div
              key={photo.src}
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                className="aspect-[3/4] h-full w-full object-cover"
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 100vw"
              />
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
