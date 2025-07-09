import type { Config } from "tailwindcss"
import defaultConfig from "shadcn/ui/tailwind.config"

const config: Config = {
  ...defaultConfig,
  content: [
    ...defaultConfig.content,
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    ...defaultConfig.theme,
    extend: {
      ...defaultConfig.theme.extend,
      colors: {
        ...defaultConfig.theme.extend.colors,
        "matrix-green": "#00ff00",
        "matrix-dark-green": "#008800",
        "matrix-light-green": "#88ff88",
        "matrix-bg": "#000000",
        "matrix-dark-bg": "#001100",
        "matrix-red": "#ff0040",
        "matrix-yellow": "#ffff00",
        "matrix-blue": "#0080ff",
        "matrix-cyan": "#00ffff",
      },
      fontFamily: {
        mono: ["Courier Prime", "monospace"],
      },
      animation: {
        "matrix-pulse": "matrix-pulse 2s infinite",
        "matrix-glow": "matrix-glow 3s infinite",
      },
      keyframes: {
        "matrix-pulse": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "matrix-glow": {
          "0%": { textShadow: "0 0 20px #00ff00" },
          "50%": { textShadow: "0 0 30px #00ff00, 0 0 40px #00ff00" },
          "100%": { textShadow: "0 0 20px #00ff00" },
        },
      },
    },
  },
  plugins: [...defaultConfig.plugins, require("tailwindcss-animate")],
}

export default config
