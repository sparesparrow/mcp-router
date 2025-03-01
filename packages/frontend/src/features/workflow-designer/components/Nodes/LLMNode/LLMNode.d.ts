import React from 'react';

interface LLMNodeProps {
  data: {
    label: string;
    type: string;
    [key: string]: any;
  };
  selected: boolean;
}

declare const LLMNode: React.FC<LLMNodeProps>;

export default LLMNode; 