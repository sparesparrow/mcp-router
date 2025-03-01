import { Violation } from '@mcp-router/shared/src/types/analyzer';

export interface Improvement {
  description: string;
  code?: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'small' | 'medium' | 'large';
  impact: 'high' | 'medium' | 'low';
}

export class ImprovementGenerator {
  private improvementStrategies: Map<string, (violation: Violation) => Promise<Improvement[]>>;

  constructor() {
    this.improvementStrategies = new Map();
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    this.improvementStrategies.set('SingleResponsibility', this.generateSRPImprovements);
    this.improvementStrategies.set('OpenClosed', this.generateOCPImprovements);
    this.improvementStrategies.set('LiskovSubstitution', this.generateLSPImprovements);
    this.improvementStrategies.set('InterfaceSegregation', this.generateISPImprovements);
    this.improvementStrategies.set('DependencyInversion', this.generateDIPImprovements);
  }

  async generateImprovements(violations: Violation[]): Promise<Improvement[]> {
    const improvements: Improvement[] = [];

    for (const violation of violations) {
      const strategy = this.improvementStrategies.get(violation.principle);
      if (strategy) {
        const suggestionList = await strategy(violation);
        improvements.push(...suggestionList);
      }
    }

    return this.prioritizeImprovements(improvements);
  }

  private async generateSRPImprovements(violation: Violation): Promise<Improvement[]> {
    return [{
      description: 'Split the class into multiple classes, each with a single responsibility',
      priority: 'high',
      effort: 'medium',
      impact: 'high'
    }];
  }

  private async generateOCPImprovements(violation: Violation): Promise<Improvement[]> {
    return [{
      description: 'Use interfaces and abstract classes to make the code extensible without modification',
      priority: 'medium',
      effort: 'medium',
      impact: 'high'
    }];
  }

  private async generateLSPImprovements(violation: Violation): Promise<Improvement[]> {
    return [{
      description: 'Ensure that derived classes can be substituted for their base classes',
      priority: 'high',
      effort: 'large',
      impact: 'high'
    }];
  }

  private async generateISPImprovements(violation: Violation): Promise<Improvement[]> {
    return [{
      description: 'Break down large interfaces into smaller, more focused ones',
      priority: 'medium',
      effort: 'medium',
      impact: 'medium'
    }];
  }

  private async generateDIPImprovements(violation: Violation): Promise<Improvement[]> {
    return [{
      description: 'Depend on abstractions rather than concrete implementations',
      priority: 'high',
      effort: 'medium',
      impact: 'high'
    }];
  }

  private prioritizeImprovements(improvements: Improvement[]): Improvement[] {
    return improvements.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const impactOrder = { high: 3, medium: 2, low: 1 };
      
      const aPriority = priorityOrder[a.priority] * impactOrder[a.impact];
      const bPriority = priorityOrder[b.priority] * impactOrder[b.impact];
      
      return bPriority - aPriority;
    });
  }
} 