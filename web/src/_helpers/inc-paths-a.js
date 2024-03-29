var countPaths = function (grid) {
  let ans = 0;
  const n = grid.length;
  const m = grid[0].length;
  const dirs = [-1, 0, 1, 0, -1];
  const MOD = Math.pow(10, 9) + 7;
  const dp = new Array(n).fill().map((_) => new Array(m).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (dp[i][j] === 0) {
        dfs(i, j, dp, grid, dirs, n, m, MOD);
      }
      ans = (ans + dp[i][j]) % MOD;
    }
  }

  return ans;
};

function dfs(i, j, dp, grid, dirs, n, m, MOD) {
  if (dp[i][j] !== 0) return dp[i][j];

  let curr = 1;
  for (let idx = 0; idx < dirs.length - 1; idx++) {
    const ni = i + dirs[idx];
    const nj = j + dirs[idx + 1];
    if (ni >= 0 && ni < n && nj >= 0 && nj < m && grid[ni][nj] > grid[i][j]) {
      const next = dfs(ni, nj, dp, grid, dirs, n, m, MOD);
      curr = (curr + next) % MOD;
    }
  }

  return (dp[i][j] = curr);
}

let example = [
  [5, 6, 10, 1, 5, 10],
  [54, 25, 29, 5, 4, 32],
  [23, 2, 1, 13, 26, 8],
  [10, 0, 2, 12, 14, 29],
];

console.log(countPaths(example));
