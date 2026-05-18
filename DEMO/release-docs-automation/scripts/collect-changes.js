const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const automationRoot = path.resolve(__dirname, '..');
const targetRepo = path.resolve(process.env.TARGET_REPO || '.');

function runGitCommand(command, fallback) {
  try {
    return execSync(command, {
      cwd: targetRepo,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
  } catch (error) {
    return fallback;
  }
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getRepoName() {
  if (process.env.BITBUCKET_REPO_FULL_NAME) {
    return process.env.BITBUCKET_REPO_FULL_NAME;
  }

  const remote = runGitCommand(
    'git config --get remote.origin.url',
    ''
  );

  if (remote) {
    return remote;
  }

  return path.basename(targetRepo);
}

function collectChanges() {
  const input = {
    date: getToday(),
    title: path.basename(targetRepo),
    repo: getRepoName(),
    targetRepo,
    branch: process.env.BITBUCKET_BRANCH || runGitCommand('git branch --show-current', 'No branch available'),
    commit: process.env.BITBUCKET_COMMIT || runGitCommand('git rev-parse HEAD', 'No commit available'),
    commits: runGitCommand(
      'git log -10 --pretty=format:"%h - %s (%an)"',
      'No git commits available. Verify TARGET_REPO points to a git repository.'
    ),
    diffStat: runGitCommand(
      'git diff HEAD~1 HEAD --stat',
      'No diff stat available. The repository may not have enough commit history.'
    ),
    diffSummary: runGitCommand(
      'git diff HEAD~1 HEAD -- src scripts tests package.json bitbucket-pipelines.yml README.md',
      'No relevant diff summary available for src, scripts, tests, package.json, pipeline or README.'
    )
  };

  const outputPath = path.join(automationRoot, 'release-input.json');
  fs.writeFileSync(outputPath, `${JSON.stringify(input, null, 2)}\n`, 'utf8');

  console.log(`Release input written to ${outputPath}`);
  console.log(`Target repo: ${targetRepo}`);
}

collectChanges();
