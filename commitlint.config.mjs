export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      ["root", "docs", "blog", "brainful", "build-tools"],
    ],
  },
}
