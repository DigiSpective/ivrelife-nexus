import { AuthSession, User } from '@/types';

// Session storage keys
const SESSION_KEY = 'iv_relife_session';
const USER_KEY = 'iv_relife_user';
const LAST_ACTIVITY_KEY = 'iv_relife_last_activity';

// Session timeout in milliseconds (24 hours)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

// Activity timeout in milliseconds (30 minutes of inactivity)
const ACTIVITY_TIMEOUT = 30 * 60 * 1000;

// Flag to temporarily disable validation during authentication
let validationDisabled = false;

export class SessionManager {
  // Store session data
  static setSession(session: AuthSession): void {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(USER_KEY, JSON.stringify(session.user));
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      // Re-enable validation after successful session storage
      validationDisabled = false;
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  // Retrieve session data
  static getSession(): AuthSession | null {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      const userData = localStorage.getItem(USER_KEY);
      
      if (!sessionData || !userData) {
        return null;
      }

      const session: AuthSession = JSON.parse(sessionData);
      const user: User = JSON.parse(userData);

      // Check if session is expired
      if (this.isSessionExpired(session)) {
        this.clearSession();
        return null;
      }

      // Check for inactivity timeout
      if (this.isActivityExpired()) {
        this.clearSession();
        return null;
      }

      // Update last activity
      this.updateActivity();

      return { ...session, user };
    } catch (error) {
      console.error('Failed to retrieve session:', error);
      this.clearSession();
      return null;
    }
  }

  // Get current user from session
  static getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem(USER_KEY);
      if (!userData) {
        return null;
      }

      // Check if session is still valid
      const session = this.getSession();
      if (!session) {
        return null;
      }

      return JSON.parse(userData);
    } catch (error) {
      console.error('Failed to retrieve user:', error);
      return null;
    }
  }

  // Update user data in session
  static updateUser(user: User): void {
    try {
      const session = this.getSession();
      if (session) {
        const updatedSession = { ...session, user };
        this.setSession(updatedSession);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  }

  // Clear session data
  static clearSession(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  // Check if session is expired
  static isSessionExpired(session: AuthSession): boolean {
    const now = Date.now();
    return session.expires_at * 1000 < now;
  }

  // Check if user activity has expired
  static isActivityExpired(): boolean {
    try {
      const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (!lastActivity) {
        // If no activity is stored, check if we have a valid session first
        // This prevents false positives during login process
        const sessionData = localStorage.getItem(SESSION_KEY);
        if (sessionData) {
          // If we have session data but no activity, initialize activity
          this.updateActivity();
          return false;
        }
        return true;
      }

      const lastActivityTime = parseInt(lastActivity, 10);
      const now = Date.now();
      
      return (now - lastActivityTime) > ACTIVITY_TIMEOUT;
    } catch (error) {
      console.error('Failed to check activity expiration:', error);
      return true;
    }
  }

  // Update last activity timestamp
  static updateActivity(): void {
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  }

  // Get time until session expires
  static getTimeUntilExpiry(): number {
    const session = this.getSession();
    if (!session) {
      return 0;
    }

    const now = Date.now();
    const expiryTime = session.expires_at * 1000;
    
    return Math.max(0, expiryTime - now);
  }

  // Get time until activity timeout
  static getTimeUntilActivityTimeout(): number {
    try {
      const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (!lastActivity) {
        return 0;
      }

      const lastActivityTime = parseInt(lastActivity, 10);
      const now = Date.now();
      const timeoutAt = lastActivityTime + ACTIVITY_TIMEOUT;
      
      return Math.max(0, timeoutAt - now);
    } catch (error) {
      console.error('Failed to calculate activity timeout:', error);
      return 0;
    }
  }

  // Check if session exists and is valid
  static hasValidSession(): boolean {
    return this.getSession() !== null;
  }

  // Temporarily disable session validation (used during login)
  static disableValidation(): void {
    validationDisabled = true;
  }

  // Re-enable session validation
  static enableValidation(): void {
    validationDisabled = false;
  }

  // Check if validation is currently disabled
  static isValidationDisabled(): boolean {
    return validationDisabled;
  }

  // Refresh session (extend expiry)
  static refreshSession(newExpiresAt: number): boolean {
    try {
      const session = this.getSession();
      if (!session) {
        return false;
      }

      const refreshedSession = {
        ...session,
        expires_at: newExpiresAt
      };

      this.setSession(refreshedSession);
      return true;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      return false;
    }
  }

  // Initialize activity tracking
  static initActivityTracking(): () => void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const activityHandler = () => {
      this.updateActivity();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, activityHandler, true);
    });

    // Return cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, activityHandler, true);
      });
    };
  }

  // Check session validity periodically
  static startSessionMonitoring(onSessionExpired: () => void): () => void {
    const checkInterval = 60 * 1000; // Check every minute
    
    const intervalId = setInterval(() => {
      if (!this.hasValidSession()) {
        onSessionExpired();
      }
    }, checkInterval);

    // Return cleanup function
    return () => {
      clearInterval(intervalId);
    };
  }
}