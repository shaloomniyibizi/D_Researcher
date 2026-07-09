import Link from "next/link"

const footerLinks = [
  { href: "#features", label: "Features" },
  { href: "#roles", label: "Roles" },
  { href: "#showcase", label: "Showcase" },
  { href: "/sign-in", label: "Sign in" },
  { href: "/sign-up", label: "Sign up" },
]

export function LandingFooter() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-base font-medium text-foreground">
            Researcher
          </p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            A cloud-native platform for managing the full research lifecycle
            at universities.
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Researcher. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
