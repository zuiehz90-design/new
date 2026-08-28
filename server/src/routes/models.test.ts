import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isReasoningModel, sortModels } from './models.js';
import { DEFAULT_MODEL, FREE_ROUTER_MODEL } from '../modelDefaults.js';

test('isReasoningModel : détecte les modèles de raisonnement', () => {
  assert.equal(isReasoningModel('deepseek/deepseek-r1:free'), true);
  assert.equal(isReasoningModel('deepseek/deepseek-v4-flash:free'), true);
  assert.equal(isReasoningModel('qwen/qwen3-reasoner:free'), true);
  assert.equal(isReasoningModel('google/gemini-2.5-flash-thinking:free'), true);
  assert.equal(isReasoningModel('openai/gpt-o3:free'), true);
});

test('isReasoningModel : les modèles instruct/chat ne sont pas marqués', () => {
  assert.equal(isReasoningModel(DEFAULT_MODEL), false, 'le modèle par défaut ne doit pas être un reasoning model');
  assert.equal(isReasoningModel('meta-llama/llama-3.3-70b-instruct:free'), false);
  assert.equal(isReasoningModel('mistralai/mistral-small-3.1-24b-instruct:free'), false);
  assert.equal(isReasoningModel('google/gemini-2.0-flash-001:free'), false);
  assert.equal(isReasoningModel(FREE_ROUTER_MODEL), false);
});

test('sortModels : non-raisonneurs avant raisonneurs', () => {
  const models = [
    { id: 'deepseek/deepseek-r1:free', reasoning: true },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', reasoning: false },
    { id: 'google/gemini-2.5-flash-thinking:free', reasoning: true },
  ];
  const sorted = sortModels(models);
  assert.equal(sorted[0].id, 'meta-llama/llama-3.3-70b-instruct:free');
  assert.equal(sorted[1].reasoning, true);
  assert.equal(sorted[2].reasoning, true);
});
