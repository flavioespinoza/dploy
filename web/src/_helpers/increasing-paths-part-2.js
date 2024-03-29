function countPaths(grid) {
  const MODULO = 1e9; // The constant to ensure result stays within the bounds
  console.log(MODULO)
  const rows = grid.length; // The number of rows
  const cols = grid[0].length; // The number of columns
  const pathCounts = new Array(rows).fill(0).map(() => new Array(cols).fill(0)); // Grid to cache path counts
  const directions = [-1, 0, 1, 0, -1]; // Direction vectors for exploration

  // Helper function using Depth-First Search to compute increasing path count starting from (i, j)
  const dfs = (i, j) => {
    if (pathCounts[i][j]) {
      // If the path count is already computed for (i, j), return it
      return pathCounts[i][j];
    }
    let pathSum = 1; // Start with a path count of 1 for the current cell
    // Explore all adjacent cells in 4 possible directions (up, right, down, left)
    for (let k = 0; k < 4; ++k) {
      const newX = i + directions[k];
      const newY = j + directions[k + 1];
      // Check if the next cell is within bounds and has a strictly greater value
      if (newX >= 0 && newX < rows && newY >= 0 && newY < cols && grid[i][j] < grid[newX][newY]) {
        pathSum = (pathSum + dfs(newX, newY)) % MODULO; // Recursively compute path count for the next cell
      }
    }
    pathCounts[i][j] = pathSum; // Cache the computed path count for (i, j)
    return pathSum;
  };

  let totalCount = 0; // Total number of increasing paths
  // Loop through all cells in the grid to start path computation
  for (let i = 0; i < rows; ++i) {
    for (let j = 0; j < cols; ++j) {
      totalCount = (totalCount + dfs(i, j)) % MODULO; // Add up all path counts using DFS
    }
  }

  return totalCount; // Return the total number of increasing paths
}

let example = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
  [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
  [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
  [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
  [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
  [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
  [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
  [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26],
  [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
  [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
];

console.log(countPaths(example));

const inputA = [
  [5, 6, 10, 1, 5, 10],
  [54, 25, 29, 5, 4, 32],
  [23, 2, 1, 13, 26, 8],
  [10, 0, 2, 12, 14, 29]
];
console.log(countPaths(inputA)); // 120

const inputB = [
  [5, 6, 10, 1, 5, 10],
  [54, 25, 29, 5, 4, 32],
  [23, 2, 1, 13, 26, 8],
  [10, 0, 2, 12, 14, 29]
];
console.log(countPaths(inputB)); // 120