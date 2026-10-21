import { parseDocHtml } from './doc-html';

describe('parseDocHtml', () => {
  it('reads the title and description header and leaves the rest as body', () => {
    const html = parseDocHtml(
      '<!--\r\n  title: Raised\r\n  description: Raised buttons display\r\n    a shadow.\r\n-->\r\n\r\n<int-button />\r\n',
    );
    expect(html.meta).toEqual({ title: 'Raised', description: 'Raised buttons display a shadow.' });
    expect(html.body).toBe('<int-button />');
    expect(html.pending).toBeFalse();
  });

  it('omits empty header values', () => {
    expect(parseDocHtml('<!--\n  title: Basic\n  description:\n-->\n').meta).toEqual({ title: 'Basic' });
  });

  it('is pending when empty or with only comments', () => {
    expect(parseDocHtml('').pending).toBeTrue();
    expect(parseDocHtml(undefined).pending).toBeTrue();
    expect(parseDocHtml('<!--\n  title: Basic\n-->\n').pending).toBeTrue();
    expect(parseDocHtml('<!--\n  title: Basic\n-->\n<!-- TODO -->\n\n<!-- otro -->').pending).toBeTrue();
    expect(parseDocHtml('<!-- sin cabecera -->').pending).toBeTrue();
    expect(parseDocHtml('<!--\n  title: Basic\n-->\ntexto').pending).toBeFalse();
  });

  it('keeps a leading comment without title/description as part of the body', () => {
    const html = parseDocHtml('<!-- note -->\n<int-chip />');
    expect(html.meta).toEqual({});
    expect(html.body).toBe('<!-- note -->\n<int-chip />');
  });
});
