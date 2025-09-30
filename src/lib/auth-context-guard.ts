/**
 * Authentication Context Guard
 * Ensures data operations only happen when user context is available
 */

// Global auth state for coordinating between auth and data systems
let globalAuthState: {
  isReady: boolean;
  user: any | null;
  resolvers: Array<(user: any | null) => void>;
} = {
  isReady: false,
  user: null,
  resolvers: []
};

/**
 * Set the global auth state (called by AuthProvider)
 */
export function setGlobalAuthState(user: any | null, isReady: boolean = true) {
  console.log('🔐 Setting global auth state:', { userId: user?.id, isReady });
  globalAuthState.isReady = isReady;
  globalAuthState.user = user;
  
  // Resolve any pending waiters
  globalAuthState.resolvers.forEach(resolve => resolve(user));
  globalAuthState.resolvers = [];
}

/**
 * Wait for authentication to be ready before proceeding
 */
export function waitForAuth(): Promise<any | null> {
  return new Promise((resolve) => {
    if (globalAuthState.isReady) {
      console.log('🔐 Auth already ready, returning user:', globalAuthState.user?.id);
      resolve(globalAuthState.user);
    } else {
      console.log('🔐 Auth not ready, waiting...');
      globalAuthState.resolvers.push(resolve);
      
      // Timeout fallback after 15 seconds (much longer than before)
      setTimeout(() => {
        console.log('🔐 Auth wait timeout, proceeding without user');
        resolve(null);
      }, 15000);
    }
  });
}

/**
 * Get current auth state synchronously (if available)
 */
export function getCurrentAuth(): { isReady: boolean; user: any | null } {
  return {
    isReady: globalAuthState.isReady,
    user: globalAuthState.user
  };
}

/**
 * Check if we have a valid user context for data operations
 */
export function hasValidUserContext(): boolean {
  return globalAuthState.isReady && globalAuthState.user && globalAuthState.user.id;
}

/**
 * Get user ID if available, null otherwise
 */
export function getCurrentUserId(): string | null {
  return hasValidUserContext() ? globalAuthState.user.id : null;
}