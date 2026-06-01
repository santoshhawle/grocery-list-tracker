// commitlint.config.cjs — enforces the SDLC commit message convention
// Format: <type>(<scope>): <short description>
// See: .github/instructions/sdlc.instructions.md

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'test', 'refactor', 'chore'],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'requirements',
        'architecture',
        'design-review',
        'impl-plan',
        'implementation',
        'tests',
        'pr',
        'ci',
        'deps',
        'config',
        'auth',
        'api',
        'client',
        'server',
      ],
    ],
    'scope-empty': [2, 'never'],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-min-length': [2, 'always', 5],
    'subject-max-length': [2, 'always', 100],
    'header-max-length': [2, 'always', 120],
  },
};
