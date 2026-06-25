import { TuningStudio } from "../TuningStudio";

export default function TunePage() {
  return (
    <main
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: 40,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontWeight: 400,
          fontSize: 13,
          letterSpacing: 2,
          color: "#8e8d8d",
          margin: "0 0 28px",
          flexShrink: 0,
        }}
      >
        GENERATOR TUNING — /tune
      </h1>
      <TuningStudio
        eclipseId="2024-04-08"
        location={{ name: "Dallas", admin: "TX", lat: 32.7767, lon: -96.797, tz: "America/Chicago" }}
        aspiration="Look up."
        baseSpanDeg={26}
      />
    </main>
  );
}
