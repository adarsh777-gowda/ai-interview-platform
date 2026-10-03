import type { JavaProblem } from "../types";

// Arrays & hashing patterns that still dominate Java screens in 2025-26.
export const ARRAYS_HASHING_PROBLEMS: JavaProblem[] = [
  {
    id: "two-sum-indices",
    title: "Two Sum - Return Indices",
    category: "arrays-hashing",
    difficulty: "EASY",
    companies: ["Amazon", "Google", "Adobe", "Zoho"],
    tags: ["HashMap", "Arrays", "One-pass"],
    prompt: `Goal
Given an array of integers nums and an integer target, print the indices of the two values that add up to target.

Input
Three parts, read in this order:
- Line 1: n, the number of elements in nums.
- Line 2: exactly n integers, the values of nums, separated by spaces.
- Line 3: target, a single integer.

Output
The two indices separated by a single space, with the smaller index first.

Constraints
- 2 <= n <= 10000
- -1000000000 <= nums[i] <= 1000000000, and likewise for target
- Exactly one valid pair exists.
- The same element may not be used twice.`,
    approach: [
      "Brute force is O(n^2); the interviewer expects better.",
      "For each value x you must ask: have I already seen target - x?",
      "That 'have I seen it' question is a hash-map lookup, giving O(n) time.",
      "Store value -> index, and check the complement BEFORE inserting the current value.",
    ],
    keyElements: [
      "Exactly one valid solution -> you can return as soon as you find it.",
      "Cannot reuse the same element -> check the complement before inserting.",
      "Return indices, not values -> the map must store the index.",
      "Output ordered ascending -> sort the two indices before printing.",
    ],
    pitfalls: [
      "Inserting before checking lets an element match itself.",
      "Printing the indices in the wrong order.",
      "Using a Set instead of a Map and losing the index.",
    ],
    examples: [
      { label: "Example 1", input: "4\n2 7 11 15\n9", expected: "0 1" },
      { label: "Example 2", input: "3\n3 2 4\n6", expected: "1 2" },
    ],
    hiddenTests: [
      { label: "Duplicates", input: "4\n3 3 4 5\n6", expected: "0 1", hidden: true },
      { label: "Negatives", input: "4\n-3 4 3 90\n0", expected: "0 2", hidden: true },
    ],
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();

        // TODO: use a HashMap<Integer,Integer> mapping value -> index.
        // For each i, check whether (target - nums[i]) is already in the map.
        // Print the two indices in ascending order, space separated, then return.
    }
}`,
    editorial:
      "Single pass with a HashMap from value to index. For each element check whether target - value is already present; if so print the sorted pair and return, otherwise store the value with its index. O(n) time, O(n) space.",
    followUps: [
      "What if there could be multiple valid pairs? Return all of them.",
      "What if the array is sorted - can you reach O(1) space? (two pointers)",
      "How would you adapt this to return the closest pair when no exact match exists?",
    ],
  },
  {
    id: "group-anagrams",
    title: "Group Anagrams",
    category: "arrays-hashing",
    difficulty: "MEDIUM",
    companies: ["Amazon", "Meta", "Uber", "Microsoft"],
    tags: ["HashMap", "Sorting key", "Strings"],
    prompt: `Goal
Group the given words so that every word sits with the other words it is an anagram of. Two words are anagrams when they contain exactly the same letters with the same counts, ignoring order.

Input
Two parts, read in this order:
- Line 1: n, the number of words.
- Line 2: exactly n lowercase words, separated by spaces.

Output
One group per line. Within a group the words are sorted alphabetically and joined by a single space. The lines are ordered by the first word of each group, also alphabetically.

Constraints
- 1 <= n <= 1000
- 1 <= length of each word <= 100
- Words contain only lowercase letters a-z.`,
    approach: [
      "Two words are anagrams iff their sorted characters are identical.",
      "That sorted string is a natural hash-map key.",
      "Group words under their sorted key, then sort within each group and sort the groups.",
    ],
    keyElements: [
      "Case is always lowercase here, so no normalization is needed.",
      "The sort key is the letters sorted, not the word itself.",
      "Deterministic output: sort inside groups AND sort the groups.",
    ],
    pitfalls: [
      "Using the original word as the key instead of the sorted letters.",
      "Forgetting to sort the groups, giving a non-deterministic order.",
      "Sorting words by length instead of alphabetically.",
    ],
    examples: [
      { label: "Example 1", input: "6\neat tea tan ate nat bat", expected: "ate eat tea\nbat\nnat tan" },
      { label: "Example 2", input: "3\nabc bca cab", expected: "abc bca cab" },
    ],
    hiddenTests: [
      { label: "All distinct", input: "4\na b c d", expected: "a\nb\nc\nd", hidden: true },
      { label: "Repeats", input: "5\naa aa ab ba aa", expected: "aa aa aa\nab ba", hidden: true },
    ],
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        // TODO: map each word to a key = its characters sorted alphabetically.
        // Group words by that key, then sort words inside each group,
        // then sort the groups by their first word, and print one group per line.
    }
}`,
    editorial:
      "Build a HashMap<String, List<String>> keyed by the sorted characters of each word. Sort each group, then sort the list of groups by their first element and print each group joined by spaces.",
    followUps: [
      "Avoid sorting: use a 26-length character-count key instead. What is the tradeoff?",
      "How would this change if words could contain Unicode or uppercase letters?",
      "Group anagrams that are sentences (ignore spaces and punctuation).",
    ],
  },
  {
    id: "product-except-self",
    title: "Product of Array Except Self",
    category: "arrays-hashing",
    difficulty: "MEDIUM",
    companies: ["Amazon", "Apple", "Salesforce", "Flipkart"],
    tags: ["Prefix product", "Arrays", "No division"],
    prompt: `Goal
For every index i, compute the product of all the elements of nums except nums[i] itself. Print all n results. You may not use division.

Input
Two parts, read in this order:
- Line 1: n, the number of elements.
- Line 2: exactly n integers, separated by spaces.

Output
n integers on a single line, separated by single spaces, in the same order as the input elements.

Constraints
- 1 <= n <= 10000
- -100 <= nums[i] <= 100
- Division is not allowed. Use only multiplication, so zeros are handled naturally.`,
    approach: [
      "Division is banned, so you cannot multiply everything and divide.",
      "Answer[i] = (product to the left of i) * (product to the right of i).",
      "Compute a left prefix-product pass, then fold in a running right product.",
    ],
    keyElements: [
      "The ban on division is the point - it also handles zeros automatically.",
      "Two passes: one for prefix products, one for suffix products.",
      "Watch for overflow: use long if the values can be large.",
    ],
    pitfalls: [
      "Dividing by nums[i] (fails on zeros and is explicitly banned).",
      "Recomputing products inside the loop, giving O(n^2).",
      "Overflow when using int for large products.",
    ],
    examples: [
      { label: "Example 1", input: "4\n1 2 3 4", expected: "24 12 8 6" },
      { label: "Example 2", input: "3\n2 3 4", expected: "12 8 6" },
    ],
    hiddenTests: [
      { label: "With zero", input: "5\n-1 1 0 -3 3", expected: "0 0 9 0 0", hidden: true },
      { label: "Two zeros", input: "4\n0 2 0 4", expected: "0 0 0 0", hidden: true },
    ],
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        long[] nums = new long[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextLong();

        // TODO: pass left-to-right writing the product of everything before i,
        // then pass right-to-left multiplying in the product of everything after i.
        // Print the n results separated by spaces.
    }
}`,
    editorial:
      "The first pass writes prefix products into the result. The second pass keeps a running suffix product (starting at 1) and multiplies it into each position from right to left. O(n) time and O(1) extra space beyond the output.",
    followUps: [
      "Return the count of indices whose product would be negative.",
      "Adapt it to return the product of all elements except the two largest.",
      "Discuss integer overflow and how BigInteger changes the complexity.",
    ],
  },
  {
    id: "subarray-sum-k",
    title: "Subarray Sum Equals K",
    category: "arrays-hashing",
    difficulty: "MEDIUM",
    companies: ["Amazon", "Goldman Sachs", "Bloomberg", "Swiggy"],
    tags: ["Prefix sum", "HashMap", "Counting"],
    prompt: `Goal
Count how many contiguous subarrays of nums have a sum equal to k.

Input
Three parts, read in this order:
- Line 1: n, the number of elements.
- Line 2: exactly n integers, separated by spaces.
- Line 3: k, a single integer.

Output
A single integer: the number of subarrays whose sum is exactly k.

Constraints
- 0 <= n <= 10000
- -1000 <= nums[i] <= 1000, and likewise for k
- The array may contain negative numbers and zeros, so a sliding window will not work.`,
    approach: [
      "Counting subarrays by brute force is O(n^2) and too slow for large n.",
      "If prefix[i] = sum of nums[0..i], then sum(i..j) = prefix[j] - prefix[i-1].",
      "You need pairs of prefixes that differ by k, so store prefix counts in a map.",
      "Seed the map with prefix 0 -> 1 to handle subarrays starting at index 0.",
    ],
    keyElements: [
      "Negatives are allowed, so a sliding window will NOT work here.",
      "This is a HashMap-of-prefixes pattern, not a two-pointer pattern.",
      "The empty prefix (sum 0, count 1) is the trickiest edge case.",
    ],
    pitfalls: [
      "Forgetting to seed prefix 0 with count 1.",
      "Incrementing the count before reading it, double-counting the current prefix.",
      "Using an array as a map, which fails on negative or huge prefixes.",
    ],
    examples: [
      { label: "Example 1", input: "3\n1 1 1\n2", expected: "2" },
      { label: "Example 2", input: "5\n1 2 3 4 5\n9", expected: "2" },
    ],
    hiddenTests: [
      { label: "Zero sum with negatives", input: "3\n1 -1 0\n0", expected: "3", hidden: true },
      { label: "No match", input: "3\n1 2 3\n100", expected: "0", hidden: true },
    ],
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int k = sc.nextInt();

        // TODO: walk the array maintaining a running prefix sum.
        // Keep a HashMap<Integer,Integer> of prefix -> how many times seen,
        // seeded with prefix 0 -> 1, and add map.getOrDefault(prefix - k, 0) each step.
    }
}`,
    editorial:
      "Maintain a running prefix sum. Store how often each prefix value has been seen in a HashMap seeded with {0:1}. At each step, the answer grows by the number of earlier prefixes equal to currentPrefix - k. O(n) time, O(n) space.",
    followUps: [
      "Return the indices of the first subarray found instead of a count.",
      "How do you find the length of the longest subarray with sum k (positives only)?",
      "Return all subarrays whose sum equals k without duplicates.",
    ],
  },
  {
    id: "top-k-frequent",
    title: "Top K Frequent Elements",
    category: "arrays-hashing",
    difficulty: "MEDIUM",
    companies: ["Meta", "Netflix", "Google", "CRED"],
    tags: ["HashMap", "Heap", "Bucket sort"],
    prompt: `Goal
Given an array of integers and a number k, print the k values that appear most often, ordered by frequency from highest to lowest.

Input
Three parts, read in this order:
- Line 1: n, the number of elements.
- Line 2: exactly n integers, separated by spaces.
- Line 3: k, a single integer.

Output
Exactly k values on a single line, separated by single spaces, most frequent first.

Constraints
- 1 <= k <= number of distinct values, so a valid answer always exists
- Ties are broken by printing the smaller value first.
- The final array order of the input does not matter.`,
    approach: [
      "Count frequencies with a HashMap, then rank them.",
      "Sorting by (frequency desc, value asc) gives exactly the required order.",
      "A min-heap of size k or bucket sort both reach O(n log k) / O(n).",
    ],
    keyElements: [
      "Ties must break by ascending value -> make the comparator deterministic.",
      "All k values are guaranteed to exist, so k <= number of distinct values.",
      "Whitespace: print values on one line separated by single spaces.",
    ],
    pitfalls: [
      "Ignoring the tie-break rule, producing a wrong order on equal frequencies.",
      "Using a TreeMap keyed by value instead of frequency.",
      "Sorting the pairs but not reversing the frequency direction.",
    ],
    examples: [
      { label: "Example 1", input: "6\n1 1 1 2 2 3\n2", expected: "1 2" },
      { label: "Example 2", input: "4\n4 4 4 5\n2", expected: "4 5" },
    ],
    hiddenTests: [
      { label: "Tie breaks by value", input: "6\n2 1 1 3 3 4\n3", expected: "1 3 2", hidden: true },
      { label: "All unique", input: "3\n7 8 9\n3", expected: "7 8 9", hidden: true },
    ],
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int k = sc.nextInt();

        // TODO: count with HashMap<Integer,Integer>, then sort the entries by
        // frequency descending and by value ascending on ties.
        // Print the first k values separated by spaces.
    }
}`,
    editorial:
      "Count into a HashMap, put the entries into a list, and sort with a comparator: frequency descending, then value ascending. Print the first k. This is O(n + d log d) where d is the number of distinct values; a size-k min-heap gives O(n log k) when d is huge.",
    followUps: [
      "Solve it in O(n) average using bucket sort by frequency.",
      "Do it with a min-heap so memory stays O(k) when d is enormous.",
      "What changes if you must stream the input and cannot hold all numbers?",
    ],
  },
];




