import { Generator } from "./Generator";

export default function Page() {
  return (
    <main style={{ padding: 40 }}>
      <h1
        style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontWeight: 400,
          fontSize: 13,
          letterSpacing: 2,
          color: "#8e8d8d",
          margin: "0 0 28px",
        }}
      >
        THE ECLIPSE APP — POSTER GENERATOR
      </h1>
      <Generator />
    </main>
  );
}
