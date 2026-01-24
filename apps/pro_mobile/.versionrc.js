module.exports = {
  // Update version in package.json
  bumpFiles: [
    {
      filename: 'package.json',
    },
    // Update expo.version in app.json
    {
      filename: 'app.json',
      updater: require.resolve('standard-version-expo'),
    },
    // Update Android versionCode in app.json
    {
      filename: 'app.json',
      updater: require.resolve('standard-version-expo/android'),
    },
    // Update iOS buildNumber in app.json
    {
      filename: 'app.json',
      updater: require.resolve('standard-version-expo/ios'),
    },
  ],
  // Skip generating CHANGELOG (optional - remove if you want auto-generated changelog)
  // skip: {
  //   changelog: true,
  // },
  // Custom commit message format
  releaseCommitMessageFormat: 'chore(release): {{currentTag}}',
  // Types of commits that trigger version bumps
  types: [
    { type: 'feat', section: '✨ Features' },
    { type: 'fix', section: '🐛 Bug Fixes' },
    { type: 'perf', section: '⚡ Performance Improvements' },
    { type: 'revert', section: '⏪ Reverts' },
    { type: 'docs', section: '📝 Documentation', hidden: true },
    { type: 'style', section: '💄 Styles', hidden: true },
    { type: 'chore', section: '🔧 Miscellaneous Chores', hidden: true },
    { type: 'refactor', section: '♻️ Code Refactoring', hidden: true },
    { type: 'test', section: '✅ Tests', hidden: true },
    { type: 'build', section: '👷 Build System', hidden: true },
    { type: 'ci', section: '🔧 CI/CD', hidden: true },
  ],
};
