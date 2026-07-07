import Link from "next/link";
import { Layers3 } from "lucide-react";

const LINKS = {
  Product: ["Features", "Pricing", "Examples", "Changelog"],
  Developers: ["Documentation", "API Reference", "GitHub", "Status"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy", "Terms", "Cookies"],
};

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-md brand-gradient flex items-center justify-center">
                <Layers3 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">ARweave</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Browser-based WebAR for everyone. No app, no code.
            </p>
          </div>

          {/* Link groups */}
          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{group}</p>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} ARweave. Open source under MIT.
          </p>
          <p className="text-xs text-muted-foreground">
            Built by{" "}
            <a href="https://github.com/Varshithvhegde" className="hover:text-foreground underline underline-offset-2 transition-colors">
              Varshith V Hegde
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
