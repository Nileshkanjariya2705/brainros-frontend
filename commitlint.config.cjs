// Commit message validation is disabled — any message is allowed.
// No rules are enforced, so you can write any commit message you like.
module.exports = {
  rules: {},
};

// // Allowed types below. Husky's commit-msg hook runs this on every commit.
// module.exports = {
//   extends: ['@commitlint/config-conventional'],
//   rules: {
//     'type-enum': [
//       2,
//       'always',
//       [
//         'feat',
//         'fix',
//         'docs',
//         'style',
//         'refactor',
//         'perf',
//         'test',
//         'build',
//         'ci',
//         'chore',
//         'revert',
//       ],
//     ],
//     'subject-case': [0],
//   },
// };
