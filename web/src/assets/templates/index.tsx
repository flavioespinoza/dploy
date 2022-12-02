const importAll = require =>
  require.keys().reduce((acc, next) => {
    acc[next.replace("./", "").replace(".png", "")] = require(next);
    return acc;
  }, {});

export const templateIcons = importAll(
  require.context("./", false, /\.(png)$/)
);