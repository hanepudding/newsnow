import { ourongxing, react } from "@ourongxing/eslint-config"

// -----------------------------------------------------------------------
// Upstream bug workaround
// -----------------------------------------------------------------------
// @ourongxing/eslint-config (both 3.2.3-beta.6 and .7) references 50-ish
// react*/rules under names that no longer exist in the installed
// `@eslint-react/eslint-plugin@2.13.0` — rules were renamed or removed
// between plugin versions and the config wasn't updated to match. Every
// tsx/ts lint invocation crashes in config validation with
//   TypeError: Could not find rule "<name>" in plugin "<plugin>".
//
// Setting each referenced rule to "off" here satisfies the validator
// (severity alone is allowed without the plugin actually owning the rule)
// and unblocks commits. Downside: react lint rules are effectively no-ops
// on our source tree until upstream config is fixed. Core React safety
// (react-hooks/exhaustive-deps etc.) is still enforced via the direct
// `eslint-plugin-react-hooks` dependency in package.json.
//
// To restore proper linting later: `pnpm add -D @ourongxing/eslint-config@latest`
// and delete this override block if the rules match again.
// -----------------------------------------------------------------------
const brokenUpstreamRules = {
  "react-dom/no-children-in-void-dom-elements": "off",
  "react-dom/no-dangerously-set-innerhtml": "off",
  "react-dom/no-dangerously-set-innerhtml-with-children": "off",
  "react-dom/no-find-dom-node": "off",
  "react-dom/no-missing-button-type": "off",
  "react-dom/no-missing-iframe-sandbox": "off",
  "react-dom/no-namespace": "off",
  "react-dom/no-render-return-value": "off",
  "react-dom/no-script-url": "off",
  "react-dom/no-unsafe-iframe-sandbox": "off",
  "react-dom/no-unsafe-target-blank": "off",
  "react/ensure-forward-ref-using-ref": "off",
  "react/no-access-state-in-setstate": "off",
  "react/no-array-index-key": "off",
  "react/no-children-count": "off",
  "react/no-children-for-each": "off",
  "react/no-children-map": "off",
  "react/no-children-only": "off",
  "react/no-children-prop": "off",
  "react/no-children-to-array": "off",
  "react/no-clone-element": "off",
  "react/no-comment-textnodes": "off",
  "react/no-component-will-mount": "off",
  "react/no-component-will-receive-props": "off",
  "react/no-component-will-update": "off",
  "react/no-create-ref": "off",
  "react/no-direct-mutation-state": "off",
  "react/no-duplicate-key": "off",
  "react/no-implicit-key": "off",
  "react/no-leaked-conditional-rendering": "off",
  "react/no-missing-key": "off",
  "react/no-nested-components": "off",
  "react/no-redundant-should-component-update": "off",
  "react/no-set-state-in-component-did-mount": "off",
  "react/no-set-state-in-component-did-update": "off",
  "react/no-set-state-in-component-will-update": "off",
  "react/no-string-refs": "off",
  "react/no-unsafe-component-will-mount": "off",
  "react/no-unsafe-component-will-receive-props": "off",
  "react/no-unsafe-component-will-update": "off",
  "react/no-unstable-context-value": "off",
  "react/no-unstable-default-props": "off",
  "react/no-unused-class-component-members": "off",
  "react/no-unused-state": "off",
  "react/no-useless-fragment": "off",
  "react/prefer-destructuring-assignment": "off",
  "react/prefer-shorthand-boolean": "off",
  "react/prefer-shorthand-fragment": "off",
}

export default ourongxing({
  type: "app",
  // 貌似不能 ./ 开头，
  ignores: ["src/routeTree.gen.ts", "imports.app.d.ts", "public/", ".vscode", "**/*.json"],
}).append(react({
  files: ["src/**"],
})).append({
  rules: brokenUpstreamRules,
})
