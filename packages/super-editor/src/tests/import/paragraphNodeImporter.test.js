
import { handleParagraphNode } from '@converter/v2/importer/paragraphNodeImporter.js';
import { defaultNodeListHandler } from '@converter/v2/importer/docxImporter.js';
import { getTestDataByFolderName } from '@tests/helpers/helpers.js';


describe('paragraph tests to check spacing', () => {
  it('correctly gets spacing [paragraph_spacing_missing]', () => {
    const dataName = 'paragraph_spacing_missing';
    const docx = getTestDataByFolderName(dataName);
    const documentXml = docx['word/document.xml'];

    const doc = documentXml.elements[0];
    const body = doc.elements[0];
    const content = body.elements;
    const { nodes } = handleParagraphNode([content[0]], docx, defaultNodeListHandler(), false);

    const node = nodes[0];
    expect(node.type).toBe('paragraph');
    expect(node.content.length).toBeGreaterThan(0);

    const { attrs } = node;
    const { spacing } = attrs;
    expect(spacing.line).toBe(18);
    expect(spacing.lineSpaceAfter).toBe(16);
    expect(spacing.lineSpaceBefore).toBe(16);
  });

  it('correctly gets spacing [line_space_table]', () => {
    const dataName = 'line_space_table';
    const docx = getTestDataByFolderName(dataName);
    const documentXml = docx['word/document.xml'];

    const doc = documentXml.elements[0];
    const body = doc.elements[0];
    const content = body.elements;

    const tblNode = content[1];
    const trNode = tblNode.elements[2];
    const tcNode = trNode.elements[1];

    // Check all nodes after the known tcPr
    const { nodes } = handleParagraphNode(tcNode.elements.slice(1), docx, defaultNodeListHandler(), false);
    const node = nodes[0];

    expect(node.type).toBe('paragraph');
    expect(node.content.length).toBeGreaterThan(0);

    const { attrs } = node;
    const { spacing } = attrs;

    expect(spacing.line).toBe(18);
    expect(spacing.lineSpaceAfter).toBe(0);
    expect(spacing.lineSpaceBefore).toBe(0);
  });
});
