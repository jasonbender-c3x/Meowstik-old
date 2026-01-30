/**
 * Entity types recognized in queries
 */
export enum EntityType {
  PERSON = 'person',
  ORGANIZATION = 'organization',
  LOCATION = 'location',
  DATE = 'date',
  TECHNOLOGY = 'technology',
  CAPABILITY = 'capability',
  TOOL = 'tool',
  AGENT_TYPE = 'agent_type',
}

/**
 * Recognized entity with type and confidence
 */
export interface Entity {
  text: string;
  type: EntityType;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

/**
 * Entity Recognition Service for extracting structured information from queries
 * Uses pattern matching and dictionaries for lightweight entity extraction
 */
export class EntityRecognitionService {
  private technologyPatterns: RegExp[] = [
    /\b(javascript|typescript|python|java|c\+\+|rust|go|ruby|php|swift|kotlin)\b/gi,
    /\b(react|vue|angular|node\.?js|express|django|flask|spring|laravel)\b/gi,
    /\b(docker|kubernetes|aws|azure|gcp|terraform|ansible)\b/gi,
    /\b(mongodb|postgresql|mysql|redis|elasticsearch|neo4j)\b/gi,
    /\b(api|rest|graphql|grpc|websocket|http|https)\b/gi,
  ];

  private capabilityPatterns: RegExp[] = [
    /\b(search|analyze|generate|create|build|deploy|test|debug|monitor|optimize)\b/gi,
    /\b(authentication|authorization|validation|encryption|caching|logging)\b/gi,
    /\b(processing|transformation|integration|automation|orchestration)\b/gi,
  ];

  private agentTypePatterns: RegExp[] = [
    /\b(customer support|code review|data analyst|content writer|translator)\b/gi,
    /\b(chatbot|assistant|advisor|consultant|specialist|expert)\b/gi,
    /\b(moderator|curator|analyzer|summarizer|classifier)\b/gi,
  ];

  private datePatterns: RegExp[] = [
    /\b(\d{4}-\d{2}-\d{2})\b/g, // ISO date format
    /\b(today|yesterday|tomorrow|last week|next month|this year)\b/gi,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/gi,
  ];

  /**
   * Extract entities from query text
   * @param query - Query text to analyze
   * @returns Array of recognized entities
   */
  extractEntities(query: string): Entity[] {
    const entities: Entity[] = [];

    // Extract technologies
    for (const pattern of this.technologyPatterns) {
      let match;
      while ((match = pattern.exec(query)) !== null) {
        entities.push({
          text: match[0],
          type: EntityType.TECHNOLOGY,
          confidence: 0.9,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    }

    // Extract capabilities
    for (const pattern of this.capabilityPatterns) {
      let match;
      while ((match = pattern.exec(query)) !== null) {
        entities.push({
          text: match[0],
          type: EntityType.CAPABILITY,
          confidence: 0.85,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    }

    // Extract agent types
    for (const pattern of this.agentTypePatterns) {
      let match;
      while ((match = pattern.exec(query)) !== null) {
        entities.push({
          text: match[0],
          type: EntityType.AGENT_TYPE,
          confidence: 0.95,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    }

    // Extract dates
    for (const pattern of this.datePatterns) {
      let match;
      while ((match = pattern.exec(query)) !== null) {
        entities.push({
          text: match[0],
          type: EntityType.DATE,
          confidence: 0.9,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    }

    // Sort by start index and remove overlaps
    return this.removeOverlaps(entities);
  }

  /**
   * Remove overlapping entities, keeping higher confidence ones
   * @param entities - Array of entities
   * @returns Filtered array without overlaps
   */
  private removeOverlaps(entities: Entity[]): Entity[] {
    if (entities.length === 0) return [];

    // Sort by start index, then by confidence (descending)
    const sorted = entities.sort((a, b) => {
      if (a.startIndex !== b.startIndex) {
        return a.startIndex - b.startIndex;
      }
      return b.confidence - a.confidence;
    });

    const result: Entity[] = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = result[result.length - 1];

      // Check for overlap
      if (current.startIndex >= last.endIndex) {
        // No overlap, add to result
        result.push(current);
      } else if (current.confidence > last.confidence) {
        // Overlap and higher confidence, replace last
        result[result.length - 1] = current;
      }
      // Otherwise, skip this entity
    }

    return result;
  }

  /**
   * Enhance query with entity information
   * @param query - Original query
   * @returns Enhanced query with entity tags
   */
  enhanceQuery(query: string): string {
    const entities = this.extractEntities(query);
    
    if (entities.length === 0) {
      return query;
    }

    let enhanced = query;
    const entityTags: string[] = [];

    // Add entity information as structured tags
    for (const entity of entities) {
      entityTags.push(`[${entity.type}:${entity.text}]`);
    }

    if (entityTags.length > 0) {
      enhanced = `${query}\n\nDetected entities: ${entityTags.join(' ')}`;
    }

    return enhanced;
  }

  /**
   * Get entity types from query
   * @param query - Query text
   * @returns Array of unique entity types found
   */
  getEntityTypes(query: string): EntityType[] {
    const entities = this.extractEntities(query);
    const types = new Set<EntityType>();
    
    for (const entity of entities) {
      types.add(entity.type);
    }

    return Array.from(types);
  }

  /**
   * Filter entities by type
   * @param query - Query text
   * @param types - Entity types to filter
   * @returns Filtered entities
   */
  filterEntitiesByType(query: string, types: EntityType[]): Entity[] {
    const entities = this.extractEntities(query);
    return entities.filter(entity => types.includes(entity.type));
  }

  /**
   * Check if query contains specific entity types
   * @param query - Query text
   * @param types - Entity types to check
   * @returns True if any of the specified types are found
   */
  hasEntityTypes(query: string, types: EntityType[]): boolean {
    const foundTypes = this.getEntityTypes(query);
    return types.some(type => foundTypes.includes(type));
  }
}

/**
 * Create an EntityRecognitionService instance
 * @returns EntityRecognitionService instance
 */
export function createEntityRecognitionService(): EntityRecognitionService {
  return new EntityRecognitionService();
}
