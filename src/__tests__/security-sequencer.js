/**
 * Security Test Sequencer
 * 
 * Ensures security-critical tests run in the correct order and
 * manages test isolation for authentication system validation.
 */

const Sequencer = require('@jest/test-sequencer').default;

class SecurityTestSequencer extends Sequencer {
  sort(tests) {
    // Define test priority order (higher numbers run first)
    const testPriority = {
      'security.test': 1000,        // Core security tests - highest priority
      'auth-integration.test': 900, // Integration tests - second priority
      'setup.ts': 800,             // Setup tests
      'auth-provider.test': 700,   // Component tests
      'session-manager.test': 600, // Individual module tests
      'audit-logger.test': 500,    // Audit tests
      'server-actions.test': 400,  // Server action tests
      'supabase-auth.test': 300,   // Core auth function tests
    };

    return Array.from(tests).sort((testA, testB) => {
      const scoreA = this.getTestScore(testA.path, testPriority);
      const scoreB = this.getTestScore(testB.path, testPriority);
      
      // Higher scores run first
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      
      // If same priority, sort alphabetically
      return testA.path.localeCompare(testB.path);
    });
  }

  getTestScore(testPath, priorities) {
    // Find matching priority based on filename
    for (const [pattern, score] of Object.entries(priorities)) {
      if (testPath.includes(pattern)) {
        return score;
      }
    }
    
    // Default priority for unmatched tests
    return 100;
  }
}

module.exports = SecurityTestSequencer;