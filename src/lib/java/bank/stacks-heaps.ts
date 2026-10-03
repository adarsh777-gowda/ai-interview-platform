import type { JavaProblem } from "../types";

// Stack, heap and binary-search patterns seen in current Java screens.
export const STACKS_HEAPS_PROBLEMS: JavaProblem[] = [
  {
    id: "daily-temperatures",
    title: "Daily Temperatures",
    category: "stacks-heaps",
    difficulty: "MEDIUM",
    companies: ["Amazon", "Meta", "Infosys", "Zoho"],
    tags: ["Monotonic stack", "Arrays"],
    prompt: `Goal
For each day, compute how many days you must wait forward for a strictly warmer temperature to appear. If no warmer day ever comes, the answer for that day is 0.

Input
Two parts, read in this order:
- Line 1: n, the number of days.
- Line 2: exactly n integers, the temperatures, separated by spaces.

Output
n integers on a single line, separated by single spaces: the waiting days for each day in the same order.

Constraints
- 1 <= n <= 100000
- 30 <= temperature[i] <= 100
- Equal temperatures do not count as warmer, only strictly greater does.`,
    approach: [
      "Brute force scanning ahead is O(n^2).",
      "Keep a stack of indices whose next-warmer day is still unknown.",
      "Process days left to right; when today is warmer it resolves earlier cold days.",
      "Pop while top's temperature is below today, setting its answer to today - index.",
    ],
    keyElements: [
      "The stack holds indices, not values, so you can compute the day gap.",
      "The stack must stay monotonically decreasing by temperature.",
      "Days that never get warmer stay 0 (the default).",
    ],
    pitfalls: [
      "Storing temperatures instead of indices, losing the distance.",
      "Forgetting the initial array of zeros, so unresolved days print garbage.",
      "Using a max-heap where a monotonic stack is required.",
    ],
    examples: [
      { label: "Example 1", input: "8\n73 74 75 71 69 72 76 73", expected: "1 1 4 2 1 1 0 0" },
      { label: "Example 2", input: "4\n30 40 50 60", expected: "1 1 1 0" },
    ],
    hiddenTests: [
      { label: "Strictly rising", input: "3\n30 60 90", expected: "1 1 0", hidden: true },
      { label: "Mixed", input: "5\n55 38 53 81 61", expected: "3 1 1 0 0", hidden: true },
    ],
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] t = new int[n];
        for (int i = 0; i < n; i++) t[i] = sc.nextInt();

        // TODO: use a Deque<Integer> of indices (monotonic decreasing by temp).
        // For each day, while the stack top's temp is colder than today, pop and
        // write answer[top] = i - top. Push i. Print answers separated by spaces.
    }
}`,
    editorial:
      "A monotonic decreasing stack of indices. For each day i, pop every colder index at the top and set its answer to i - that index, then push i. Any index left on the stack has no warmer day and keeps 0. O(n) time, O(n) space.",
    followUps: [
      "Print the actual next warmer temperature instead of the day gap.",
      "Do the same for the previous colder day instead of the next warmer day.",
      "What data structure would you use for queries that arrive online?",
    ],
  },
  {
    id: "kth-largest",
    title: "Kth Largest Element in an Array",
    category: "stacks-heaps",
    difficulty: "MEDIUM",
    companies: ["Amazon", "Microsoft", "Goldman Sachs", "Uber"],
    tags: ["Heap", "Quickselect", "Arrays"],
    prompt: `Goal
Print the kth largest element of the array, counting k from 1 at the largest. Duplicate values count as separate elements, so no deduplication happens.

Input
Three parts, read in this order:
- Line 1: n, the number of elements.
- Line 2: exactly n integers, separated by spaces.
- Line 3: k, a single integer.

Output
A single integer: the kth largest element.

Constraints
- 1 <= n <= 100000
- 1 <= k <= n
- Values may be negative.
- Sorting the whole array is correct but O(n log n); the target is O(n log k).`,
    approach: [
      "Sorting the whole array works but costs O(n log n) always.",
      "A size-k min-heap keeps only the k largest: push, and pop when it grows past k.",
      "The heap top is then the kth largest in O(n log k).",
      "Quickselect averages O(n) if the interviewer wants optimal time.",
    ],
    keyElements: [
      "k is 1-indexed, and k is always between 1 and n.",
      "Duplicates count separately, so distinct-element logic is wrong.",
      "A min-heap of size k (not a max-heap) is the trick for kth largest.",
    ],
    pitfalls: [
      "Using a max-heap (you want to evict the smallest of the top k).",
      "Confusing kth largest with kth smallest.",
      "Using a TreeMap keyed by value and ignoring duplicate counts.",
    ],
    examples: [
      { label: "Example 1", input: "6\n3 2 1 5 6 4\n2", expected: "5" },
      { label: "Example 2", input: "9\n3 2 3 1 2 4 5 5 6\n4", expected: "4" },
    ],
    hiddenTests: [
      { label: "Single element", input: "1\n7\n1", expected: "7", hidden: true },
      { label: "All negative", input: "5\n-1 -2 -3 -4 -5\n3", expected: "-3", hidden: true },
    ],
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int k = sc.nextInt();

        // TODO: keep a PriorityQueue<Integer> min-heap of size k.
        // Add each number, and remove the smallest whenever the size exceeds k.
        // The heap peek is then the kth largest - print it.
    }
}`,
    editorial:
      "Maintain a size-k min-heap of the largest elements seen so far. After feeding all numbers, peek() is the kth largest. O(n log k) time, O(k) space. Sorting is simpler but always O(n log n); quickselect averages O(n).",
    followUps: [
      "Find the kth largest using quickselect and explain the worst case.",
      "Return all k largest elements in descending order.",
      "Do it when the array arrives as a stream and k changes over time.",
    ],
  },
  {
    id: "search-rotated",
    title: "Search in Rotated Sorted Array",
    category: "stacks-heaps",
    difficulty: "MEDIUM",
    companies: ["Meta", "Amazon", "Adobe", "CRED"],
    tags: ["Binary search", "Arrays"],
    prompt: `Goal
An array was sorted in ascending order and then rotated at some unknown pivot, so it now contains two ascending runs. Find the index of a target value inside it.

Input
Three parts, read in this order:
- Line 1: n, the number of elements.
- Line 2: exactly n distinct integers, the rotated array, separated by spaces.
- Line 3: target, a single integer to search for.

Output
A single integer: the index of target in the array, or -1 if target is absent.

Constraints
- 1 <= n <= 100000
- All values in the array are distinct, so there is never an index ambiguity.
- The array was sorted ascending and rotated only once, so at most one of the two runs is out of order.
- A rotation of 0 is allowed, so the array may already be fully sorted.`,
    approach: [
      "A rotation splits the array into two sorted halves; one half is always sorted.",
      "Run binary search and check which half is sorted.",
      "If the target lies inside the sorted half, narrow there; otherwise go to the other half.",
      "This keeps the O(log n) guarantee without un-rotating the array.",
    ],
    keyElements: [
      "All values are distinct - you never have to break value ties.",
      "Compare against nums[left] and nums[right] to find the sorted half.",
      "Use <= inclusive comparisons carefully so the pivot is not skipped.",
    ],
    pitfalls: [
      "Assuming the whole array is sorted and returning a wrong index.",
      "Forgetting the case where the pivot itself equals the target.",
      "Off-by-one when choosing the new search bounds.",
    ],
    examples: [
      { label: "Example 1", input: "7\n4 5 6 7 0 1 2\n0", expected: "4" },
      { label: "Example 2", input: "7\n4 5 6 7 0 1 2\n3", expected: "-1" },
    ],
    hiddenTests: [
      { label: "Single element", input: "1\n1\n0", expected: "-1", hidden: true },
      { label: "Target at pivot", input: "5\n5 1 2 3 4\n4", expected: "4", hidden: true },
    ],
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();

        // TODO: binary search with lo/hi. At each step decide which half is
        // sorted by comparing nums[lo] with nums[mid]; if target falls inside
        // that sorted half, search it, otherwise search the other half.
    }
}`,
    editorial:
      "Modified binary search. If nums[lo] <= nums[mid], the left half is sorted: search it only when target is inside [nums[lo], nums[mid]); else search right. Mirror that for a sorted right half. O(log n) time, O(1) space.",
    followUps: ["Handle duplicates (the hard variant where a half may be unpivotable).",
      "Return the number of times the target appears in a rotated array.",
      "Find the rotation pivot index in O(log n)."],
  },
];

