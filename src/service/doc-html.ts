import { DocMeta } from './catalog.model';

const META_COMMENT = /^<!--([\s\S]*?)-->\s*/;
const META_KEY = /^\s*(title|description|figma)\s*:\s*(.*)$/;

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
 * base/<id>.html only, a `figma:` line (empty until there is a Figma link to the design). Angular drops comments, so the header never renders.
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
      key = match[1] as keyof DocMeta;
      meta[key] = match[2].trim();
    } else if (key && line.trim()) {
      meta[key] = `${meta[key]} ${line.trim()}`.trim();
    }
  }
  if (!meta.title) delete meta.title;
  if (!meta.description) delete meta.description;
  if (!meta.figma) delete meta.figma;

  return { meta, body, pending: !body.replace(/<!--[\s\S]*?(-->|$)/g, '').trim() };
}
