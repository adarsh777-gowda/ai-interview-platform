import type { JavaProblem } from "../types";

// Dynamic programming / graph patterns asked in current Java interviews.
export const DP_GRAPH_PROBLEMS: JavaProblem[] = [
  {
    id: "climbing-stairs",
    title: "Climbing Stairs",
    category: "dp-graph",
    difficulty: "EASY",
    companies: ["Amazon", "Adobe", "TCS", "Wipro"],
    tags: ["Dynamic programming", "Fibonacci"],
    prompt:
      "Read n. You climb 1 or 2 steps at a time. Print the number of distinct ways to reach step n. n is at most 45, so use a long if you prefer.",
    approach: [
      "Recursion alone is exponential because the same subproblem repeats.",
      "ways(n) = ways(n-1) + ways(n-2) - you arrive from either the last or second-last step.",
      "That is exactly the Fibonacci recurrence with ways(1)=1, ways(2)=2.",
      "Iterate bottom-up with two rolling variables: O(n) time, O(1) space.",
    ],
    keyElements: [
      "Base cases: 1 way for 1 step, 2 ways for 2 steps.",
      "n can reach 45, so the answer fits in int but not in 8-bit types.",
      "Return an int - the judge compares the exact decimal value.",
    ],
    pitfalls: [
      "Off-by-one in the base cases (ways(2) must be 2, not 1).",
      "Writing plain recursion and timing out on large n.",
      "Using int overflow-prone recursion with memo on a stack.",
    ],
    examples: [
      { label: "Example 1", input: "3", expected: "3" },
      { label: "Example 2", input: "10", expected: "89" },
    ],
    hiddenTests: [
      { label: "Single step", input: "1", expected: "1", hidden: true },
      { label: "Maximum n", input: "45", expected: "1836311903", hidden: true },
    ],
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        // TODO: bottom-up with two rolling variables (a = ways(i-2), b = ways(i-1)).
        // Loop from i=2..n accumulating b+a, then print the result.
    }
}`,
    editorial:
      "Bottom-up Fibonacci with two variables: a=1, b=1 (or a=1, b=2 depending on indexing), and repeat next = a + b while rolling. O(n) time, O(1) space. A HashMap-based memo is the fallback when the recurrence becomes non-linear.",
    followUps: [
      "You can climb 1..k steps at a time - generalise the recurrence.",
      "Return the actual sequence of step sizes, not just the count.",
      "Count ways where you cannot land on a forbidden step.",
    ],
  },
  {
    id: "coin-change",
    title: "Coin Change (Minimum Coins)",
    category: "dp-graph",
    difficulty: "MEDIUM",
    companies: ["Amazon", "Microsoft", "Goldman Sachs", "Flipkart"],
    tags: ["Dynamic programming", "Unbounded knapsack"],
    prompt:
      "Read n, then n coin denominations, then an amount. Print the fewest coins needed to make the amount, or -1 if it cannot be made. Each coin may be used any number of times. If amount is 0 the answer is 0.",
    approach: [
      "Greedy (always take the biggest coin) is wrong for arbitrary denominations.",
      "dp[x] = fewest coins to make x = 1 + min(dp[x - coin]) over all coins.",
      "Fill dp from 0 up to amount so smaller subproblems are ready first.",
      "Initialise dp[0]=0 and everything else to a value larger than any answer.",
    ],
    keyElements: [
      "Amount 0 is 0 coins - a classic edge case.",
      "Return -1 when dp[amount] is still unreachable.",
      "Answer can fit in int as long as amount itself is bounded.",
    ],
    pitfalls: [
      "Using a greedy largest-first strategy (fails e.g. coins 1,3,4 amount 6).",
      "Initialising dp to 0 and mistaking 'unreached' for 'zero coins'.",
      "Marking dp[x] = -1 inside the inner loop too early.",
    ],
    examples: [
      { label: "Example 1", input: "3\n1 2 5\n11", expected: "3" },
      { label: "Example 2", input: "1\n2\n3", expected: "-1" },
    ],
    hiddenTests: [
      { label: "Greedy trap", input: "3\n1 3 4\n6", expected: "2", hidden: true },
      { label: "Zero amount", input: "1\n1\n0", expected: "0", hidden: true },
    ],
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] coins = new int[n];
        for (int i = 0; i < n; i++) coins[i] = sc.nextInt();
        int amount = sc.nextInt();

        // TODO: dp[x] = min coins to make x. Init dp[0]=0, rest to amount+1
        // (unreachable sentinel). For x in 1..amount and each coin, relax
        // dp[x] = min(dp[x], dp[x-coin]+1) when x>=coin. Print dp[amount]
        // or -1 if it is still the sentinel.
    }
}`,
    editorial:
      "Bottom-up DP over amounts. dp[0] = 0, other dp values start at amount + 1 as an unreachable sentinel. For each amount x and coin c with x >= c, dp[x] = min(dp[x], dp[x - c] + 1). Print -1 if dp[amount] remains the sentinel. O(amount * n) time.",
    followUps: [
      "Count the number of distinct combinations that make the amount.",
      "Return one actual combination achieving the minimum.",
      "Make it O(amount) with a greedy coin set and explain when greedy is safe.",
    ],
  },
  {
    id: "number-of-islands",
    title: "Number of Islands",
    category: "dp-graph",
    difficulty: "MEDIUM",
    companies: ["Amazon", "Meta", "Microsoft", "Google"],
    tags: ["BFS", "DFS", "Grid"],
    prompt:
      "Read rows cols, then rows lines of length cols containing only '0' (water) or '1' (land). Print the number of islands, where an island is a group of 1s connected horizontally or vertically.",
    approach: [
      "Scan every cell; the moment you see unvisited land, you found a new island.",
      "Flood fill from that cell (BFS or DFS) to mark the whole component visited.",
      "Count how many times you start a flood fill.",
      "Marking visited cells avoids O(rows*cols) re-exploration.",
    ],
    keyElements: [
      "Only 4-directional connectivity (no diagonals).",
      "You may mutate the grid to mark visited, or use a separate boolean grid.",
      "Both BFS with a queue and DFS recursion give the same count.",
    ],
    pitfalls: [
      "Allowing diagonal neighbours, merging separate islands.",
      "Forgetting to mark cells visited, causing infinite loops or double counting.",
      "Not handling a grid that is entirely water (answer 0).",
    ],
    examples: [
      { label: "Example 1", input: "3 3\n111\n010\n111", expected: "1" },
      { label: "Example 2", input: "1 1\n0", expected: "0" },
    ],
    hiddenTests: [
      { label: "Two islands", input: "3 3\n110\n001\n000", expected: "2", hidden: true },
      { label: "Row of gaps", input: "1 5\n10101", expected: "3", hidden: true },
    ],
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int rows = sc.nextInt();
        int cols = sc.nextInt();
        char[][] g = new char[rows][cols];
        for (int r = 0; r < rows; r++) g[r] = sc.next().toCharArray();

        // TODO: iterate all cells; when you find an unvisited '1', increment
        // the island count and flood fill (BFS with a Queue or DFS) marking
        // every connected '1' as visited. Print the count.
    }
}`,
    editorial:
      "Traverse the grid. On an unvisited '1', increment the count and run a flood fill that flips every connected '1' to '0' (or writes a visited flag). Only four neighbours are allowed. O(rows*cols) time and space in the worst case.",
    followUps: [
      "Return the size of the largest island.",
      "Count islands when diagonals also count as connected.",
      "How would you handle a grid too large to fit in memory (stream it)?",
    ],
  },
];

