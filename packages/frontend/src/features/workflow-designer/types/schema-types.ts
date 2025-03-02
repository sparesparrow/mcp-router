/**
 * schema-types.ts
 * Improved TypeScript definitions for JSON Schema and other structured data
 */

/**
 * JSON Schema type definitions
 */
export type JsonSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';

export interface JsonSchemaBase {
  title?: string;
  description?: string;
  default?: any;
  examples?: any[];
  enum?: any[];
  const?: any;
  $comment?: string;
  $id?: string;
  $ref?: string;
  $schema?: string;
  $defs?: Record<string, JsonSchema>;
  definitions?: Record<string, JsonSchema>;
  allOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  not?: JsonSchema;
}

export interface JsonSchemaString extends JsonSchemaBase {
  type: 'string';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
}

export interface JsonSchemaNumber extends JsonSchemaBase {
  type: 'number' | 'integer';
  multipleOf?: number;
  minimum?: number;
  exclusiveMinimum?: number;
  maximum?: number;
  exclusiveMaximum?: number;
}

export interface JsonSchemaBoolean extends JsonSchemaBase {
  type: 'boolean';
}

export interface JsonSchemaObject extends JsonSchemaBase {
  type: 'object';
  properties?: Record<string, JsonSchema>;
  patternProperties?: Record<string, JsonSchema>;
  additionalProperties?: boolean | JsonSchema;
  required?: string[];
  propertyNames?: JsonSchema;
  minProperties?: number;
  maxProperties?: number;
  dependencies?: Record<string, JsonSchema | string[]>;
}

export interface JsonSchemaArray extends JsonSchemaBase {
  type: 'array';
  items?: JsonSchema | JsonSchema[];
  additionalItems?: boolean | JsonSchema;
  contains?: JsonSchema;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
}

export interface JsonSchemaNull extends JsonSchemaBase {
  type: 'null';
}

export type JsonSchema =
  | JsonSchemaString
  | JsonSchemaNumber
  | JsonSchemaBoolean
  | JsonSchemaObject
  | JsonSchemaArray
  | JsonSchemaNull
  | (JsonSchemaBase & { type?: JsonSchemaType | JsonSchemaType[] });

/**
 * Style type definitions
 */
export interface NodeStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  padding?: number;
  width?: number;
  height?: number;
  opacity?: number;
  boxShadow?: string;
}

export interface EdgeStyle {
  strokeWidth?: number;
  stroke?: string;
  strokeDasharray?: string;
  opacity?: number;
  labelBgColor?: string;
  labelColor?: string;
  labelFontSize?: number;
}

/**
 * Metadata type definitions
 */
export interface WorkflowMetadata {
  createdAt?: string;
  updatedAt?: string;
  author?: string;
  version?: string;
  tags?: string[];
  category?: string;
  executionStats?: {
    averageExecutionTime?: number;
    successRate?: number;
    lastExecuted?: string;
    totalExecutions?: number;
  };
  customProperties?: Record<string, unknown>;
}

/**
 * Variables type definition
 */
export interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue?: any;
  description?: string;
  required?: boolean;
} 