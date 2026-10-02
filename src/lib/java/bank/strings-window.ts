import type { JavaProblem } from "../types";

// String / windowing patterns that show up in current Java screens.
export const STRINGS_WINDOW_PROBLEMS: JavaProblem[] = [
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    category: "strings-window",
    difficulty: "EASY",
    companies: ["Meta", "Google", "TCS", "Infosys"],
    tags: ["Stack", "Strings"],
    prompt:
      "Read a single line containing only the characters ( ) [ ] { }. Print true if every opening bracket is closed by the same type in the correct order, otherwise print false.",
    approach: [
      "Opening brackets are 'promises'; each closing bracket must match the latest promise.",
      "A stack models 'latest promise' in O(1) time.",
      "Push on openers, pop on closers and compare; a mismatch fails immediately.",
    ],
    keyElements: [
      "Correct order matters, so the closing bracket must equal the popped opener.",
      "At the end the stack must be EMPTY - leftover openers mean false.",
      "Odd-length input can never be valid (quick early exit).",
    ],
    pitfalls: [
      "Only counting brackets instead of matching types (e.g. ([)] looks balanced but is not).",
      "Forgetting the final empty-stack check.",
      "Popping an empty stack when the string starts with a closer.",
    ],
    examples: [
      { label: "Example 1", input: "()", expected: "true" },
      { label: "Example 2", input: "([{}])", expected: "true" },
    ],
    hiddenTests: [
      { label: "Wrong nesting", input: "([)]", expected: "false", hidden: true },
      { label: "Only closers", input: ")]", expected: "false", hidden: true },
    ],
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine().trim() : "";

        // TODO: push openers onto a Deque. On a closer, pop and compare types.
        // Print true only if nothing mismatched AND the deque ends up empty.
    }
}`,
    editorial:
      "Walk the string with a Deque used as a stack. Push each opener. For each closer, pop and check it matches; treat an empty pop or a mismatch as failure. After the loop, success requires an empty stack.",
    followUps: [
      "Return the index of the first character that makes the string invalid.",
      "Handle three types plus an exclamation mark as a reverse closer.",
      "Given only openers, print the minimum number to insert to make it valid.",
    ],
  },
  {
    id: "longest-substring",
    title: "Longest Substring Without Repeating Characters",
    category: "strings-window",
    difficulty: "MEDIUM",
    companies: ["Amazon", "Adobe", "Microsoft", "PhonePe"],
    tags: ["Sliding window", "HashMap", "Two pointers"],
    prompt:
      "Read a single line of characters. Print the length of the longest contiguous substring that contains no repeated character.",
    approach: [
      "Brute force checking every substring is O(n^3); a window keeps it O(n).",
      "Keep a window [left, right] with no repeats using a last-seen index map.",
      "When a character repeats, jump 'left' past its previous occurrence.",
      "Track the maximum window width seen at every right step.",
    ],
    keyElements: [
      "'Substring' means contiguous - this is a window, not a set-count problem.",
      "Move left forward (never backward) so each pointer travels once: O(n).",
      "Jumping left to prevIndex+1 must never move left backwards.",
    ],
    pitfalls: [
      "Setting left to prevIndex instead of prevIndex + 1.",
      "Removing characters from the set when shrinking, which is easy to get wrong.",
      "Assuming the answer is the number of distinct characters.",
    ],
    examples: [
      { label: "Example 1", input: "abcabcbb", expected: "3" },
      { label: "Example 2", input: "bbbbb", expected: "1" },
    ],
    hiddenTests: [
      { label: "Interleaved", input: "pwwkew", expected: "3", hidden: true },
      { label: "Short repeat", input: "dvdf", expected: "3", hidden: true },
    ],
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine().trim() : "";

        // TODO: use two pointers left/right over a window.
        // Keep a HashMap<Character,Integer> of the last seen index of each char.
        // When s.charAt(right) is already in the window, move left past its
        // previous index, then update the best window length.
    }
}`,
    editorial:
      "Sliding window with a last-seen-index map. For each right, if the character was seen at index j, set left = max(left, j + 1), record the character's new index, and update the best length with right - left + 1. O(n) time, O(min(n, alphabet)) space.",
    followUps: [
      "Also return the substring itself, not just its length.",
      "Allow at most k repeats instead of zero.",
      "Solve it for a stream of characters where you cannot rewind.",
    ],
  },
  {
    id: "container-most-water",
    title: "Container With Most Water",
    category: "strings-window",
    difficulty: "MEDIUM",
    companies: ["Amazon", "Goldman Sachs", "Nvidia", "Atlassian"],
    tags: ["Two pointers", "Greedy"],
    prompt:
      "Read n then n non-negative heights. Pick two lines that with the x-axis enclose the most water. Print that maximum area. The area between i and j is min(h[i], h[j]) * (j - i).",
    approach: [
      "Trying all pairs is O(n^2).",
      "Start with the widest pair and shrink it from the shorter side.",
      "The area is limited by the shorter line, so only moving the shorter side can help.",
      "Moving the taller line can only reduce width and never raise the min.",
    ],
    keyElements: [
      "Two pointers from both ends, always moving the shorter one inward.",
      "Width strictly decreases each step, so the loop is finite (O(n)).",
      "Area uses min(height) times the index distance, not the sum.",
    ],
    pitfalls: [
      "Moving the taller pointer instead of the shorter one (misses the answer).",
      "Forgetting the pointer width is a difference of indexes.",
      "Using max instead of min for the height.",
    ],
    examples: [
      { label: "Example 1", input: "9\n1 8 6 2 5 4 8 3 7", expected: "49" },
      { label: "Example 2", input: "2\n1 1", expected: "1" },
    ],
    hiddenTests: [
      { label: "Padded peak", input: "3\n1 2 1", expected: "2", hidden: true },
      { label: "Rising then plateau", input: "6\n2 3 10 5 7 8", expected: "24", hidden: true },
    ],
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] h = new int[n];
        for (int i = 0; i < n; i++) h[i] = sc.nextInt();

        // TODO: two pointers left=0, right=n-1, best=0.
        // Update best with min(h[left],h[right]) * (right-left),
        // then advance whichever pointer has the shorter height.
    }
}`,
    editorial:
      "Two pointers from the ends inward. Track the best area, then move the pointer at the shorter line. When heights are equal, moving either is correct. O(n) time, O(1) space.",
    followUps: [
      "Return the two indices that form the maximum container.",
      "What if the container must be at least a given width apart?",
      "How does this compare with a stack-based approach for the same shape?",
    ],
  },
];

