import { QuestionType, Difficulty } from "@prisma/client";

export type SeedQuestion = {
  type: QuestionType;
  topic: string;
  difficulty: Difficulty;
  prompt: string;
};

const { BEHAVIORAL, TECHNICAL, CODING, SYSTEM_DESIGN } = QuestionType;
const { JUNIOR, MID, SENIOR } = Difficulty;

// A large, curated practice bank. Kept as plain data so it is easy to extend.
export const QUESTION_BANK: SeedQuestion[] = [
  // ---------------- leadership ----------------
  { type: BEHAVIORAL, topic: "leadership", difficulty: JUNIOR, prompt: "Tell me about a time you took ownership of a task without being asked." },
  { type: BEHAVIORAL, topic: "leadership", difficulty: MID, prompt: "Describe a situation where you had to motivate a team through a difficult period." },
  { type: BEHAVIORAL, topic: "leadership", difficulty: MID, prompt: "Tell me about a time you led a project under a tight deadline. What was your approach?" },
  { type: BEHAVIORAL, topic: "leadership", difficulty: SENIOR, prompt: "Describe how you drove a technical vision across multiple teams and managed competing priorities." },
  // ---------------- conflict ----------------
  { type: BEHAVIORAL, topic: "conflict", difficulty: JUNIOR, prompt: "Describe a disagreement with a teammate and how you resolved it." },
  { type: BEHAVIORAL, topic: "conflict", difficulty: MID, prompt: "Tell me about a time you disagreed with your manager's decision. How did you handle it?" },
  { type: BEHAVIORAL, topic: "conflict", difficulty: MID, prompt: "How have you handled a situation where a peer was not delivering on a shared commitment?" },
  { type: BEHAVIORAL, topic: "conflict", difficulty: SENIOR, prompt: "Describe mediating a high-stakes disagreement between two senior engineers with opposing designs." },
  // ---------------- failure ----------------
  { type: BEHAVIORAL, topic: "failure", difficulty: JUNIOR, prompt: "Tell me about a mistake you made recently and what you learned from it." },
  { type: BEHAVIORAL, topic: "failure", difficulty: MID, prompt: "Describe a project that did not meet its goals. What would you do differently?" },
  { type: BEHAVIORAL, topic: "failure", difficulty: SENIOR, prompt: "Tell me about a significant failure. What did you learn and what changed afterward?" },
  { type: BEHAVIORAL, topic: "failure", difficulty: SENIOR, prompt: "Describe a time a decision you championed caused a production incident. How did you recover trust?" },
  // ---------------- teamwork ----------------
  { type: BEHAVIORAL, topic: "teamwork", difficulty: JUNIOR, prompt: "Give an example of how you collaborated with others to deliver a shared goal." },
  { type: BEHAVIORAL, topic: "teamwork", difficulty: MID, prompt: "Describe a time you had to rely on another team to complete your work. How did you keep things on track?" },
  { type: BEHAVIORAL, topic: "teamwork", difficulty: MID, prompt: "Tell me about mentoring a less experienced teammate and the impact it had." },
  { type: BEHAVIORAL, topic: "teamwork", difficulty: SENIOR, prompt: "How have you built and sustained a healthy engineering culture in a fast-growing team?" },
  // ---------------- javascript ----------------
  { type: TECHNICAL, topic: "javascript", difficulty: JUNIOR, prompt: "Explain the difference between let, const, and var in JavaScript." },
  { type: TECHNICAL, topic: "javascript", difficulty: MID, prompt: "Explain the event loop in JavaScript and how async/await fits into it." },
  { type: TECHNICAL, topic: "javascript", difficulty: MID, prompt: "What is a closure? Give a practical example where it is useful." },
  { type: TECHNICAL, topic: "javascript", difficulty: SENIOR, prompt: "Explain how prototypal inheritance works and how it differs from class-based inheritance." },
  // ---------------- react ----------------
  { type: TECHNICAL, topic: "react", difficulty: JUNIOR, prompt: "What is the difference between state and props in React?" },
  { type: TECHNICAL, topic: "react", difficulty: MID, prompt: "Explain how the useEffect hook works and common mistakes that cause extra renders." },
  { type: TECHNICAL, topic: "react", difficulty: MID, prompt: "How does React's reconciliation and the virtual DOM improve performance?" },
  { type: TECHNICAL, topic: "react", difficulty: SENIOR, prompt: "Describe strategies for optimizing the performance of a large React application." },
  // ---------------- css ----------------
  { type: TECHNICAL, topic: "css", difficulty: JUNIOR, prompt: "Explain the box model and how box-sizing affects layout." },
  { type: TECHNICAL, topic: "css", difficulty: MID, prompt: "Compare Flexbox and CSS Grid. When would you choose each?" },
  { type: TECHNICAL, topic: "css", difficulty: MID, prompt: "How do you build a responsive layout without a CSS framework?" },
  { type: TECHNICAL, topic: "css", difficulty: SENIOR, prompt: "Explain CSS specificity, the cascade, and how to architect scalable styles." },
  // ---------------- python ----------------
  { type: TECHNICAL, topic: "python", difficulty: JUNIOR, prompt: "Explain the difference between lists and tuples in Python." },
  { type: TECHNICAL, topic: "python", difficulty: MID, prompt: "What are decorators in Python? Provide a practical use case." },
  { type: TECHNICAL, topic: "python", difficulty: MID, prompt: "Explain generators and how they differ from returning a list." },
  { type: TECHNICAL, topic: "python", difficulty: SENIOR, prompt: "Explain the Global Interpreter Lock (GIL) and its impact on concurrency in Python." },
  // ---------------- arrays ----------------
  { type: CODING, topic: "arrays", difficulty: JUNIOR, prompt: "How would you find two numbers in an array that sum to a target value? Discuss time and space complexity." },
  { type: CODING, topic: "arrays", difficulty: MID, prompt: "Given an array, find the maximum subarray sum. Explain your approach and complexity." },
  { type: CODING, topic: "arrays", difficulty: MID, prompt: "How would you rotate an array by k positions in place?" },
  { type: CODING, topic: "arrays", difficulty: SENIOR, prompt: "Find the median of two sorted arrays in logarithmic time. Explain the algorithm." },
  // ---------------- strings ----------------
  { type: CODING, topic: "strings", difficulty: JUNIOR, prompt: "How would you check whether two strings are anagrams of each other?" },
  { type: CODING, topic: "strings", difficulty: MID, prompt: "Find the longest substring without repeating characters. Explain your approach." },
  { type: CODING, topic: "strings", difficulty: MID, prompt: "How would you validate whether a string is a palindrome, ignoring punctuation and case?" },
  { type: CODING, topic: "strings", difficulty: SENIOR, prompt: "Explain how to implement substring search efficiently (e.g., KMP) and when it beats naive search." },
  // ---------------- trees ----------------
  { type: CODING, topic: "trees", difficulty: MID, prompt: "Explain how you would validate if a binary tree is a valid binary search tree." },
  { type: CODING, topic: "trees", difficulty: JUNIOR, prompt: "How would you find the maximum depth of a binary tree?" },
  { type: CODING, topic: "trees", difficulty: MID, prompt: "Describe breadth-first traversal of a tree and a use case for it." },
  { type: CODING, topic: "trees", difficulty: SENIOR, prompt: "How would you find the lowest common ancestor of two nodes in a binary tree?" },
  // ---------------- graphs ----------------
  { type: CODING, topic: "graphs", difficulty: MID, prompt: "Explain how you would detect a cycle in a directed graph." },
  { type: CODING, topic: "graphs", difficulty: MID, prompt: "How would you find the shortest path in an unweighted graph? Discuss BFS." },
  { type: CODING, topic: "graphs", difficulty: SENIOR, prompt: "Describe Dijkstra's algorithm and why it fails with negative edge weights." },
  { type: CODING, topic: "graphs", difficulty: SENIOR, prompt: "How would you determine whether a graph is bipartite, and why does it matter?" },
  // ---------------- hashmaps ----------------
  { type: CODING, topic: "hashmaps", difficulty: JUNIOR, prompt: "How would you find the first non-repeating character in a string using a hash map?" },
  { type: CODING, topic: "hashmaps", difficulty: MID, prompt: "Explain how you would design a least-recently-used (LRU) cache." },
  { type: CODING, topic: "hashmaps", difficulty: MID, prompt: "How would you group a list of words into anagram buckets efficiently?" },
  { type: CODING, topic: "hashmaps", difficulty: SENIOR, prompt: "Explain hash collisions, load factor, and how a hash table achieves amortized O(1) lookups." },
  // ---------------- algorithms ----------------
  { type: CODING, topic: "algorithms", difficulty: JUNIOR, prompt: "Explain the difference between linear and binary search, including prerequisites." },
  { type: CODING, topic: "algorithms", difficulty: MID, prompt: "Describe how quicksort works and analyze its average versus worst-case complexity." },
  { type: CODING, topic: "algorithms", difficulty: MID, prompt: "Explain dynamic programming and solve the climbing stairs problem." },
  { type: CODING, topic: "algorithms", difficulty: SENIOR, prompt: "Compare greedy versus dynamic programming approaches, with an example where greedy fails." },
  // ---------------- recursion ----------------
  { type: CODING, topic: "recursion", difficulty: JUNIOR, prompt: "Explain what a base case is in recursion using a factorial example." },
  { type: CODING, topic: "recursion", difficulty: MID, prompt: "How would you generate all permutations of a string using backtracking?" },
  { type: CODING, topic: "recursion", difficulty: MID, prompt: "Explain memoization and how it can turn exponential recursion into polynomial time." },
  { type: CODING, topic: "recursion", difficulty: SENIOR, prompt: "Compare recursion and iteration for a deep computation. How do you prevent stack overflow?" },
  // ---------------- databases ----------------
  { type: TECHNICAL, topic: "databases", difficulty: JUNIOR, prompt: "What is an index in a database and how does it speed up queries?" },
  { type: TECHNICAL, topic: "databases", difficulty: MID, prompt: "When would you choose SQL vs NoSQL for a new product feature?" },
  { type: TECHNICAL, topic: "databases", difficulty: MID, prompt: "Explain database transactions and the ACID properties." },
  { type: TECHNICAL, topic: "databases", difficulty: SENIOR, prompt: "How would you design a schema and access pattern to avoid the N+1 query problem?" },
  // ---------------- sql ----------------
  { type: TECHNICAL, topic: "sql", difficulty: JUNIOR, prompt: "Explain the difference between INNER JOIN and LEFT JOIN with examples." },
  { type: TECHNICAL, topic: "sql", difficulty: MID, prompt: "Write a query to find the second highest salary in an employees table." },
  { type: TECHNICAL, topic: "sql", difficulty: MID, prompt: "Explain window functions and give a use case for each of ROW_NUMBER and RANK." },
  { type: TECHNICAL, topic: "sql", difficulty: SENIOR, prompt: "How would you diagnose and fix a slow query on a large table?" },
  // ---------------- caching ----------------
  { type: TECHNICAL, topic: "caching", difficulty: JUNIOR, prompt: "What is caching and what problem does it solve?" },
  { type: TECHNICAL, topic: "caching", difficulty: MID, prompt: "Explain cache invalidation strategies and the tradeoffs between them." },
  { type: TECHNICAL, topic: "caching", difficulty: MID, prompt: "Compare write-through, write-back, and write-around caching." },
  { type: TECHNICAL, topic: "caching", difficulty: SENIOR, prompt: "Describe a multi-layer caching architecture (CDN, application cache, database cache) and its consistency risks." },
  // ---------------- apis ----------------
  { type: TECHNICAL, topic: "apis", difficulty: JUNIOR, prompt: "Explain the difference between REST and GraphQL." },
  { type: TECHNICAL, topic: "apis", difficulty: MID, prompt: "How do you design an idempotent API endpoint for payments?" },
  { type: TECHNICAL, topic: "apis", difficulty: MID, prompt: "Explain common API versioning strategies and their tradeoffs." },
  { type: TECHNICAL, topic: "apis", difficulty: SENIOR, prompt: "How would you design rate limiting and backpressure for a public API?" },
  // ---------------- scalability ----------------
  { type: SYSTEM_DESIGN, topic: "scalability", difficulty: MID, prompt: "Design a URL shortener that handles 10k writes/sec. What are the key components and tradeoffs?" },
  { type: SYSTEM_DESIGN, topic: "scalability", difficulty: MID, prompt: "How would you scale a read-heavy application from one server to millions of users?" },
  { type: SYSTEM_DESIGN, topic: "scalability", difficulty: SENIOR, prompt: "Design a horizontally scalable notification service that delivers to millions of users." },
  { type: SYSTEM_DESIGN, topic: "scalability", difficulty: SENIOR, prompt: "Explain database sharding, partitioning strategies, and how to handle rebalancing." },
  // ---------------- security ----------------
  { type: TECHNICAL, topic: "security", difficulty: JUNIOR, prompt: "Explain the difference between authentication and authorization." },
  { type: TECHNICAL, topic: "security", difficulty: MID, prompt: "How do you prevent SQL injection and cross-site scripting in a web application?" },
  { type: TECHNICAL, topic: "security", difficulty: MID, prompt: "Explain how HTTPS and symmetric/asymmetric keys protect data in transit." },
  { type: TECHNICAL, topic: "security", difficulty: SENIOR, prompt: "Describe your approach to threat modeling and securely storing user credentials." },
  // ---------------- testing ----------------
  { type: TECHNICAL, topic: "testing", difficulty: JUNIOR, prompt: "Explain the difference between unit, integration, and end-to-end tests." },
  { type: TECHNICAL, topic: "testing", difficulty: MID, prompt: "What makes a good unit test, and how do you decide what to test?" },
  { type: TECHNICAL, topic: "testing", difficulty: MID, prompt: "How would you test asynchronous code and time-dependent logic reliably?" },
  { type: TECHNICAL, topic: "testing", difficulty: SENIOR, prompt: "How do you design a test strategy that stays fast while catching regressions at scale?" },
  // ---------------- performance ----------------
  { type: TECHNICAL, topic: "performance", difficulty: JUNIOR, prompt: "What are common causes of slow web page load times?" },
  { type: TECHNICAL, topic: "performance", difficulty: MID, prompt: "How would you profile and fix a memory leak in a long-running service?" },
  { type: TECHNICAL, topic: "performance", difficulty: MID, prompt: "Explain techniques for optimizing database-heavy workloads." },
  { type: TECHNICAL, topic: "performance", difficulty: SENIOR, prompt: "Describe how you would identify and eliminate a CPU bottleneck under production load." },
  // ---------------- concurrency ----------------
  { type: TECHNICAL, topic: "concurrency", difficulty: JUNIOR, prompt: "Explain the difference between concurrency and parallelism." },
  { type: TECHNICAL, topic: "concurrency", difficulty: MID, prompt: "What is a race condition and how do you prevent it?" },
  { type: TECHNICAL, topic: "concurrency", difficulty: MID, prompt: "Explain deadlock and the conditions required for it to occur." },
  { type: TECHNICAL, topic: "concurrency", difficulty: SENIOR, prompt: "Compare optimistic and pessimistic locking with real-world tradeoffs." },
];