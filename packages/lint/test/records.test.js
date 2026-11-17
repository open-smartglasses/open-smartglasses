import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { listDevices } from '../src/devices.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const schema = JSON.parse(readFileSync(path.join(root, 'data/schema/record.schema.json'), 'utf8'));
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const dir = path.join(root, 'data/records');
const files = readdirSync(dir, { withFileTypes: true })
  .filter(e => e.isDirectory())
  .flatMap(e => readdirSync(path.join(dir, e.name)).filter(f => f.endsWith('.json')).map(f => `${e.name}/${f}`));
const today = new Date().toISOString().slice(0, 10);

test('there are records', () => assert.ok(files.length > 0));

for (const file of files) {
  test(`${file} is a valid record`, () => {
    const record = JSON.parse(readFileSync(path.join(dir, file), 'utf8'));
    assert.ok(validate(record), JSON.stringify(validate.errors, null, 2));
    const [device, name] = file.split('/');
    assert.equal(`${record.id}.json`, name, 'id matches the file name');
    assert.equal(record.device, device, 'device matches the folder');
    assert.ok(listDevices().includes(record.device), `no profile for ${record.device}`);
    for (const e of record.evidence) {
      assert.ok(e.date <= today, `evidence dated in the future: ${e.date}`);
      if (e.source && !/^https?:/.test(e.source)) assert.ok(existsSync(path.join(root, e.source)), `missing ${e.source}`);
    }
    if (record.repro && /^scripts\//.test(record.repro)) assert.ok(existsSync(path.join(root, record.repro)), `missing ${record.repro}`);
  });
}

const base = () => JSON.parse(readFileSync(path.join(dir, 'even-g2/sdk-timer-id-collision.json'), 'utf8'));

test('a reported sighting needs a link', () => {
  const record = base();
  delete record.evidence[0].source;
  assert.equal(validate(record), false);
});

test('a question has no answer', () => {
  const record = { ...base(), kind: 'question' };
  assert.equal(validate(record), false);
  delete record.actual;
  assert.equal(validate(record), true);
});

test('a kind outside the list is rejected', () => {
  assert.equal(validate({ ...base(), kind: 'rumor' }), false);
});
