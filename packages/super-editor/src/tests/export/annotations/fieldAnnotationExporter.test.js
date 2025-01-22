import { getExportedResultForAnnotations, getTextFromNode } from '../export-helpers/index.js';

describe('AnnotationNodeExporter', async () => {
  window.URL.createObjectURL = vi.fn().mockImplementation((file) => {
    return file.name;
  });
  
  const { result, params } = await getExportedResultForAnnotations(false);
  const body = {};

  beforeEach(() => {
    Object.assign(body, result.elements?.find((el) => el.name === 'w:body'));
  });
  
  it('export text annotation correctly', async() => {
    expect(body.elements[0].elements[1].elements[0].elements[4].attributes['w:val']).toBe('text');
    const text = getTextFromNode(body.elements[0].elements[1].elements[1]);
    expect(text).toEqual('Vladyslava Andrushchenko');
  });

  it('export image annotation correctly', async() => {
    const tag = body.elements[2].elements[1].elements[0];
    expect(tag.elements[4].attributes['w:val']).toBe('image');
    const extentTag = body.elements[2].elements[1].elements[1].elements[0].elements[0].elements[0].elements[0];
    expect(extentTag.attributes.cx).toBe(4286250);
    expect(extentTag.attributes.cy).toBe(4286250);
    const mediaIds = Object.keys(params.media);
    expect(mediaIds[0].replace('_', '-').startsWith(tag.elements[0].attributes['w:val'])).toBe(true);
  });

  it('export signature annotation correctly', async() => {
    const tag = body.elements[4].elements[1].elements[0];
    expect(tag.elements[4].attributes['w:val']).toBe('signature');
    const mediaIds = Object.keys(params.media);
    expect(mediaIds[1].replace('_', '-').startsWith(tag.elements[0].attributes['w:val'])).toBe(true);
  });

  it('export checkbox annotation correctly', async() => {
    expect(body.elements[6].elements[1].elements[0].elements[4].attributes['w:val']).toBe('checkbox');
    const text = getTextFromNode(body.elements[6].elements[1].elements[1]);
    expect(text).toEqual('x');
  });

  it('export paragraph annotation correctly', async() => {
    expect(body.elements[8].elements[1].elements[0].elements[4].attributes['w:val']).toBe('html');
    const text = getTextFromNode(body.elements[8].elements[1].elements[1].elements[0]);
    expect(text).toEqual('test paragraph data');
  });

  it('export url annotation correctly', async() => {
    expect(body.elements[10].elements[1].elements[0].elements[4].attributes['w:val']).toBe('link');
    const text = getTextFromNode(body.elements[10].elements[1].elements[1].elements[0]);
    expect(text).toEqual('https://vitest.dev/guide/coverage');
    expect(params.relationships[2].attributes.Target).toBe('https://vitest.dev/guide/coverage');
  });
});
