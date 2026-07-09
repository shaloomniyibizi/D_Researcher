import Image from "next/image"

const projects = [
  { src: "/images/project2.jpg", alt: "Literature review workspace" },
  { src: "/images/project3.jpg", alt: "Collaborative editing session" },
  { src: "/images/project4.jpg", alt: "Research methodology planning" },
  { src: "/images/project5.jpg", alt: "Supervisor feedback interface" },
  { src: "/images/project6.jpg", alt: "Project milestone tracker" },
  { src: "/images/project7.png", alt: "Knowledge base search" },
  { src: "/images/project8.png", alt: "Analytics dashboard" },
  { src: "/images/project1.png", alt: "Research project overview" },
]

export function ShowcaseSection() {
  return (
    <section id="showcase" className="border-b py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">
            Showcase
          </p>
          <h2 className="font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Research in action
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            See how teams use Researcher to stay focused, collaborate
            effectively, and deliver high-quality academic work.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {projects.map((project) => (
            <div
              key={project.src}
              className="group relative aspect-square overflow-hidden ring-1 ring-foreground/10 transition-shadow hover:ring-foreground/20"
            >
              <Image
                src={project.src}
                alt={project.alt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
