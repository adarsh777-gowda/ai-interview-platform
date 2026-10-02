// Known-good reference implementations for every problem in the bank.
//
// Two jobs:
//  1. Served by /api/java/solution so a player can compare their code with a
//     complete, working answer after revealing the editorial.
//  2. Run by `verify-bank.test.ts` through the real javac/java pipeline to prove
//     every `expected` value in the bank is actually correct.
//
// Server-only: never import this from a client component (it is ~9 KB).
export const REFERENCE: Record<string, string> = {
  "two-sum-indices": `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < n; i++) {
            int need = target - nums[i];
            if (seen.containsKey(need)) {
                int a = Math.min(seen.get(need), i);
                int b = Math.max(seen.get(need), i);
                System.out.println(a + " " + b);
                return;
            }
            seen.put(nums[i], i);
        }
    }
}`,
  "group-anagrams": `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        Map<String, List<String>> groups = new HashMap<>();
        for (int i = 0; i < n; i++) {
            String w = sc.next();
            char[] c = w.toCharArray();
            Arrays.sort(c);
            groups.computeIfAbsent(new String(c), k -> new ArrayList<>()).add(w);
        }
        List<List<String>> lines = new ArrayList<>();
        for (List<String> g : groups.values()) {
            Collections.sort(g);
            lines.add(g);
        }
        lines.sort(Comparator.comparing(g -> g.get(0)));
        StringBuilder sb = new StringBuilder();
        for (List<String> g : lines) {
            if (sb.length() > 0) sb.append('\\n');
            sb.append(String.join(" ", g));
        }
        System.out.println(sb);
    }
}`,
  "product-except-self": `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        long[] nums = new long[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextLong();
        long[] out = new long[n];
        long left = 1;
        for (int i = 0; i < n; i++) { out[i] = left; left *= nums[i]; }
        long right = 1;
        for (int i = n - 1; i >= 0; i--) { out[i] *= right; right *= nums[i]; }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) { if (i > 0) sb.append(' '); sb.append(out[i]); }
        System.out.println(sb);
    }
}`,
  "subarray-sum-k": `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int k = sc.nextInt();
        Map<Integer, Integer> seen = new HashMap<>();
        seen.put(0, 1);
        int sum = 0;
        long count = 0;
        for (int x : nums) {
            sum += x;
            count += seen.getOrDefault(sum - k, 0);
            seen.put(sum, seen.getOrDefault(sum, 0) + 1);
        }
        System.out.println(count);
    }
}`,
  "top-k-frequent": `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int k = sc.nextInt();
        Map<Integer, Integer> freq = new HashMap<>();
        for (int x : nums) freq.put(x, freq.getOrDefault(x, 0) + 1);
        List<Map.Entry<Integer, Integer>> list = new ArrayList<>(freq.entrySet());
        list.sort((a, b) -> b.getValue() != a.getValue()
            ? b.getValue() - a.getValue()
            : a.getKey() - b.getKey());
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < k; i++) { if (i > 0) sb.append(' '); sb.append(list.get(i).getKey()); }
        System.out.println(sb);
    }
}`,
  "valid-parentheses": `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine().trim() : "";
        Deque<Character> st = new ArrayDeque<>();
        boolean ok = true;
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') { st.push(c); continue; }
            if (st.isEmpty()) { ok = false; break; }
            char t = st.pop();
            if ((c == ')' && t != '(') || (c == ']' && t != '[') || (c == '}' && t != '{')) {
                ok = false;
                break;
            }
        }
        if (ok && !st.isEmpty()) ok = false;
        System.out.println(ok);
    }
}`,
  "longest-substring": `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine().trim() : "";
        Map<Character, Integer> last = new HashMap<>();
        int left = 0, best = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (last.containsKey(c)) left = Math.max(left, last.get(c) + 1);
            last.put(c, right);
            best = Math.max(best, right - left + 1);
        }
        System.out.println(best);
    }
}`,
  "container-most-water": `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] h = new int[n];
        for (int i = 0; i < n; i++) h[i] = sc.nextInt();
        int l = 0, r = n - 1;
        long best = 0;
        while (l < r) {
            long area = (long) Math.min(h[l], h[r]) * (r - l);
            if (area > best) best = area;
            if (h[l] < h[r]) l++; else r--;
        }
        System.out.println(best);
    }
}`,
  "daily-temperatures": `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] t = new int[n];
        for (int i = 0; i < n; i++) t[i] = sc.nextInt();
        int[] ans = new int[n];
        Deque<Integer> st = new ArrayDeque<>();
        for (int i = 0; i < n; i++) {
            while (!st.isEmpty() && t[st.peek()] < t[i]) {
                int j = st.pop();
                ans[j] = i - j;
            }
            st.push(i);
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) { if (i > 0) sb.append(' '); sb.append(ans[i]); }
        System.out.println(sb);
    }
}`,
  "kth-largest": `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int k = sc.nextInt();
        PriorityQueue<Integer> pq = new PriorityQueue<>();
        for (int x : nums) {
            pq.offer(x);
            if (pq.size() > k) pq.poll();
        }
        System.out.println(pq.peek());
    }
}`,
  "search-rotated": `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = sc.nextInt();
        int target = sc.nextInt();
        int lo = 0, hi = n - 1, ans = -1;
        while (lo <= hi) {
            int mid = (lo + hi) >>> 1;
            if (a[mid] == target) { ans = mid; break; }
            if (a[lo] <= a[mid]) {
                if (a[lo] <= target && target < a[mid]) hi = mid - 1; else lo = mid + 1;
            } else {
                if (a[mid] < target && target <= a[hi]) lo = mid + 1; else hi = mid - 1;
            }
        }
        System.out.println(ans);
    }
}`,
  "climbing-stairs": `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        long a = 1, b = 1;
        for (int i = 2; i <= n; i++) { long c = a + b; a = b; b = c; }
        System.out.println(b);
    }
}`,
  "coin-change": `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] coins = new int[n];
        for (int i = 0; i < n; i++) coins[i] = sc.nextInt();
        int amount = sc.nextInt();
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);
        dp[0] = 0;
        for (int x = 1; x <= amount; x++) {
            for (int c : coins) {
                if (x >= c) dp[x] = Math.min(dp[x], dp[x - c] + 1);
            }
        }
        System.out.println(dp[amount] > amount ? -1 : dp[amount]);
    }
}`,
  "number-of-islands": `import java.util.*;

public class Main {
    static void dfs(char[][] g, int r, int c) {
        if (r < 0 || c < 0 || r >= g.length || c >= g[0].length || g[r][c] != '1') return;
        g[r][c] = '0';
        dfs(g, r + 1, c);
        dfs(g, r - 1, c);
        dfs(g, r, c + 1);
        dfs(g, r, c - 1);
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int rows = sc.nextInt(), cols = sc.nextInt();
        char[][] g = new char[rows][cols];
        for (int r = 0; r < rows; r++) g[r] = sc.next().toCharArray();
        int count = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (g[r][c] == '1') { count++; dfs(g, r, c); }
            }
        }
        System.out.println(count);
    }
}`,
  "lru-cache": `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int capacity = sc.nextInt();
        int q = sc.nextInt();
        LinkedHashMap<Integer, Integer> cache =
            new LinkedHashMap<Integer, Integer>(16, 0.75f, true) {
                protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
                    return size() > capacity;
                }
            };
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < q; i++) {
            String op = sc.next();
            if (op.equals("PUT")) {
                int k = sc.nextInt(), v = sc.nextInt();
                cache.put(k, v);
            } else {
                int k = sc.nextInt();
                Integer v = cache.get(k);
                if (sb.length() > 0) sb.append(' ');
                sb.append(v == null ? -1 : v);
            }
        }
        System.out.println(sb);
    }
}`,
  "rate-limiter": `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int capacity = sc.nextInt();
        int refillPerSec = sc.nextInt();
        int q = sc.nextInt();
        int tokens = capacity;
        long lastMs = 0;
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < q; i++) {
            int need = sc.nextInt();
            long now = sc.nextLong();
            long refill = ((now - lastMs) * refillPerSec) / 1000;
            tokens = (int) Math.min(capacity, (long) tokens + refill);
            lastMs = now;
            boolean grant = tokens >= need;
            if (grant) tokens -= need;
            if (sb.length() > 0) sb.append('\\n');
            sb.append(grant ? "true" : "false");
        }
        System.out.println(sb);
    }
}`,
  "thread-pool": `import java.util.*;
import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        int poolSize = sc.nextInt();
        int taskCount = sc.nextInt();
        ExecutorService pool = Executors.newFixedThreadPool(poolSize);
        List<Future<Integer>> futures = new ArrayList<>();
        for (int i = 0; i < taskCount; i++) {
            final int id = i;
            futures.add(pool.submit(() -> id));
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < futures.size(); i++) {
            if (i > 0) sb.append(' ');
            sb.append(futures.get(i).get());
        }
        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);
        System.out.println(sb);
    }
}`,
  "race-counter": `import java.util.*;

public class Main {
    static int counter = 0;
    static final Object lock = new Object();

    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        int threads = sc.nextInt();
        int inc = sc.nextInt();
        List<Thread> list = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            Thread t = new Thread(() -> {
                for (int j = 0; j < inc; j++) {
                    synchronized (lock) { counter++; }
                }
            });
            list.add(t);
            t.start();
        }
        for (Thread t : list) t.join();
        System.out.println(counter);
    }
}`,
};


