/**
 * Criminology demo — main frame (shown on the big screen).
 * Two QR codes: Immersive (ThingLink Room 1) and Reading (Book Creator page 1).
 */
export const metadata = { title: "Techembrace — Learning your way", robots: { index: false, follow: false } };

export default function DemoMainFrame() {
  return (
    <div className="min-h-screen bg-[#FAFAEE] text-[#2D2730]" style={{ fontFamily: "Verdana, 'Open Sans', sans-serif" }}>
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-widest font-bold" style={{ color: "#3758A7" }}>Techembrace</p>
          <h1 className="text-3xl md:text-4xl font-bold">Pick the way you like to learn</h1>
          <p className="text-lg text-[#2D2730]/80">
            Scan one code with your phone. You can try the other one later. Nothing here asks for your name.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <section className="bg-white rounded-2xl border border-black/10 p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="w-6 h-6 rounded-full" style={{ backgroundColor: "#6B8E5E" }} />
              <h2 className="text-2xl font-bold">Immersive</h2>
            </div>
            <p className="text-[#2D2730]/80">Explore a 360° room.</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/demo/qr-immersive.svg" alt="QR code: Immersive 360 room" className="mx-auto w-64 h-64 md:w-72 md:h-72" />
            <p className="text-sm text-[#2D2730]/60">ThingLink · Room 1</p>
          </section>

          <section className="bg-white rounded-2xl border border-black/10 p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="w-6 h-6 rounded-md" style={{ backgroundColor: "#B86B4A" }} />
              <h2 className="text-2xl font-bold">Reading</h2>
            </div>
            <p className="text-[#2D2730]/80">Follow a short guide at your own pace.</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/demo/qr-reading.svg" alt="QR code: Reading guide" className="mx-auto w-64 h-64 md:w-72 md:h-72" />
            <p className="text-sm text-[#2D2730]/60">Book Creator · Page 1</p>
          </section>
        </div>

        <p className="text-center text-[#2D2730]/70">
          Inside either one, tap <strong>Open The Bridge</strong> for support. Sharing with your lecturer is optional and anonymous.
        </p>
      </div>
    </div>
  );
}
