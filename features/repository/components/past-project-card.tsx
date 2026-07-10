import { ExternalLink, FileText } from "lucide-react"
import Image from "next/image"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const PROJECT_PLACEHOLDER = "/images/project1.png"

export type PastProjectCardProps = {
  title: string
  abstract: string | null
  authors: string[]
  year: number | null
  publishedAt?: Date | null
  institutionName: string
  departmentName: string | null
  technologies: string[]
  supervisorName: string | null
  destination: string | null
  imageUrl?: string | null
  className?: string
}

function formatPublishedDate(date: Date | null | undefined, year: number | null): string {
  if (date) {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  return year ? String(year) : "Date unavailable"
}

export function PastProjectCard({
  title,
  abstract,
  authors,
  year,
  publishedAt,
  institutionName,
  departmentName,
  technologies,
  supervisorName,
  destination,
  imageUrl,
  className,
}: PastProjectCardProps) {
  const imageSource = imageUrl || PROJECT_PLACEHOLDER
  const author = authors[0] ?? "Unknown author"
  const affiliation = departmentName
    ? `At ${institutionName} in ${departmentName}`
    : `At ${institutionName}`

  return (
    <Card
      className={cn(
        "group overflow-hidden rounded-xl py-0 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-[1.95/1] overflow-hidden bg-muted">
        <Image
          src={imageSource}
          alt={`${title} project cover`}
          fill
          sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>

      <div className="flex flex-1 flex-col">
        <div className="space-y-5 px-6 py-6">
          <div>
            <h3 className="font-heading text-base font-semibold leading-snug text-card-foreground">
              {destination ? (
                <a
                  href={destination}
                  target="_blank"
                  rel="noreferrer"
                  className="outline-none transition-colors hover:text-primary focus-visible:text-primary"
                >
                  {title}
                </a>
              ) : (
                title
              )}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {affiliation}
            </p>
          </div>

          <p className="line-clamp-4 min-h-20 text-sm leading-7 text-card-foreground/85">
            {abstract ?? "No project description is available for this repository record."}
          </p>

          {supervisorName ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="size-3.5 shrink-0" />
              <span className="truncate">Supervised by {supervisorName}</span>
            </p>
          ) : null}

          {technologies.length > 0 ? (
            <div className="flex flex-wrap gap-1.5" aria-label="Project technologies">
              {technologies.slice(0, 4).map((technology) => (
                <span
                  key={technology}
                  className="rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground"
                >
                  {technology}
                </span>
              ))}
              {technologies.length > 4 ? (
                <span className="rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                  +{technologies.length - 4}
                </span>
              ) : null}
            </div>
          ) : null}

          {destination ? (
            <a
              href={destination}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-primary outline-none hover:underline focus-visible:underline"
            >
              View project <ExternalLink className="size-3.5" />
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">Project file unavailable</span>
          )}
        </div>

        <footer className="mt-auto flex items-center justify-between gap-4 border-t px-6 py-4 text-xs text-muted-foreground">
          <span className="truncate">By {author}</span>
          <time className="shrink-0" dateTime={publishedAt?.toISOString()}>
            {formatPublishedDate(publishedAt, year)}
          </time>
        </footer>
      </div>
    </Card>
  )
}
