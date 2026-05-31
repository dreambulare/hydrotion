import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [".open-next/**"]
  },
  ...nextVitals,
  {
    rules: {
      "@next/next/no-img-element": "off"
    }
  }
];

export default config;
