/**
 * Conventional Commits — règles de validation des messages de commit.
 *
 * Story 1.17 (versioning automatique) : semantic-release dérive la version
 * produit de l'historique des commits. Cette config + le hook husky
 * `.husky/commit-msg` garantissent que chaque commit respecte le format
 * `type(scope): description` (feat, fix, docs, chore, refactor, …).
 *
 * Root package.json sans `type` → module CommonJS.
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
