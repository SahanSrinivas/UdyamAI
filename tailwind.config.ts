import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#000000",
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#333333",
          800: "#171717",
          900: "#0a0a0a",
          950: "#000000",
        },
        cream: {
          50: "#faf7f1",
          100: "#f5f1ea",
          200: "#ede5d6",
          300: "#e0d5c0",
          400: "#c9baa0",
          500: "#a89881",
        },
        mist: {
          50: "#eef2f7",
          100: "#dde5ee",
          200: "#c9d3e0",
          300: "#b8c5d3",
          400: "#9baabc",
          500: "#7c8a9d",
        },
        sage: {
          50: "#eff4e6",
          100: "#e2ecd1",
          200: "#cfddc1",
          300: "#b8ccaa",
          400: "#9bb58c",
          500: "#7d9770",
        },
        sand: {
          50: "#f6efe2",
          100: "#ede1c9",
          200: "#e2d0ab",
          300: "#d1ba8a",
          400: "#b89e6a",
          500: "#8f7a52",
        },
        muted: {
          DEFAULT: "#8a8f98",
          soft: "#5b6169",
          strong: "#c9cdd4",
        },
        line: {
          DEFAULT: "#1a1a1a",
          soft: "#141414",
          strong: "#2a2a2a",
        },
        rh: {
          lime: "#CCFF5E",
          "lime-bright": "#DAFF7A",
          "lime-dim": "#B5E043",
          "lime-glow": "rgba(204,255,94,0.24)",
          green: "#00D93E",
          red: "#FA5252",
          amber: "#FFB400",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Söhne",
          "Helvetica Neue",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        serif: [
          "var(--font-serif)",
          "GT Sectra",
          "Freight Display",
          "Georgia",
          "serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.045em",
        tighter: "-0.035em",
        tight2: "-0.025em",
        serif: "-0.02em",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
        "cream-card": "0 1px 0 0 rgba(255,255,255,0.6) inset, 0 20px 40px -20px rgba(0,0,0,0.12)",
        pop: "0 24px 60px -16px rgba(0,0,0,0.8)",
        "lime-glow": "0 0 0 1px rgba(204,255,94,0.45), 0 0 48px 0 rgba(204,255,94,0.22)",
      },
      backgroundImage: {
        "cream-fade":
          "linear-gradient(180deg, #f5f1ea 0%, #ede5d6 100%)",
        "cream-radial":
          "radial-gradient(ellipse 90% 60% at 50% 0%, #faf7f1 0%, #ede5d6 65%, #e0d5c0 100%)",
        "mist-fade":
          "linear-gradient(180deg, #c9d3e0 0%, #b8c5d3 100%)",
        "sage-fade":
          "linear-gradient(180deg, #cfddc1 0%, #b8ccaa 100%)",
        "sand-fade":
          "linear-gradient(180deg, #f6efe2 0%, #ede1c9 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
