// Enforces Conventional Commits, e.g.  feat(auth): add login form
// Allowed types below. Husky's commit-msg hook runs this on every commit.
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'],
    ],
    'subject-case': [0],
  },
};
