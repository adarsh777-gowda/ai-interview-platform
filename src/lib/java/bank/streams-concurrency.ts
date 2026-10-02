import type { JavaProblem } from "../types";

// Concurrency / streams questions aimed at mid-senior Java roles.
export const STREAMS_CONCURRENCY_PROBLEMS: JavaProblem[] = [
  {
    id: "thread-pool",
    title: "Fixed Thread Pool Task Processing",
    category: "streams-concurrency",
    difficulty: "HARD",
    companies: ["Amazon", "Uber", "Goldman Sachs", "Adobe"],
    tags: ["ExecutorService", "Concurrency", "Determinism"],
    prompt:
      "Read poolSize and taskCount. Build a fixed thread pool of poolSize threads that runs tasks 0 .. taskCount-1, where each task i reports i. Wait until every task finishes, then print all task ids ascending on one line separated by spaces. The output must be deterministic regardless of thread scheduling.",
    approach: [
      "Threads have no inherent order, so never print directly from workers if the judge is strict.",
      "Submit taskCount jobs and hold on to their Future objects in submission order.",
      "Calling get() on each Future in order both waits for completion and yields a deterministic order.",
      "Always shut the pool down, otherwise the JVM never exits and the run times out.",
    ],
    keyElements: [
      "Using Futures in submission order is what makes the output deterministic.",
      "poolSize only changes parallelism, not the printed result.",
      "shutdown() + awaitTermination() guarantees all work is flushed before exit.",
    ],
    pitfalls: [
      "Forgetting to shut down the ExecutorService, so the process hangs forever.",
      "Collecting results from a concurrent bag, producing a shuffled order.",
      "Swallowing exceptions from Future.get(), which hides a failed task.",
      "Creating raw new Thread() per task instead of reusing a pool.",
    ],
    examples: [
      { label: "Example 1", input: "2 5", expected: "0 1 2 3 4" },
      { label: "Example 2", input: "1 3", expected: "0 1 2" },
    ],
    hiddenTests: [
      { label: "Wide pool", input: "4 10", expected: "0 1 2 3 4 5 6 7 8 9", hidden: true },
      { label: "Single task", input: "3 1", expected: "0", hidden: true },
    ],
    starterCode: `import java.util.*;
import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        int poolSize = sc.nextInt();
        int taskCount = sc.nextInt();

        ExecutorService pool = Executors.newFixedThreadPool(poolSize);

        // TODO: submit taskCount Callable<Integer> jobs capturing id 0..taskCount-1,
        // keep their Futures in submission order, then get() each Future in that
        // order into a list. That list is already sorted 0..taskCount-1.
        // Print it space separated, then pool.shutdown() + awaitTermination.

        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);
    }
}`,
    editorial:
      "Submit each task as a Callable<Integer> and keep every Future in submission order. iterate the Futures calling get(), which blocks until the task is done and returns ids in exactly submission order. Finally shutdown() the pool and awaitTermination() so no non-daemon thread keeps the JVM alive. O(T) work, O(T) space, fully deterministic.",
    followUps: [
      "Now make the printed order match completion order instead of submission order.",
      "Bound concurrency with a Semaphore and explain why you would.",
      "What breaks if a task throws - how does Future.get() surface it?",
    ],
  },
  {
    id: "race-counter",
    title: "Fix the Race: Shared Counter",
    category: "streams-concurrency",
    difficulty: "MEDIUM",
    companies: ["Meta", "Amazon", "Bloomberg", "Swiggy"],
    tags: ["synchronized", "AtomicInteger", "Thread safety"],
    prompt:
      "Read threadCount and incrementsPerThread. Spawn that many threads, each incrementing a shared counter incrementsPerThread times. A naive `counter++` loses updates. Make the increments thread-safe, wait for every thread to finish, then print the final counter value.",
    approach: [
      "`counter++` is three operations (read, add, write); interleaving loses increments.",
      "Two accepted fixes: a synchronized block, or an AtomicInteger with incrementAndGet().",
      "You must join() every thread before printing, otherwise you read a partial count.",
      "The expected value is always threadCount * incrementsPerThread once it is safe.",
    ],
    keyElements: [
      "join() (or a CountDownLatch / ExecutorService) is what guarantees visibility of the final value.",
      "synchronized gives mutual exclusion but also establishes happens-before.",
      "AtomicInteger is lock-free and faster for a single counter.",
      "The correct answer is deterministic: threadCount * incrementsPerThread.",
    ],
    pitfalls: [
      "Synchronizing only the increment but reading the counter outside the lock.",
      "Printing before joining all threads.",
      "Calling join() inside the synchronized block, which serialises everything.",
      "Volatile alone: it fixes visibility, not the read-modify-write race.",
    ],
    examples: [
      { label: "Example 1", input: "4 1000", expected: "4000" },
      { label: "Example 2", input: "2 500", expected: "1000" },
    ],
    hiddenTests: [
      { label: "Minimal", input: "1 1", expected: "1", hidden: true },
      { label: "High contention", input: "8 10000", expected: "80000", hidden: true },
    ],
    starterCode: `import java.util.*;

public class Main {
    static int counter = 0; // NOT thread safe as written

    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        int threadCount = sc.nextInt();
        int inc = sc.nextInt();

        // TODO: create threadCount threads, each doing inc increments.
        // Protect the counter with either:
        //   synchronized (lock) { counter++; }
        //   or AtomicInteger.incrementAndGet()
        // Keep a list of threads, join() every one of them, then print counter.
    }
}`,
    editorial:
      "Replace counter++ inside a lock (synchronized (counterLock)) or make counter an AtomicInteger and use counter.incrementAndGet(). Store each Thread in a list, join() them all so their writes are visible, then print. Without the join the final read can be stale; without the lock the read-modify-write race loses increments.",
    followUps: [
      "Show that volatile alone still loses increments - walk through the interleaving.",
      "Time synchronized vs AtomicInteger under high contention.",
      "Replace threads with a parallel stream and discuss the same hazards.",
    ],
  },
];

