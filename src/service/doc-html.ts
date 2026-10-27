import { DocMeta } from './catalog.model';

const META_COMMENT = /^<!--([\s\S]*?)-->\s*/;
const META_KEY = /^\s*(title|description|figma-frame|figma)\s*:\s*(.*)$/;

/** Header keys written in kebab-case, as DocMeta properties. */
const META_PROPERTY: Readonly<Record<string, keyof DocMeta>> = { 'figma-frame': 'figmaFrame' };

export interface DocHtml {
  /** Values of the header comment (only the ones that are not empty). */
  readonly meta: DocMeta;
  /** The file without its header: what the code panel shows. */
  readonly body: string;
  /** Empty or only comments: nothing to render yet ("Preview pending"). */
  readonly pending: boolean;
}

/**
 * Reads the documentation header of base/<id>.html or variants/<slug>/example.html: a leading comment
 * with `title:` / `description:` lines (a description may continue on the next lines) and, in
 * base/<id>.html only, a `figma:` line (empty until there is a Figma link to the design) and an optional
 * `figma-frame:` line (parent frame with every variant and format). Angular drops comments, so the header never renders.
 *   <!--
 *     title: Raised
 *     description: Raised buttons display a shadow to indicate elevation.
 *   -->
 */
export function parseDocHtml(source = ''): DocHtml {
  const text = source.replace(/\r\n/g, '\n').trim();
  const comment = META_COMMENT.exec(text);
  const lines = comment?.[1].split('\n') ?? [];
  const hasHeader = lines.some((line) => META_KEY.test(line));
  const body = hasHeader ? text.slice(comment![0].length).trim() : text;

  const meta: { -readonly [K in keyof DocMeta]: DocMeta[K] } = {};
  let key: keyof DocMeta | undefined;
  for (const line of hasHeader ? lines : []) {
    const match = META_KEY.exec(line);
    if (match) {
      key = META_PROPERTY[match[1]] ?? (match[1] as keyof DocMeta);
      meta[key] = match[2].trim();
    } else if (key && line.trim()) {
      meta[key] = `${meta[key]} ${line.trim()}`.trim();
    }
  }
  if (!meta.title) delete meta.title;
  if (!meta.description) delete meta.description;
  if (!meta.figma) delete meta.figma;
  if (!meta.figmaFrame) delete meta.figmaFrame;

  return { meta, body, pending: !body.replace(/<!--[\s\S]*?(-->|$)/g, '').trim() };
}
