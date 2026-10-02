import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, DEMO, recommend, inputSchema } from '../lib/model.ts';

test('cost totals and annual output reconcile', () => {
  for (const scenario of calculate(DEMO)) {
    assert.ok(Math.abs(scenario.costs.reduce((sum, cost) => sum + cost.value, 0) - scenario.unitCost) < 0.01);
    assert.equal(scenario.annualCost, Math.round(scenario.unitCost * DEMO.volume * DEMO.utilization / 100));
  }
});
test('unfunded new plants cannot be recommended', () => {
  assert.equal(recommend({ ...DEMO, budget: 0 }).best.id, 'europe');
});
test('European customer concentration reverses the regional advantage', () => {
  assert.equal(recommend({ ...DEMO, gulfShare: 0, freight: 700 }).best.id, 'europe');
});
test('energy incentive leaves Europe unchanged and reduces UAE costs', () => {
  const base = calculate(DEMO), without = calculate({ ...DEMO, incentive: false });
  assert.equal(base[0].unitCost, without[0].unitCost);
  assert.ok(base[2].unitCost < without[2].unitCost);
});
test('incentive dependency is detected when the advantage disappears', () => {
  const decision = recommend({ ...DEMO, gulfShare: 10 });
  assert.equal(decision.best.id, 'manufacturing');
  assert.equal(decision.depends, true);
});
test('invalid financial inputs are rejected', () => {
  for (const update of [{ volume: 0 }, { utilization: 0 }, { gulfShare: 101 }, { budget: -1 }, { resin: NaN }]) {
    assert.equal(inputSchema.safeParse({ ...DEMO, ...update }).success, false);
  }
});
