import java.io.*;

import java.math.*;

import java.security.*;

import java.text.*;

import java.util.*;

import java.util.concurrent.*;

import java.util.function.*;

import java.util.regex.*;

import java.util.stream.*;

import static java.util.stream.Collectors.joining;

import static java.util.stream.Collectors.toList;

public class Solution {

  static HashSet<String> set;

  static boolean isSafe(int x, int y, int mx, int my, boolean vis[][]) {

    if (x >= 0 && y >= 0 && x < mx && y < my && !vis[x][y]) {
      return true;
    }

    return false;
  }

  static void allPaths(int g[][], int si, int sj, String str, int curr, boolean vis[][]) {

    vis[si][sj] = true;
    ;

    int xdir[] = { 0, 1, 0, -1 };
    int ydir[] = { 1, 0, -1, 0 };

    for (int i = 0; i < 4; i++) {
      int nx = si + xdir[i];
      int ny = sj + ydir[i];

      if (isSafe(nx, ny, g.length, g[0].length, vis)) {

        if (curr < g[nx][ny]) {
          str = str + "->" + g[nx][ny];
          set.add(str);
          allPaths(g, nx, ny, str, g[nx][ny], vis);
          str = str.substring(0, str.length() - 3);
        }
      }
    }

  }

  // Complete the paths function below.

  static int paths(List<List<Integer>> grid) {

    set = new HashSet<>();

    int nR = grid.size();
    int nC = grid.get(0).size();
    int g[][] = new int[nR][nC];

    for (int i = 0; i < nR; i++) {
      for (int j = 0; j < nC; j++) {
        g[i][j] = grid.get(i).get(j);
      }
    }

    boolean vis[][];
    for (int i = 0; i < nR; i++) {
      for (int j = 0; j < nC; j++) {
        vis = new boolean[nR][nC];
        allPaths(g, i, j, "" + g[i][j], g[i][j], vis);

      }
    }

    return set.size();

  }

  public static void main(String[] args) throws IOException {

    BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));

    BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

    int gridRows = Integer.parseInt(bufferedReader.readLine().trim());

    int gridColumns = Integer.parseInt(bufferedReader.readLine().trim());

    List<List<Integer>> grid = new ArrayList<>();

    IntStream.range(0, gridRows).forEach(i -> {

      try {

        grid.add(

            Stream.of(bufferedReader.readLine().replaceAll("\\s+$", "").split(" "))

                .map(Integer::parseInt)

                .collect(toList())

        );

      } catch (IOException ex) {

        throw new RuntimeException(ex);

      }

    });

    int res = paths(grid);

    bufferedWriter.write(String.valueOf(res));

    bufferedWriter.newLine();

    bufferedReader.close();

    bufferedWriter.close();

  }

}