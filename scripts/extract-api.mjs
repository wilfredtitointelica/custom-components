// Extracts the public API of one version of a component for the API tab of its documentation page:
// inputs, outputs, templates (contentChild('name') + <ng-content>), public methods and the --int-* tokens.
// Read from the sources only (TypeScript AST of base/<id>.ts, regexes on base/<id>.html and
// styles/_<id>.scss), so the tab never drifts from the code. Used by generate-docs.mjs and check-component.mjs.
//
// The JSDoc of each member is its description. One starting with `int-* extension:` is marked as an
// extension; in a PrimeNG replica (class JSDoc mentions PrimeNG) the rest are marked as PrimeNG.
import { existsSync, readFileSync } from 'node:fs';
import ts from 'typescript';

const EXTENSION_PREFIX = /^int-\*\s+extension:\s*/i;
const SIGNAL_INPUTS = new Set(['input', 'model']);
const LIFECYCLE = /^ng[A-Z]/;

/** `--int-card-gap: var(--i-…); // knowledgeBase: … · Figma: …` inside :root. */
const TOKEN_LINE = /^\s*(--int-[\w-]+)\s*:\s*([^;]+);\s*(?:\/\/\s*(.*))?$/;
/** `// --- body ---` group headers of the TOKENS block. */
const TOKEN_GROUP = /^\s*\/\/\s*-{2,}\s*(.+?)\s*-{2,}\s*$/;

const empty = () => ({ inputs: [], outputs: [], templates: [], methods: [], tokens: [] });

const hasModifier = (node, kind) => !!ts.getModifiers?.(node)?.some((m) => m.kind === kind);

/** Text of the last JSDoc block of a node, on one line ('' = none). */
function jsDocOf(node) {
  const doc = ts.getJSDocCommentsAndTags(node).filter(ts.isJSDoc).at(-1);
  return (ts.getTextOfJSDocComment(doc?.comment) ?? '').replace(/\s+/g, ' ').trim();
}

/** `@defaultValue x` tag, when the initializer does not show the real default. */
function defaultTagOf(node) {
  const tag = ts.getJSDocTags(node).find((t) => t.tagName.text === 'defaultValue');
  return tag ? (ts.getTextOfJSDocComment(tag.comment) ?? '').trim() : undefined;
}

/** Description without the extension prefix, and where the member comes from. */
function describe(text, replica) {
  if (EXTENSION_PREFIX.test(text)) {
    const rest = text.replace(EXTENSION_PREFIX, '');
    return { description: rest.charAt(0).toUpperCase() + rest.slice(1), origin: 'int' };
  }
  return { description: text, ...(replica ? { origin: 'primeng' } : {}) };
}

/** `input`, `input.required`, `output`… of an initializer call. */
function calleeOf(call) {
  const callee = call.expression;
  if (ts.isIdentifier(callee)) return { fn: callee.text, required: false };
  if (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression))
    return { fn: callee.expression.text, required: callee.name.text === 'required' };
  return undefined;
}

/** Type of a signal input: generic argument, else inferred from the transform or the default. */
function inputType(call, source) {
  const generic = call.typeArguments?.[0];
  if (generic) return generic.getText(source);
  const options = call.arguments[1];
  const transform =
    options && ts.isObjectLiteralExpression(options)
      ? options.properties.find((p) => p.name?.getText(source) === 'transform')
      : undefined;
  const transformName =
    transform && ts.isPropertyAssignment(transform) ? transform.initializer.getText(source) : '';
  if (transformName === 'booleanAttribute') return 'boolean';
  if (transformName === 'numberAttribute') return 'number';
  const value = call.arguments[0];
  if (!value) return 'unknown';
  if (value.kind === ts.SyntaxKind.TrueKeyword || value.kind === ts.SyntaxKind.FalseKeyword)
    return 'boolean';
  if (ts.isStringLiteralLike(value)) return 'string';
  if (ts.isNumericLiteral(value)) return 'number';
  return 'unknown';
}

/** Type aliases declared in the file (`export type IntCardContentGap = 'none' | …`), by name. */
function localAliases(source) {
  const aliases = new Map();
  for (const statement of source.statements)
    if (ts.isTypeAliasDeclaration(statement))
      aliases.set(statement.name.text, statement.type.getText(source).replace(/\s+/g, ' '));
  return aliases;
}

/** Class decorated with @Component (the int-* base). */
function componentClass(source) {
  return source.statements.find(
    (s) =>
      ts.isClassDeclaration(s) &&
      ts.getDecorators?.(s)?.some((d) => /^Component\b/.test(d.expression.getText(source))),
  );
}

/** inputs, outputs, templates and methods of base/<id>.ts. */
function extractClass(code, api) {
  const source = ts.createSourceFile('base.ts', code, ts.ScriptTarget.Latest, true);
  const cls = componentClass(source);
  if (!cls) return;
  const replica = /PrimeNG/.test(jsDocOf(cls));
  const aliases = localAliases(source);

  for (const member of cls.members) {
    if (
      hasModifier(member, ts.SyntaxKind.StaticKeyword) ||
      !member.name ||
      !ts.isIdentifier(member.name)
    )
      continue;
    const name = member.name.text;
    const hidden =
      hasModifier(member, ts.SyntaxKind.PrivateKeyword) ||
      hasModifier(member, ts.SyntaxKind.ProtectedKeyword);
    const info = describe(jsDocOf(member), replica);

    if (ts.isMethodDeclaration(member)) {
      if (hidden || LIFECYCLE.test(name)) continue;
      const params = member.parameters.map((p) => p.getText(source)).join(', ');
      const returns = member.type ? member.type.getText(source) : 'void';
      api.methods.push({ name, signature: `${name}(${params}): ${returns}`, ...info });
      continue;
    }

    const call = ts.isPropertyDeclaration(member) ? member.initializer : undefined;
    if (!call || !ts.isCallExpression(call)) continue;
    const callee = calleeOf(call);
    if (!callee) continue;

    // Templates by reference are usually protected: they are part of the API anyway.
    if (callee.fn === 'contentChild' || callee.fn === 'contentChildren') {
      const ref = call.arguments[0];
      const generic = call.typeArguments?.[0]?.getText(source) ?? '';
      if (!ref || !ts.isStringLiteralLike(ref) || !/TemplateRef/.test(generic)) continue;
      const context = /TemplateRef<(.+)>/.exec(generic)?.[1].trim();
      api.templates.push({
        name: ref.text,
        ...(context && context !== 'unknown' && context !== 'any' ? { context } : {}),
        ...info,
      });
      continue;
    }
    if (hidden) continue;

    if (SIGNAL_INPUTS.has(callee.fn)) {
      const type = inputType(call, source);
      const values = aliases.get(type);
      const initial = callee.required ? undefined : call.arguments[0]?.getText(source);
      const fallback = defaultTagOf(member) ?? initial;
      api.inputs.push({
        name,
        type,
        ...(values ? { values } : {}),
        ...(fallback !== undefined ? { default: fallback } : {}),
        ...(callee.required ? { required: true } : {}),
        ...(callee.fn === 'model' ? { twoWay: true } : {}),
        ...info,
      });
    } else if (callee.fn === 'output') {
      api.outputs.push({ name, type: call.typeArguments?.[0]?.getText(source) ?? 'void', ...info });
    }
  }
}

/** <ng-content> of base/<id>.html: the default slot and each select="…". */
function extractContent(html, api) {
  const markup = html.replace(/<!--[\s\S]*?-->/g, '');
  for (const match of markup.matchAll(/<ng-content\b([^>]*)>/g)) {
    const select = /\bselect\s*=\s*"([^"]+)"/.exec(match[1])?.[1];
    api.templates.push(
      select
        ? { name: select, slot: true, description: `Contenido proyectado con select="${select}".` }
        : {
            name: 'default',
            slot: true,
            description: 'Contenido proyectado entre las etiquetas del componente.',
          },
    );
  }
}

/** --int-* tokens declared in the :root of styles/_<id>.scss, with their group and origin comment. */
function extractTokens(scss, api) {
  const root = /:root\s*\{([\s\S]*?)\n\}/.exec(scss)?.[1] ?? '';
  let group;
  for (const line of root.split('\n')) {
    const header = TOKEN_GROUP.exec(line);
    if (header) {
      group = header[1];
      continue;
    }
    const token = TOKEN_LINE.exec(line);
    if (token)
      api.tokens.push({
        name: token[1],
        value: token[2].trim(),
        ...(group ? { group } : {}),
        ...(token[3] ? { source: token[3].trim() } : {}),
      });
  }
}

/**
 * Source file with LF line breaks: Windows checkouts use CRLF, and `.` stops at the CR, so the `$` of
 * the token regexes would never match.
 */
const readSource = (path) => readFileSync(path, 'utf8').replace(/\r\n?/g, '\n');

/** API of one version; missing files only leave their blocks empty. */
export function extractApi({ ts: tsPath, html: htmlPath, scss: scssPath }) {
  const api = empty();
  if (existsSync(tsPath)) extractClass(readSource(tsPath), api);
  if (htmlPath && existsSync(htmlPath)) extractContent(readSource(htmlPath), api);
  if (scssPath && existsSync(scssPath)) extractTokens(readSource(scssPath), api);
  return api;
}

/** true = no block has entries (a version still in template state). */
export const isEmptyApi = (api) => Object.values(api).every((block) => block.length === 0);
