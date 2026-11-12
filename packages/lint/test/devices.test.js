import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { listDevices, loadDevice } from '../src/devices.js';

const schema = JSON.parse(readFileSync(new URL('../../../data/schema/device.schema.json', import.meta.url), 'utf8'));
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

test('the three first-release devices have profiles', () => {
  assert.deepEqual(listDevices().sort(), ['android-xr', 'even-g2', 'mrbd']);
});

for (const id of listDevices()) {
  test(`${id} matches the schema`, () => {
    const device = loadDevice(id);
    assert.equal(device.id, id);
    assert.ok(validate(device), JSON.stringify(validate.errors, null, 2));
  });
}

const base = () => loadDevice('mrbd');

test('a fact without a source is rejected unless its grade is unknown', () => {
  const device = base();
  delete device.display.ppd.source;
  assert.equal(validate(device), false);
  device.display.ppd = { value: null, grade: 'unknown', checked: '2026-11-12' };
  assert.equal(validate(device), true);
});

test('an unknown fact cannot carry a value', () => {
  const device = base();
  device.display.ppd = { value: 42, grade: 'unknown', checked: '2026-11-12' };
  assert.equal(validate(device), false);
});

test('a grade outside the list is rejected', () => {
  const device = base();
  device.display.ppd.grade = 'rumor';
  assert.equal(validate(device), false);
});
