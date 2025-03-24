import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const gentleQuizBrandBlue = "#4A97D0"; // possibly #4084B7;
const golden = "#F4C430"; // safron
const dark = "#1f2041"; // space cadet
const violet = "#542344"; // (JTC)
const green = "#629460"; // asparagus


export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
      },
      colors: {
        "quiz-blue": gentleQuizBrandBlue,
        "quiz-gold": golden,
        "quiz-dark": dark,
        "quiz-violet": violet,
        "quiz-green": green,
        
      },
    },
  },
  plugins: [],
} satisfies Config;
