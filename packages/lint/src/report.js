const LABEL = { error: 'error', warn: 'warn ', info: 'note ' };
const BASIS = {
  vendor: 'vendor rule',
  derived: 'derived from vendor guidance',
  project: 'project rule',
};

export function format(result, { maxNodes = 5 } = {}) {
  const lines = [result.url, `device: ${result.device} (${result.viewport.join('x')})`, ''];

  for (const f of result.findings) {
    lines.push(`${LABEL[f.severity]}  ${f.rule}  ${f.message}`);
    const detail = [BASIS[f.basis]];
    if (f.grade) detail.push(`grade: ${f.grade}`);
    if (f.source) detail.push(f.source);
    lines.push(`       ${detail.join(', ')}`);

    const nodes = f.nodes ?? [];
    for (const n of nodes.slice(0, maxNodes)) {
      const size = n.px != null ? `${n.px}px` : `weight ${n.weight}`;
      lines.push(`       - ${size}  "${n.text}"  ${n.selector}`);
    }
    if (nodes.length > maxNodes) lines.push(`       - and ${nodes.length - maxNodes} more`);
    lines.push('');
  }

  const { errors, warnings, notes } = result.summary;
  lines.push(
    result.findings.length ? `${errors} error(s), ${warnings} warning(s), ${notes} note(s)` : 'No problems found.',
  );
  return lines.join('\n');
}
