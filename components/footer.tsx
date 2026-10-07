"use client"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto no-print">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            © {currentYear} Biocure Health Care. All rights reserved.
          </div>

          {/* Professional Attribution - Clean and Prominent */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Designed & Developed by</span>
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 border border-border rounded-full">
              <span className="font-semibold text-foreground text-sm sm:text-base tracking-wide">
                UZAIR AI STUDIO
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
