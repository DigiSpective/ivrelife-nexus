/**
 * Device Fingerprinting and Risk Assessment
 * 
 * Advanced security features for device identification and risk-based authentication including:
 * - Browser fingerprinting for device identification
 * - Risk score calculation based on device and behavioral patterns
 * - Anomaly detection for suspicious activities
 * - Device trust management and persistent identification
 */

import { createAuditLogger } from './audit-logger';

export interface DeviceFingerprint {
  device_id: string;
  user_agent: string;
  screen_resolution: string;
  timezone: string;
  language: string;
  platform: string;
  canvas_fingerprint: string;
  webgl_fingerprint: string;
  audio_fingerprint: string;
  font_fingerprint: string;
  plugin_fingerprint: string;
  storage_fingerprint: string;
  network_fingerprint: string;
  hardware_fingerprint: string;
  behavior_fingerprint: string;
  fingerprint_hash: string;
  confidence_score: number;
  created_at: Date;
  last_seen_at: Date;
}

export interface RiskAssessment {
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: string[];
  device_trust_score: number;
  behavioral_score: number;
  environmental_score: number;
  recommendation: 'allow' | 'challenge' | 'block';
  confidence: number;
}

export interface DeviceContext {
  ip_address: string;
  user_agent: string;
  fingerprint: DeviceFingerprint;
  geolocation?: {
    country: string;
    region: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  session_data: {
    session_duration: number;
    page_views: number;
    interactions: number;
    typing_patterns?: number[];
    mouse_patterns?: Array<{ x: number; y: number; timestamp: number }>;
  };
}

export class DeviceFingerprinter {
  private auditLogger: ReturnType<typeof createAuditLogger>;
  private fingerprintCache = new Map<string, DeviceFingerprint>();

  constructor(ip_address?: string, user_agent?: string) {
    this.auditLogger = createAuditLogger(ip_address, user_agent);
  }

  /**
   * Generate comprehensive device fingerprint
   */
  async generateFingerprint(): Promise<DeviceFingerprint> {
    try {
      const fingerprints = await Promise.all([
        this.getBrowserFingerprint(),
        this.getCanvasFingerprint(),
        this.getWebGLFingerprint(),
        this.getAudioFingerprint(),
        this.getFontFingerprint(),
        this.getPluginFingerprint(),
        this.getStorageFingerprint(),
        this.getNetworkFingerprint(),
        this.getHardwareFingerprint(),
        this.getBehaviorFingerprint()
      ]);

      const combinedFingerprint = fingerprints.join('|');
      const fingerprintHash = await this.hashFingerprint(combinedFingerprint);
      
      const deviceFingerprint: DeviceFingerprint = {
        device_id: fingerprintHash,
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        canvas_fingerprint: fingerprints[1],
        webgl_fingerprint: fingerprints[2],
        audio_fingerprint: fingerprints[3],
        font_fingerprint: fingerprints[4],
        plugin_fingerprint: fingerprints[5],
        storage_fingerprint: fingerprints[6],
        network_fingerprint: fingerprints[7],
        hardware_fingerprint: fingerprints[8],
        behavior_fingerprint: fingerprints[9],
        fingerprint_hash: fingerprintHash,
        confidence_score: this.calculateConfidenceScore(fingerprints),
        created_at: new Date(),
        last_seen_at: new Date()
      };

      // Cache the fingerprint
      this.fingerprintCache.set(fingerprintHash, deviceFingerprint);

      await this.auditLogger.logEvent('device.fingerprint_generated', 'success', {
        device_id: fingerprintHash,
        confidence_score: deviceFingerprint.confidence_score,
        fingerprint_methods: fingerprints.length
      });

      return deviceFingerprint;

    } catch (error) {
      await this.auditLogger.logEvent('device.fingerprint_failed', 'error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Assess risk based on device and context
   */
  async assessRisk(
    userId: string,
    deviceContext: DeviceContext,
    action: string
  ): Promise<RiskAssessment> {
    try {
      const riskFactors: string[] = [];
      let riskScore = 0;

      // Device trust assessment
      const deviceTrustScore = await this.assessDeviceTrust(deviceContext.fingerprint, userId);
      riskScore += (1 - deviceTrustScore) * 30; // Up to 30 points for unknown device

      if (deviceTrustScore < 0.5) {
        riskFactors.push('unknown_device');
      }

      // Behavioral analysis
      const behaviorScore = this.assessBehaviorPatterns(deviceContext.session_data);
      riskScore += (1 - behaviorScore) * 25; // Up to 25 points for suspicious behavior

      if (behaviorScore < 0.6) {
        riskFactors.push('suspicious_behavior');
      }

      // Environmental factors
      const environmentScore = await this.assessEnvironmentalFactors(deviceContext);
      riskScore += (1 - environmentScore) * 20; // Up to 20 points for environmental risks

      if (environmentScore < 0.7) {
        riskFactors.push('environmental_anomaly');
      }

      // Action-specific risk
      const actionRisk = this.getActionRisk(action);
      riskScore += actionRisk;

      if (actionRisk > 15) {
        riskFactors.push('high_risk_action');
      }

      // Time-based analysis
      const timeRisk = this.assessTimeBasedRisk();
      riskScore += timeRisk;

      if (timeRisk > 10) {
        riskFactors.push('unusual_time');
      }

      // Geolocation analysis
      if (deviceContext.geolocation) {
        const geoRisk = await this.assessGeolocationRisk(userId, deviceContext.geolocation);
        riskScore += geoRisk;

        if (geoRisk > 15) {
          riskFactors.push('unusual_location');
        }
      }

      // Calculate final scores
      const finalRiskScore = Math.min(Math.max(riskScore, 0), 100);
      const riskLevel = this.getRiskLevel(finalRiskScore);
      const recommendation = this.getRecommendation(finalRiskScore, riskFactors);
      const confidence = this.calculateRiskConfidence(deviceContext, riskFactors);

      const assessment: RiskAssessment = {
        risk_score: finalRiskScore,
        risk_level: riskLevel,
        risk_factors: riskFactors,
        device_trust_score: deviceTrustScore,
        behavioral_score: behaviorScore,
        environmental_score: environmentScore,
        recommendation,
        confidence
      };

      await this.auditLogger.logEvent('risk.assessment_completed', 'success', {
        user_id: userId,
        device_id: deviceContext.fingerprint.device_id,
        action,
        risk_score: finalRiskScore,
        risk_level: riskLevel,
        risk_factors: riskFactors,
        recommendation
      });

      return assessment;

    } catch (error) {
      await this.auditLogger.logEvent('risk.assessment_failed', 'error', {
        user_id: userId,
        action,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return safe default in case of error
      return {
        risk_score: 75, // High risk on error
        risk_level: 'high',
        risk_factors: ['assessment_error'],
        device_trust_score: 0,
        behavioral_score: 0,
        environmental_score: 0,
        recommendation: 'challenge',
        confidence: 0.1
      };
    }
  }

  /**
   * Track behavioral patterns
   */
  trackBehavior(event: {
    type: 'mouse_move' | 'key_press' | 'click' | 'scroll' | 'focus' | 'blur';
    timestamp: number;
    data: any;
  }): void {
    try {
      // Store behavioral data for analysis
      const behaviorKey = `behavior_${Date.now()}`;
      const behaviorData = {
        type: event.type,
        timestamp: event.timestamp,
        data: event.data
      };

      // Use sessionStorage for temporary behavior tracking
      const existingData = sessionStorage.getItem('behavior_patterns') || '[]';
      const patterns = JSON.parse(existingData);
      patterns.push(behaviorData);

      // Keep only last 100 events to prevent memory issues
      const recentPatterns = patterns.slice(-100);
      sessionStorage.setItem('behavior_patterns', JSON.stringify(recentPatterns));

    } catch (error) {
      console.error('Failed to track behavior:', error);
    }
  }

  // =============================================
  // PRIVATE FINGERPRINTING METHODS
  // =============================================

  private async getBrowserFingerprint(): Promise<string> {
    const features = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      navigator.cookieEnabled,
      navigator.doNotTrack,
      screen.width,
      screen.height,
      screen.pixelDepth,
      new Date().getTimezoneOffset()
    ];

    return this.hashString(features.join('|'));
  }

  private async getCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return 'no-canvas';

      // Draw complex pattern for fingerprinting
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Device fingerprinting canvas 🔒', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Device fingerprinting canvas 🔒', 4, 17);

      return canvas.toDataURL();
    } catch (error) {
      return 'canvas-error';
    }
  }

  private async getWebGLFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) return 'no-webgl';

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = gl.getParameter(debugInfo?.UNMASKED_VENDOR_WEBGL || gl.VENDOR);
      const renderer = gl.getParameter(debugInfo?.UNMASKED_RENDERER_WEBGL || gl.RENDERER);

      return `${vendor}|${renderer}`;
    } catch (error) {
      return 'webgl-error';
    }
  }

  private async getAudioFingerprint(): Promise<string> {
    try {
      return new Promise((resolve) => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const analyser = audioContext.createAnalyser();
        const gainNode = audioContext.createGain();
        const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);

        oscillator.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(gainNode);
        gainNode.connect(audioContext.destination);

        scriptProcessor.onaudioprocess = () => {
          const bins = new Float32Array(analyser.frequencyBinCount);
          analyser.getFloatFrequencyData(bins);
          
          oscillator.disconnect();
          scriptProcessor.disconnect();
          audioContext.close();
          
          resolve(bins.slice(0, 10).join(','));
        };

        oscillator.start(0);
        
        // Fallback timeout
        setTimeout(() => resolve('audio-timeout'), 1000);
      });
    } catch (error) {
      return 'audio-error';
    }
  }

  private async getFontFingerprint(): Promise<string> {
    try {
      const testFonts = [
        'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Helvetica',
        'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
        'Trebuchet MS', 'Arial Black', 'Impact'
      ];

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'no-canvas';

      const baseFonts = ['serif', 'sans-serif', 'monospace'];
      const testString = 'mmmmmmmmmmlli';
      const testSize = '72px';
      const h = canvas.height = 60;
      const w = canvas.width = 200;

      canvas.style.display = 'none';
      document.body.appendChild(canvas);

      const defaultWidths: { [key: string]: number } = {};
      for (const baseFont of baseFonts) {
        ctx.font = `${testSize} ${baseFont}`;
        defaultWidths[baseFont] = ctx.measureText(testString).width;
      }

      const availableFonts = [];
      for (const testFont of testFonts) {
        let detected = false;
        for (const baseFont of baseFonts) {
          ctx.font = `${testSize} ${testFont}, ${baseFont}`;
          const width = ctx.measureText(testString).width;
          if (width !== defaultWidths[baseFont]) {
            detected = true;
            break;
          }
        }
        if (detected) {
          availableFonts.push(testFont);
        }
      }

      document.body.removeChild(canvas);
      return availableFonts.join(',');
    } catch (error) {
      return 'font-error';
    }
  }

  private async getPluginFingerprint(): Promise<string> {
    try {
      const plugins = Array.from(navigator.plugins).map(plugin => 
        `${plugin.name}|${plugin.version || 'unknown'}`
      );
      return plugins.join(';');
    } catch (error) {
      return 'plugin-error';
    }
  }

  private async getStorageFingerprint(): Promise<string> {
    try {
      const storage = [];
      
      // Check localStorage availability
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        storage.push('localStorage');
      } catch (e) {
        storage.push('no-localStorage');
      }

      // Check sessionStorage availability
      try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        storage.push('sessionStorage');
      } catch (e) {
        storage.push('no-sessionStorage');
      }

      // Check IndexedDB availability
      storage.push(!!window.indexedDB ? 'indexedDB' : 'no-indexedDB');

      return storage.join('|');
    } catch (error) {
      return 'storage-error';
    }
  }

  private async getNetworkFingerprint(): Promise<string> {
    try {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      if (!connection) return 'no-connection-api';

      return `${connection.effectiveType || 'unknown'}|${connection.downlink || 'unknown'}|${connection.rtt || 'unknown'}`;
    } catch (error) {
      return 'network-error';
    }
  }

  private async getHardwareFingerprint(): Promise<string> {
    try {
      const hardware = [
        navigator.hardwareConcurrency || 'unknown',
        navigator.deviceMemory || 'unknown',
        screen.colorDepth,
        screen.pixelDepth
      ];

      return hardware.join('|');
    } catch (error) {
      return 'hardware-error';
    }
  }

  private async getBehaviorFingerprint(): Promise<string> {
    try {
      // Get stored behavior patterns
      const behaviorData = sessionStorage.getItem('behavior_patterns') || '[]';
      const patterns = JSON.parse(behaviorData);

      if (patterns.length === 0) return 'no-behavior-data';

      // Analyze patterns
      const mouseEvents = patterns.filter((p: any) => p.type === 'mouse_move');
      const keyEvents = patterns.filter((p: any) => p.type === 'key_press');
      const clickEvents = patterns.filter((p: any) => p.type === 'click');

      const behaviorMetrics = [
        mouseEvents.length,
        keyEvents.length,
        clickEvents.length,
        patterns.length
      ];

      return behaviorMetrics.join('|');
    } catch (error) {
      return 'behavior-error';
    }
  }

  // =============================================
  // RISK ASSESSMENT METHODS
  // =============================================

  private async assessDeviceTrust(fingerprint: DeviceFingerprint, userId: string): Promise<number> {
    // In production, this would check against database of known devices
    // For now, return a score based on fingerprint confidence
    return Math.min(fingerprint.confidence_score, 1.0);
  }

  private assessBehaviorPatterns(sessionData: any): number {
    // Analyze typing patterns, mouse movements, etc.
    // This is a simplified implementation
    const { session_duration, page_views, interactions } = sessionData;
    
    if (session_duration < 10) return 0.3; // Too quick
    if (interactions === 0) return 0.2; // No interactions
    if (page_views / session_duration > 10) return 0.4; // Too many pages too quickly
    
    return 0.8; // Normal behavior
  }

  private async assessEnvironmentalFactors(context: DeviceContext): Promise<number> {
    let score = 1.0;

    // Check for suspicious user agents
    if (this.isSuspiciousUserAgent(context.user_agent)) {
      score -= 0.3;
    }

    // Check for VPN/Proxy indicators
    if (await this.isVPNOrProxy(context.ip_address)) {
      score -= 0.2;
    }

    return Math.max(score, 0);
  }

  private getActionRisk(action: string): number {
    const riskMap: { [key: string]: number } = {
      'login': 5,
      'password_change': 25,
      'email_change': 20,
      'mfa_disable': 30,
      'admin_action': 35,
      'bulk_export': 25,
      'financial_transaction': 30,
      'data_deletion': 20
    };

    return riskMap[action] || 10;
  }

  private assessTimeBasedRisk(): number {
    const hour = new Date().getHours();
    
    // Higher risk during typical off-hours (2 AM - 6 AM)
    if (hour >= 2 && hour <= 6) {
      return 15;
    }
    
    // Moderate risk during late night (11 PM - 1 AM)
    if (hour >= 23 || hour <= 1) {
      return 8;
    }
    
    return 0;
  }

  private async assessGeolocationRisk(userId: string, geolocation: any): Promise<number> {
    // In production, compare against user's known locations
    // This is a simplified implementation
    return 0;
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score <= 25) return 'low';
    if (score <= 50) return 'medium';
    if (score <= 75) return 'high';
    return 'critical';
  }

  private getRecommendation(score: number, factors: string[]): 'allow' | 'challenge' | 'block' {
    if (score <= 30) return 'allow';
    if (score <= 70) return 'challenge';
    return 'block';
  }

  private calculateRiskConfidence(context: DeviceContext, factors: string[]): number {
    let confidence = context.fingerprint.confidence_score;
    
    // Reduce confidence if multiple risk factors
    if (factors.length > 3) {
      confidence *= 0.8;
    }
    
    // Reduce confidence if no behavioral data
    if (!context.session_data.interactions) {
      confidence *= 0.9;
    }
    
    return Math.max(confidence, 0.1);
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  private calculateConfidenceScore(fingerprints: string[]): number {
    let score = 0;
    
    fingerprints.forEach(fp => {
      if (fp && fp !== 'error' && !fp.includes('error')) {
        score += 0.1;
      }
    });

    return Math.min(score, 1.0);
  }

  private async hashFingerprint(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async hashString(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot|crawler|spider|scraper/i,
      /curl|wget|httpie/i,
      /python|java|go-http/i,
      /automated|headless|phantom/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  private async isVPNOrProxy(ipAddress: string): Promise<boolean> {
    // In production, integrate with IP reputation service
    // This is a placeholder implementation
    return false;
  }
}

/**
 * Create device fingerprinter instance
 */
export function createDeviceFingerprinter(
  ip_address?: string, 
  user_agent?: string
): DeviceFingerprinter {
  return new DeviceFingerprinter(ip_address, user_agent);
}