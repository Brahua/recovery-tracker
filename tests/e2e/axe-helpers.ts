import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

// Automated WCAG 2.1 A/AA checks with axe on every main screen, so the accessibility
// verified by hand (Lighthouse 100) does not regress silently.
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

export async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = results.violations.map(({ id, impact, help, nodes }) => ({
    id,
    impact,
    help,
    targets: nodes.map((node) => node.target.join(" ")),
  }));
  expect(summary).toEqual([]);
}
