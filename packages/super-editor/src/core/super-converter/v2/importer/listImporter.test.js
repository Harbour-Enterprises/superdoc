import {parseXmlToJson} from "../docxHelper.js";
import {handleAllTableNodes} from "./tableImporter.js";
import {defaultNodeListHandler} from "./docxImporter.js";
import {handleListNode} from "./listImporter.js";
import {numberingBulletXml} from "./test-helpers/testUtils.test.js";


describe("table live xml test", () => {
    it("parses simple bullet xml", () => {
        const exampleSingleBulletXml = `
            <w:p w14:paraId="4193DBDF" w14:textId="45C3B4F4" w:rsidR="003C58BC" w:rsidRDefault="004C5EF1" w:rsidP="004C5EF1">
              <w:pPr>
                <w:pStyle w:val="ListParagraph"/>
                <w:numPr>
                  <w:ilvl w:val="0"/>
                  <w:numId w:val="2"/>
                </w:numPr>
              </w:pPr>
              <w:r>
                <w:t>TEXTITEM</w:t>
              </w:r>
            </w:p>
        `;
        const nodes = parseXmlToJson(exampleSingleBulletXml).elements
        const numbering = parseXmlToJson(numberingBulletXml)
        const docx = {
            'word/numbering.xml': numbering
        }

        const result = handleListNode(nodes, docx, defaultNodeListHandler(), false);
        expect(result.nodes.length).toBe(1);
        expect(result.nodes[0].type).toBe("bulletList");
        expect(result.nodes[0].content.length).toBe(1);
        expect(result.nodes[0].content[0].type).toBe("listItem");
        expect(result.nodes[0].content[0].content.length).toBe(1);
        expect(result.nodes[0].content[0].content[0].type).toBe("paragraph");
        expect(result.nodes[0].content[0].content[0].content.length).toBe(1);
        expect(result.nodes[0].content[0].content[0].content[0].type).toBe("text");
        expect(result.nodes[0].content[0].content[0].content[0].text).toBe("TEXTITEM");
    });

    it("parses simple numbered xml", () => {
        const exampleSingleNumberedXml = `
            <w:p w14:paraId="6E8C9275" w14:textId="7B0D8623" w:rsidR="00F07931" w:rsidRDefault="00F07931" w:rsidP="00F07931">
              <w:pPr>
                <w:pStyle w:val="ListParagraph"/>
                <w:numPr>
                  <w:ilvl w:val="0"/>
                  <w:numId w:val="3"/>
                </w:numPr>
              </w:pPr>
              <w:r>
                <w:t>numbered</w:t>
              </w:r>
            </w:p>
            `;
        const nodes = parseXmlToJson(exampleSingleNumberedXml).elements
        const numbering = parseXmlToJson(numberingBulletXml)
        const docx = {
            'word/numbering.xml': numbering
        }

        const result = handleListNode(nodes, docx, defaultNodeListHandler(), false);
        expect(result.nodes.length).toBe(1);
        expect(result.nodes[0].type).toBe("orderedList");
        expect(result.nodes[0].content.length).toBe(1);
        expect(result.nodes[0].content[0].type).toBe("listItem");
        expect(result.nodes[0].content[0].content.length).toBe(1);
        expect(result.nodes[0].content[0].content[0].type).toBe("paragraph");
        expect(result.nodes[0].content[0].content[0].content.length).toBe(1);
        expect(result.nodes[0].content[0].content[0].content[0].type).toBe("text");
        expect(result.nodes[0].content[0].content[0].content[0].text).toBe("numbered");
    });


    it("parses multi nested list xml", () => {
        const exampleMultiNestedListXml = `<w:body>
            <w:p w14:paraId="3476A9BD" w14:textId="4D3C51EE" w:rsidR="003C58BC" w:rsidRDefault="00B12030" w:rsidP="00B12030">
              <w:pPr>
                <w:pStyle w:val="ListParagraph"/>
                <w:numPr>
                  <w:ilvl w:val="0"/>
                  <w:numId w:val="1"/>
                </w:numPr>
              </w:pPr>
              <w:r>
                <w:t>L1: A</w:t>
              </w:r>
            </w:p>
            <w:p w14:paraId="37CDE856" w14:textId="04A6D3BD" w:rsidR="00B12030" w:rsidRDefault="00B12030" w:rsidP="00B12030">
              <w:pPr>
                <w:pStyle w:val="ListParagraph"/>
                <w:numPr>
                  <w:ilvl w:val="1"/>
                  <w:numId w:val="1"/>
                </w:numPr>
              </w:pPr>
              <w:r>
                <w:t>L2: B</w:t>
              </w:r>
            </w:p>
            <w:p w14:paraId="66C45FD5" w14:textId="50DEB0D0" w:rsidR="00B12030" w:rsidRDefault="00B12030" w:rsidP="00B12030">
              <w:pPr>
                <w:pStyle w:val="ListParagraph"/>
                <w:numPr>
                  <w:ilvl w:val="0"/>
                  <w:numId w:val="1"/>
                </w:numPr>
              </w:pPr>
              <w:r>
                <w:t>L1: C</w:t>
              </w:r>
            </w:p>
            <w:p w14:paraId="3709ED12" w14:textId="0A320344" w:rsidR="00B12030" w:rsidRDefault="00B12030" w:rsidP="00B12030">
              <w:pPr>
                <w:pStyle w:val="ListParagraph"/>
                <w:numPr>
                  <w:ilvl w:val="1"/>
                  <w:numId w:val="1"/>
                </w:numPr>
              </w:pPr>
              <w:r>
                <w:t>L2: D</w:t>
              </w:r>
            </w:p>
            <w:p w14:paraId="04F6CB86" w14:textId="72446E43" w:rsidR="00B12030" w:rsidRDefault="00B12030" w:rsidP="00B12030">
              <w:pPr>
                <w:pStyle w:val="ListParagraph"/>
                <w:numPr>
                  <w:ilvl w:val="2"/>
                  <w:numId w:val="1"/>
                </w:numPr>
              </w:pPr>
              <w:r>
                <w:t>L3: E</w:t>
              </w:r>
            </w:p>
            <w:p w14:paraId="2B93B5C3" w14:textId="5C163631" w:rsidR="00B12030" w:rsidRDefault="00B12030" w:rsidP="00B12030">
              <w:pPr>
                <w:pStyle w:val="ListParagraph"/>
                <w:numPr>
                  <w:ilvl w:val="1"/>
                  <w:numId w:val="1"/>
                </w:numPr>
              </w:pPr>
              <w:r>
                <w:t>L2: F</w:t>
              </w:r>
            </w:p>
            <w:p w14:paraId="6DFE5906" w14:textId="3CA15E8A" w:rsidR="00B12030" w:rsidRDefault="00B12030" w:rsidP="00B12030">
              <w:pPr>
                <w:pStyle w:val="ListParagraph"/>
                <w:numPr>
                  <w:ilvl w:val="0"/>
                  <w:numId w:val="1"/>
                </w:numPr>
              </w:pPr>
              <w:r>
                <w:t>L1: G</w:t>
              </w:r>
            </w:p>
        </w:body>`;
        const nodes = parseXmlToJson(exampleMultiNestedListXml).elements[0].elements
        const numbering = parseXmlToJson(numberingBulletXml)
        const docx = {
            'word/numbering.xml': numbering
        }

        const result = handleListNode(nodes, docx, defaultNodeListHandler(), false);
        expect(result.nodes.length).toBe(1);
        expect(result.nodes[0].type).toBe("bulletList");
        expect(result.nodes[0].content.length).toBe(3);
        expect(result.nodes[0].content[0].type).toBe("listItem");
        expect(result.nodes[0].content[0].content.length).toBe(2);
        expect(result.nodes[0].content[0].content[0].type).toBe("paragraph");
        expect(result.nodes[0].content[0].content[0].content.length).toBe(1);
        expect(result.nodes[0].content[0].content[0].content[0].type).toBe("text");
        expect(result.nodes[0].content[0].content[0].content[0].text).toBe("L1: A");
        expect(result.nodes[0].content[0].content[1].type).toBe("bulletList");
        expect(result.nodes[0].content[0].content[1].content.length).toBe(1);
        expect(result.nodes[0].content[0].content[1].content[0].type).toBe("listItem");
        expect(result.nodes[0].content[0].content[1].content[0].content.length).toBe(1);
        expect(result.nodes[0].content[0].content[1].content[0].content[0].type).toBe("paragraph");
        expect(result.nodes[0].content[0].content[1].content[0].content[0].content.length).toBe(1);
        expect(result.nodes[0].content[0].content[1].content[0].content[0].content[0].type).toBe("text");
        expect(result.nodes[0].content[0].content[1].content[0].content[0].content[0].text).toBe("L2: B");
    });

});