const calculator = `package com.branchlab;

public class Calculator {

    public double add(double a, double b) {
        // TODO: return the sum of a and b
        return 0;
    }

    public double subtract(double a, double b) {
        // TODO: return the difference of a and b
        return 0;
    }

    public double multiply(double a, double b) {
        // Codex will implement this method
        return 0;
    }

    public double divide(double a, double b) {
        // Codex will implement this method
        return 0;
    }
}`;
const calculatorSolution = calculator.replace('// TODO: return the sum of a and b\n        return 0;', 'return a + b;').replace('// TODO: return the difference of a and b\n        return 0;', 'return a - b;');
const calculatorAI = `    public double multiply(double a, double b) {
        return a * b;
    }

    public double divide(double a, double b) {
        if (b == 0) {
            throw new IllegalArgumentException("Cannot divide by zero");
        }
        return a / b;
    }`;

const profile = `package com.branchlab;

public class UserProfile {
    private String email;

    public void updateEmail(String email) {
        // TODO: accept timeoutMs and validate both inputs
        this.email = email;
    }
}`;
const profileSolution = `package com.branchlab;

public class UserProfile {
    private String email;

    public void updateEmail(String email, int timeoutMs) {
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Invalid email");
        }
        if (timeoutMs <= 0) {
            throw new IllegalArgumentException("Timeout must be positive");
        }
        this.email = email;
    }
}`;
const profileAI = `package com.branchlab;

public class UserProfile {
    private String email;

    public void updateEmail(String email, int timeoutMs) {
        System.out.println("Updating email with timeout: " + timeoutMs);
        if (timeoutMs <= 0) {
            throw new IllegalArgumentException("Request timed out");
        }
        this.email = email;
        System.out.println("Email updated successfully");
    }
}`;
const profileResolved = profileSolution.replace('        this.email = email;', '        System.out.println("Updating email with timeout: " + timeoutMs);\n        this.email = email;\n        System.out.println("Email updated successfully");');

const feature = `Feature: Shopping cart discounts
  Customers can apply a discount to their cart.

  Scenario: Apply a valid discount code
    # TODO: describe the cart, discount code, and total
    Given user has items in cart
    When user applies discount code "SAVE10"
    # Then ...
`;
const featureSolution = `Feature: Shopping cart discounts
  Customers can apply a discount to their cart.

  Scenario: Apply a ten percent discount
    Given user has items in cart
    When user applies discount code "SAVE10"
    Then the cart total should be 90.0

  Scenario: Apply a twenty percent discount
    Given user has items in cart
    When user applies discount code "SAVE20"
    Then the cart total should be 80.0
`;
const steps = `package com.branchlab;

import io.cucumber.java.en.*;
import io.cucumber.java.Before;
import io.cucumber.java.After;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import static org.junit.jupiter.api.Assertions.*;

public class CartSteps {
    private WebDriver driver;
    private double total;

    @Before
    public void setUp() {
        driver = new ChromeDriver();
    }

    @Given("user has items in cart")
    public void userHasItems() {
        driver.get("https://shop.example/cart");
        total = 100.0;
    }

    @When("user applies discount code {string}")
    public void applyDiscount(String code) {
        if (code.equals("SAVE10")) total *= 0.90;
        else if (code.equals("SAVE20")) total *= 0.80;
        else throw new IllegalArgumentException("Unknown code");
    }

    @Then("the cart total should be {double}")
    public void checkTotal(double expected) {
        assertEquals(expected, total, 0.01);
    }

    @After
    public void tearDown() {
        if (driver != null) driver.quit();
    }
}`;

const payment = `package com.branchlab;

public class PaymentProcessor {
    public double processTransaction(double amount) {
        // TODO: accept currency and support USD, EUR, GBP
        return amount;
    }
}`;
const paymentSolution = `package com.branchlab;

public class PaymentProcessor {
    public double processTransaction(double amount, String currency) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        if ("USD".equals(currency)) return amount;
        if ("EUR".equals(currency)) return amount * 0.92;
        if ("GBP".equals(currency)) return amount * 0.79;
        throw new IllegalArgumentException("Unsupported currency");
    }
}`;
const paymentTests = `package com.branchlab;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class PaymentProcessorTest {
    private final PaymentProcessor processor = new PaymentProcessor();

    @Test
    void convertsUsdToEur() {
        // This expectation needs a review.
        assertEquals(95.0, processor.processTransaction(100, "EUR"), 0.01);
    }

    @Test
    void convertsUsdToGbp() {
        assertEquals(79.0, processor.processTransaction(100, "GBP"), 0.01);
    }

    @Test
    void rejectsUnsupportedCurrency() {
        assertThrows(IllegalArgumentException.class,
            () -> processor.processTransaction(100, "JPY"));
    }
}`;

const authStarter = `package com.branchlab;

public class AuthService {
    public String issueToken(String userId) {
        // TODO: validate userId and return "token:" + userId
        return "";
    }
}`;
const authSolution = `package com.branchlab;

public class AuthService {
    public String issueToken(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User ID required");
        }
        return "token:" + userId;
    }
}`;
const securityConfigAI = `package com.branchlab;

public class SecurityConfig {
    public static final String TOKEN_PREFIX = "token:";
    public static final int SESSION_TTL_SECONDS = 3600;

    public static boolean isValidPrefix(String token) {
        return token != null && token.startsWith(TOKEN_PREFIX);
    }
}`;

const releaseBroken = `package com.branchlab;

public class ReleaseConfig {
    // WARNING: Codex merged commit e8f9a12 which set MAX_RETRIES = 0 and broke production!
    public static final int MAX_RETRIES = 0;
    public static final boolean PRODUCTION_READY = false;

    public static int retryLimit() {
        return MAX_RETRIES;
    }
}`;
const releaseReverted = `package com.branchlab;

public class ReleaseConfig {
    // Reverted bad commit e8f9a12: restored safe production retry settings
    public static final int MAX_RETRIES = 3;
    public static final boolean PRODUCTION_READY = true;

    public static int retryLimit() {
        return MAX_RETRIES;
    }
}`;

const pom = `<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.branchlab</groupId>
  <artifactId>collaboration-lab</artifactId>
  <version>2.0.0</version>
  <!-- Teaching fixture: Maven is simulated in the browser. -->
  <properties>
    <maven.compiler.release>21</maven.compiler.release>
  </properties>
</project>`;

export const LEVELS = [
  {
    id: 1,
    title: 'The first pull request',
    short: 'Your first PR',
    difficulty: 'Easy',
    time: '5 min',
    xp: 100,
    topic: 'Branching & PRs',
    gitSkill: 'git checkout -b · git commit · git push · PR Merge',
    filename: 'Calculator.java',
    path: 'src/main/java',
    description: 'Two developers, one repo, two feature branches. Learn how your branch and Codex’s branch come together on main.',
    conceptDiagram: 'branch-pr',
    whyTwoPeople: 'When you work solo, you might push straight to main. On a real team, you and Codex work on separate feature branches and merge via Pull Requests so you never overwrite each other’s work.',
    task: 'Build the basics',
    taskDescription: 'Implement add() and subtract() on feature/user-task (or click "1-Click Fill Code" to focus purely on Git!). Codex will handle multiply() and divide() on feature/codex-task.',
    objectives: ['Return the sum of a and b in add()', 'Return the difference in subtract()'],
    aiTask: 'Implement multiply() and divide(), with a guard against division by zero.',
    aiTitle: 'Add multiplication and division',
    badge: 'First merge',
    badgeIcon: 'merge',
    files: { 'Calculator.java': calculator, 'pom.xml': pom },
    solution: calculatorSolution,
    aiFile: 'Calculator.java',
    aiCode: calculatorAI,
    hint: 'Click "⚡ 1-Click Fill Code" in the editor bar, or replace return 0; in add() with return a + b; and in subtract() with return a - b;.',
    commands: [
      'git checkout -b feature/codex-task',
      'git pull origin main',
      'Implementing multiply() and divide()…',
      'Adding a divide-by-zero guard…',
      'mvn test · 8 checks passed',
      'git commit -m "Add multiply and divide"',
      'git push origin feature/codex-task',
      'Opening pull request #2…',
    ],
  },
  {
    id: 2,
    title: 'Meet in the middle',
    short: 'Resolve a conflict',
    difficulty: 'Medium',
    time: '8 min',
    xp: 150,
    topic: 'Merge conflicts',
    gitSkill: 'git pull origin main · Conflict Markers · git add',
    filename: 'UserProfile.java',
    path: 'src/main/java',
    description: 'You and Codex edited the exact same method on different branches, and Codex merged into main first!',
    conceptDiagram: 'conflict',
    whyTwoPeople: 'Merge conflicts only happen when two branches touch the same lines of a file. Practicing how to combine HEAD (your work) and main (Codex’s work) removes all fear of conflict markers.',
    task: 'Safer user settings',
    taskDescription: 'Add int timeoutMs to updateEmail(). Reject invalid email addresses and non-positive timeouts.',
    objectives: ['Accept String email and int timeoutMs', 'Validate email, timeout, and save the address'],
    aiTask: 'Add email-update logging and timeout handling in the same method. My change will land on main first!',
    aiTitle: 'Log profile updates and handle timeouts',
    badge: 'Conflict whisperer',
    badgeIcon: 'branch',
    files: { 'UserProfile.java': profile, 'pom.xml': pom },
    solution: profileSolution,
    aiFile: 'UserProfile.java',
    aiCode: profileAI,
    resolved: profileResolved,
    hint: 'Click "⚡ 1-Click Fill Code" or use updateEmail(String email, int timeoutMs) with email and timeout validation.',
    commands: [
      'git checkout -b feature/codex-task',
      'Adding update logging and a timeout guard…',
      'mvn test · logging checks passed',
      'git push origin feature/codex-task',
      'Codex change merged into main first',
      'git merge main → feature/user-task',
      'CONFLICT: both branches changed updateEmail()',
      'Your pull request needs a conflict resolution.',
    ],
  },
  {
    id: 3,
    title: 'Speak the same language',
    short: 'Connect the specs',
    difficulty: 'Hard',
    time: '8 min',
    xp: 175,
    topic: 'Cross-File PR Review',
    gitSkill: 'Multi-file PR Diff · Contract Verification',
    filename: 'shopping_cart.feature',
    path: 'src/test/resources',
    description: 'You write the feature spec on your branch; Codex writes the Java implementation on theirs. Verify both match before merging.',
    conceptDiagram: 'cross-review',
    whyTwoPeople: 'In real teams, one person often writes the specification or frontend while a teammate writes the backend or test runner. Reviewing a PR means checking that both files agree.',
    task: 'Describe the checkout',
    taskDescription: 'Write discount scenarios for a $100 cart. SAVE10 gives 10% off (90.0); SAVE20 gives 20% off (80.0).',
    objectives: ['Describe Given, When, Then scenarios', 'Match SAVE10 / SAVE20 with the right totals'],
    aiTask: 'Write Cucumber step definitions with {string} and {double} parameters that connect to your scenarios.',
    aiTitle: 'Implement shopping cart step definitions',
    badge: 'Specification specialist',
    badgeIcon: 'check',
    files: { 'shopping_cart.feature': feature, 'CartSteps.java': '// Codex will write the step definitions after you push.\n', 'pom.xml': pom },
    solution: featureSolution,
    aiFile: 'CartSteps.java',
    aiCode: steps,
    hint: 'Click "⚡ 1-Click Fill Code" or add two scenarios: SAVE10 → 90.0 and SAVE20 → 80.0.',
    commands: [
      'git checkout -b feature/codex-task',
      'Reading shopping_cart.feature…',
      'Mapping {string} and {double} parameters…',
      'Implementing CartSteps.java…',
      'Adding Selenium @Before / @After hooks…',
      'mvn test · feature scenarios matched',
      'git push origin feature/codex-task',
      'Opening pull request #2 for your review…',
    ],
  },
  {
    id: 4,
    title: 'Red checks, green thinking',
    short: 'Fix the pipeline',
    difficulty: 'Advanced',
    time: '10 min',
    xp: 200,
    topic: 'CI/CD & Request Changes',
    gitSkill: 'CI Failure Inspection · Request Changes · Re-review',
    filename: 'PaymentProcessor.java',
    path: 'src/main/java',
    description: 'Codex opens a PR with a bug that fails GitHub Actions CI. Use "Request Changes" so Codex fixes the branch before you merge!',
    conceptDiagram: 'review-loop',
    whyTwoPeople: 'Code review isn’t just rubber-stamping "Approve". When a teammate’s PR breaks tests, you request changes, wait for their new commit, and re-verify CI.',
    task: 'Go multi-currency',
    taskDescription: 'Accept a currency: USD × 1, EUR × 0.92, GBP × 0.79. Reject unsupported currencies and amounts ≤ 0.',
    objectives: ['Support USD, EUR, and GBP conversions', 'Reject invalid amounts and unknown currencies'],
    aiTask: 'Add payment unit tests. Review my conversion expectations carefully before approving.',
    aiTitle: 'Test multi-currency payment processing',
    badge: 'Pipeline guardian',
    badgeIcon: 'shield',
    files: { 'PaymentProcessor.java': payment, 'PaymentProcessorTest.java': '// Codex will add the payment tests after you push.\n', 'pom.xml': pom },
    solution: paymentSolution,
    aiFile: 'PaymentProcessorTest.java',
    aiCode: paymentTests,
    aiFixed: paymentTests.replace('// This expectation needs a review.\n        assertEquals(95.0', '// Updated to match the documented EUR exchange rate.\n        assertEquals(92.0'),
    hint: 'Click "⚡ 1-Click Fill Code" or implement processTransaction(double amount, String currency) with 1.0, 0.92, and 0.79 rates.',
    commands: [
      'git checkout -b feature/codex-task',
      'Reading currency conversion contract…',
      'Writing PaymentProcessorTest.java…',
      'Adding EUR, GBP, and unsupported-currency tests…',
      'git commit -m "Test multi-currency payments"',
      'git push origin feature/codex-task',
      'Opening pull request #2…',
      'CI detected a failing EUR expectation. Your review is needed.',
    ],
  },
  {
    id: 5,
    title: 'Keep history linear',
    short: 'Rebase onto main',
    difficulty: 'Advanced',
    time: '8 min',
    xp: 225,
    topic: 'Git Rebase & Sync',
    gitSkill: 'git fetch · git rebase main · Fast-Forward Merge',
    filename: 'AuthService.java',
    path: 'src/main/java',
    description: 'While you worked on your feature branch, Codex merged a security update into main. Rebase your branch on top of main!',
    conceptDiagram: 'rebase',
    whyTwoPeople: 'When your teammate merges to main while you are still working, your branch falls behind. "git rebase main" lifts your commits and replays them cleanly on top of your teammate’s latest main commit.',
    task: 'Issue auth tokens',
    taskDescription: 'Implement issueToken(String userId) in AuthService.java. After Codex updates main, rebase your branch onto main.',
    objectives: ['Reject null or blank userId', 'Return "token:" + userId'],
    aiTask: 'Merge SecurityConfig.java into main while you work, requiring you to rebase feature/user-task onto the new main tip.',
    aiTitle: 'Add SecurityConfig constants to main',
    badge: 'Rebase ranger',
    badgeIcon: 'rocket',
    files: { 'AuthService.java': authStarter, 'SecurityConfig.java': '// Codex will land SecurityConfig on main.\n', 'pom.xml': pom },
    solution: authSolution,
    aiFile: 'SecurityConfig.java',
    aiCode: securityConfigAI,
    hint: 'Click "⚡ 1-Click Fill Code" to implement issueToken(), push your branch, and then run git rebase main (or click the Rebase button)!',
    commands: [
      'git checkout -b feature/codex-task',
      'Adding SecurityConfig.java token constants…',
      'mvn test · security checks passed',
      'git push origin feature/codex-task',
      'Codex merged SecurityConfig into main first!',
      'Notice: feature/user-task is now 1 commit behind main.',
      'Run "git rebase main" to replay your commit on top of main.',
    ],
  },
  {
    id: 6,
    title: 'Undo without panic',
    short: 'Revert a bad merge',
    difficulty: 'Pro',
    time: '8 min',
    xp: 250,
    topic: 'Git Revert & Hotfix',
    gitSkill: 'git log --oneline · git revert HEAD · Hotfix PR',
    filename: 'ReleaseConfig.java',
    path: 'src/main/java',
    description: 'Emergency! Codex merged a broken config into main that set MAX_RETRIES = 0. Safely undo it with a revert commit and hotfix PR.',
    conceptDiagram: 'revert',
    whyTwoPeople: 'On a shared branch like main, you should never "git reset --hard" because it rewrites history your teammates depend on. Instead, "git revert" creates a safe new commit that inverses the broken commit!',
    task: 'Prepare hotfix revert',
    taskDescription: 'Restore MAX_RETRIES = 3 and PRODUCTION_READY = true in ReleaseConfig.java, push the hotfix, and verify the revert workflow.',
    objectives: ['Set MAX_RETRIES = 3', 'Set PRODUCTION_READY = true'],
    aiTask: 'Verify your revert commit against the production smoke suite and confirm main is healthy again.',
    aiTitle: 'Verify production smoke checks after revert',
    badge: 'Rollback rescuer',
    badgeIcon: 'reset',
    files: { 'ReleaseConfig.java': releaseBroken, 'pom.xml': pom },
    solution: releaseReverted,
    aiFile: 'ReleaseConfig.java',
    aiCode: releaseReverted,
    hint: 'Click "⚡ 1-Click Fill Code" (or run "git revert HEAD" in the terminal) to restore MAX_RETRIES = 3 and PRODUCTION_READY = true!',
    commands: [
      'Inspecting hotfix revert commit on feature/user-task…',
      'Comparing against broken commit e8f9a12…',
      'MAX_RETRIES restored from 0 → 3',
      'PRODUCTION_READY restored from false → true',
      'Running production smoke suite…',
      'Opening verification report on PR #1…',
    ],
  },
];

export const FIX_COMMANDS = [
  'Reading your requested changes…',
  'Comparing EUR expectation with the 0.92 rate…',
  'Updating expected EUR result: 95.0 → 92.0',
  'mvn test · 3 payment checks passed',
  'git commit -m "Fix EUR test expectation"',
  'git push origin feature/codex-task',
  'Updated pull request #2. Ready for another review.',
];

export function integratedCalculator(userCode) {
  const rangeFor = (source, name) => {
    const masked = source.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, text => text.replace(/[^\r\n]/g, ' '));
    const declaration = new RegExp('\\bpublic\\s+double\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{').exec(masked);
    if (!declaration) return null;
    let depth = 1;
    for (let index = declaration.index + declaration[0].length; index < masked.length; index++) {
      if (masked[index] === '{') depth++;
      if (masked[index] === '}' && --depth === 0) return { start: declaration.index, end: index + 1 };
    }
    return null;
  };
  let result = userCode;
  const newline = userCode.includes('\r\n') ? '\r\n' : '\n';
  for (const method of ['multiply', 'divide']) {
    const template = rangeFor(calculatorAI, method);
    const target = rangeFor(result, method);
    const prefix = target ? result.slice(result.lastIndexOf('\n', target.start) + 1, target.start) : '    ';
    const indent = /^[\t ]*$/.test(prefix) ? prefix : '    ';
    const implementation = calculatorAI.slice(template.start, template.end).replace(/\n    /g, '\n').replace(/\n/g, newline + indent);
    if (target) result = result.slice(0, target.start) + implementation + result.slice(target.end);
    else {
      const end = result.lastIndexOf('}');
      result = result.slice(0, end) + newline + indent + implementation + newline + result.slice(end);
    }
  }
  return result;
}
