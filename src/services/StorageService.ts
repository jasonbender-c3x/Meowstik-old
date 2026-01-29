import type { Document } from './RAGService';
import type { ConversationMessage } from '../GeminiService';
import type { AgentSchema } from '../types/agent';

/**
 * User profile information
 */
export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  preferences?: Record<string, any>;
  createdAt: Date;
  lastActive: Date;
}

/**
 * Storage Service for persisting data
 * Uses localStorage for browser-based storage
 * Can be extended to use Firestore or other backends
 */
export class StorageService {
  private storagePrefix = 'meowstik_';

  /**
   * Get or create a user ID
   * @returns string - User ID
   */
  getUserId(): string {
    const key = `${this.storagePrefix}user_id`;
    let userId = localStorage.getItem(key);
    
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(key, userId);
    }
    
    return userId;
  }

  /**
   * Get or create user profile
   * @returns UserProfile - User profile
   */
  getUserProfile(): UserProfile {
    const userId = this.getUserId();
    const key = `${this.storagePrefix}user_profile`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      try {
        const profile = JSON.parse(stored);
        profile.createdAt = new Date(profile.createdAt);
        profile.lastActive = new Date(profile.lastActive);
        
        // Update last active
        profile.lastActive = new Date();
        this.saveUserProfile(profile);
        
        return profile;
      } catch (error) {
        console.error('Failed to parse user profile:', error);
      }
    }
    
    // Create new profile
    const profile: UserProfile = {
      id: userId,
      createdAt: new Date(),
      lastActive: new Date(),
    };
    
    this.saveUserProfile(profile);
    return profile;
  }

  /**
   * Save user profile
   * @param profile - User profile to save
   */
  saveUserProfile(profile: UserProfile): void {
    const key = `${this.storagePrefix}user_profile`;
    localStorage.setItem(key, JSON.stringify(profile));
  }

  /**
   * Save documents to storage
   * @param documents - Documents to save
   */
  saveDocuments(documents: Document[]): void {
    const key = `${this.storagePrefix}documents`;
    const serialized = documents.map(doc => ({
      ...doc,
      timestamp: doc.timestamp.toISOString(),
    }));
    localStorage.setItem(key, JSON.stringify(serialized));
  }

  /**
   * Load documents from storage
   * @returns Document[] - Loaded documents
   */
  loadDocuments(): Document[] {
    const key = `${this.storagePrefix}documents`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return [];
    }
    
    try {
      const parsed = JSON.parse(stored);
      return parsed.map((doc: any) => ({
        ...doc,
        timestamp: new Date(doc.timestamp),
      }));
    } catch (error) {
      console.error('Failed to load documents:', error);
      return [];
    }
  }

  /**
   * Save conversation history
   * @param history - Conversation messages to save
   */
  saveConversationHistory(history: ConversationMessage[]): void {
    const key = `${this.storagePrefix}conversation_history`;
    const serialized = history.map(msg => ({
      ...msg,
      timestamp: msg.timestamp.toISOString(),
    }));
    localStorage.setItem(key, JSON.stringify(serialized));
  }

  /**
   * Load conversation history
   * @returns ConversationMessage[] - Loaded conversation history
   */
  loadConversationHistory(): ConversationMessage[] {
    const key = `${this.storagePrefix}conversation_history`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return [];
    }
    
    try {
      const parsed = JSON.parse(stored);
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      return [];
    }
  }

  /**
   * Save generated agents
   * @param agents - Agent specifications to save
   */
  saveGeneratedAgents(agents: AgentSchema[]): void {
    const key = `${this.storagePrefix}generated_agents`;
    localStorage.setItem(key, JSON.stringify(agents));
  }

  /**
   * Load generated agents
   * @returns AgentSchema[] - Loaded agents
   */
  loadGeneratedAgents(): AgentSchema[] {
    const key = `${this.storagePrefix}generated_agents`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return [];
    }
    
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load generated agents:', error);
      return [];
    }
  }

  /**
   * Clear all stored data
   */
  clearAll(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.storagePrefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Export all data as JSON
   * @returns string - JSON string of all data
   */
  exportData(): string {
    const data = {
      userProfile: this.getUserProfile(),
      documents: this.loadDocuments(),
      conversationHistory: this.loadConversationHistory(),
      generatedAgents: this.loadGeneratedAgents(),
      exportedAt: new Date().toISOString(),
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON
   * @param jsonData - JSON string to import
   */
  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.userProfile) {
        this.saveUserProfile(data.userProfile);
      }
      
      if (data.documents) {
        this.saveDocuments(data.documents);
      }
      
      if (data.conversationHistory) {
        this.saveConversationHistory(data.conversationHistory);
      }
      
      if (data.generatedAgents) {
        this.saveGeneratedAgents(data.generatedAgents);
      }
    } catch (error) {
      throw new Error(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Create a StorageService instance
 * @returns StorageService instance
 */
export function createStorageService(): StorageService {
  return new StorageService();
}

// Singleton instance
let _storageServiceInstance: StorageService | null = null;

/**
 * Get or create the singleton StorageService instance
 * @returns StorageService instance
 */
export function getStorageService(): StorageService {
  if (!_storageServiceInstance) {
    _storageServiceInstance = new StorageService();
  }
  return _storageServiceInstance;
}
