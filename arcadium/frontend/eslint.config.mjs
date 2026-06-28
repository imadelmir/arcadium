import next from "eslint-config-next/core-web-vitals";

// We start from the recommended rules for Next.js apps, then turn off
// one rule so we can write normal Italian apostrophes (d'insieme, l'utente)
// directly in the text instead of writing them as &apos;.
const eslintConfig = [
  ...next,
  {
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
