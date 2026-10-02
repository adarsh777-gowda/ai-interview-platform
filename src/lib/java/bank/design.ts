import type { JavaProblem } from "../types";

// Design / OOP questions that current Java interviews keep asking.
export const DESIGN_PROBLEMS: JavaProblem[] = [
  {
    id: "lru-cache",
    title: "LRU Cache",
    category: "design",
    difficulty: "MEDIUM",
    companies: ["Amazon", "Google", "Meta", "Salesforce"],
    tags: ["LinkedHashMap", "Design", "O(1)"],
    prompt:
      "Read capacity, then q. Then q operations of the form PUT key value or GET key. Print the results of all GET operations in order, space separated, or -1 if the key is absent. get() and put() must both run in O(1) average time; when capacity is exceeded, evict the least recently used key.",
    approach: [
      "You need fast lookup AND fast recency updates: a hash map plus an ordering.",
      "The classic answer is a doubly linked list (recency order) + a HashMap.",
      "Every access moves a node to the front (most recent); evict the tail.",
      "In Java, LinkedHashMap with accessOrder=true and a removeEldestEntry hook does it in one line.",
    ],
    keyElements: [
      "Both get and put update recency - even a GET refreshes a key.",
      "Eviction happens only when size EXCEEDS capacity, not when it equals it.",
      "A missing key returns -1 and does not change the recency of anything.",
    ],
    pitfalls: [
      "Forgetting that get() must also mark the key as recently used.",
      "Evicting at the wrong size boundary (off by one).",
      "Returning null instead of -1 for a missing key.",
    ],
    examples: [
      {
        label: "Example 1",
        input: "2\n6\nPUT 1 10\nGET 1\nPUT 2 20\nGET 1\nPUT 3 30\nGET 2",
        expected: "10 10 -1",
      },
      { label: "Example 2", input: "1\n4\nPUT 5 50\nGET 5\nPUT 6 60\nGET 5", expected: "50 -1" },
    ],
    hiddenTests: [
      { label: "Get on empty", input: "2\n3\nGET 9\nPUT 9 99\nGET 9", expected: "-1 99", hidden: true },
      { label: "Put refreshes recency", input: "2\n5\nPUT 1 1\nPUT 2 2\nPUT 1 11\nPUT 3 3\nGET 2", expected: "-1", hidden: true },
    ],
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int capacity = sc.nextInt();
        int q = sc.nextInt();

        // TODO: use LinkedHashMap<Integer,Integer> with accessOrder=true and
        // removeEldestEntry() returning size() > capacity for O(1) get/put.
        // For each of the q ops: "PUT k v" -> put(k,v); "GET k" -> record get(k)
        // (or -1 when absent). Print recorded GET results space separated.
    }
}`,
    editorial:
      "A hand-rolled version pairs a HashMap with a doubly linked list. In Java the idiomatic answer is LinkedHashMap<Integer,Integer> constructed with accessOrder = true and an anonymous removeEldestEntry that returns size() > capacity. put() then refreshes access order automatically and eviction is built in.",
    followUps: [
      "Add a TTL so entries expire after a number of milliseconds.",
      "Make it thread-safe without a global lock.",
      "Extend it to an LFU cache where the least frequently used key is evicted.",
    ],
  },
  {
    id: "rate-limiter",
    title: "Token Bucket Rate Limiter",
    category: "design",
    difficulty: "MEDIUM",
    companies: ["Uber", "Google", "Amazon", "Razorpay"],
    tags: ["System design", "Token bucket", "Timing"],
    prompt:
      "Read capacity, refillPerSec, then q, then q lines of `tokens timeMs` (requests in non-decreasing time order). The bucket starts full with `capacity` tokens and refills by ((now - lastMs) * refillPerSec) / 1000 whole tokens each request, capped at `capacity`. A request is granted (true) only if enough tokens are available; granted requests consume their tokens, rejected ones do not. lastMs is always set to now. Print one true/false per line.",
    approach: [
      "This is the exact algorithm behind real API gateways, so name the design.",
      "Track: tokens, capacity, refillPerSec and lastMs (the last refill timestamp).",
      "On each request, compute whole tokens added by elapsed time, top up (capped), then decide.",
      "Rejected requests must NOT consume tokens - only granted ones subtract.",
    ],
    keyElements: [
      "Integer division gives whole refill tokens, so sub-second gaps refill nothing.",
      "Cap the bucket at `capacity` so a long idle period never over-fills it.",
      "Set lastMs = now on EVERY request, granted or not, so time never repeats.",
      "If requested tokens exceed `capacity`, the request can never be granted.",
    ],
    pitfalls: [
      "Subtracting tokens on a rejected request (drains the bucket incorrectly).",
      "Not capping at capacity, letting long gaps mint unlimited tokens.",
      "Forgetting to advance lastMs, so elapsed time is counted repeatedly.",
      "Using floating point, which makes results non-deterministic.",
      "Measuring elapsed time from t=0 instead of from the previous request.",
      "Integer division per interval drops leftover fractions (0.999s of a token vanishes) - a real system keeps a remainder.",
    ],
    examples: [
      { label: "Example 1", input: "3 1\n4\n2 0\n2 1000\n2 2000\n2 3500", expected: "true\ntrue\nfalse\ntrue" },
      { label: "Example 2", input: "1 1\n4\n1 0\n1 0\n1 999\n1 1000", expected: "true\nfalse\nfalse\nfalse" },
    ],
    hiddenTests: [
      { label: "Over capacity request", input: "2 1\n3\n5 0\n1 0\n1 5000", expected: "false\ntrue\ntrue", hidden: true },
      { label: "Refill capped", input: "2 5\n4\n2 0\n2 0\n2 10000\n2 10500", expected: "true\nfalse\ntrue\ntrue", hidden: true },
    ],
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int capacity = sc.nextInt();
        int refillPerSec = sc.nextInt();
        int q = sc.nextInt();

        // TODO: start tokens = capacity and lastMs = 0.
        // For each request (need, now):
        //   refill = ((now - lastMs) * refillPerSec) / 1000
        //   tokens  = min(capacity, tokens + refill);  lastMs = now
        //   if tokens >= need -> print true and tokens -= need; else print false
        // Print one true/false per line.
    }
}`,
    editorial:
      "Classic token bucket. Hold tokens, capacity, refillPerSec and lastMs. Each request first converts elapsed milliseconds into whole tokens via ((now - lastMs) * refillPerSec) / 1000, tops the bucket up but never past capacity, sets lastMs = now, then grants only if tokens >= need - subtracting on grant only. Deterministic, O(1) per request.",
    followUps: [
      "Add a burst size that exceeds sustained capacity for cold starts.",
      "Implement a sliding window counter and compare its accuracy.",
      "How would you share one bucket across several instances (distributed rate limiting)?",
    ],
  },
];

