import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="py-20 bg-muted/30 lg:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center gap-6 border bg-muted/90 px-8 py-16 text-center ring-1 ring-foreground/10 sm:px-16">
          <h2 className="max-w-xl font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Ready to transform your research workflow?
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Join students and supervisors who use Researcher to stay organized,
            get better feedback, and produce stronger academic work.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">
                Create your account
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
