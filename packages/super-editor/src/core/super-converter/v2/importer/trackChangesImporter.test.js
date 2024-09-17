import {SuperConverter} from "../../SuperConverter.js";
import {handleTrackChangeNode, handleDelText} from "./trackChangesImporter.js";
import {
    createNodeListHandlerMock,
    numberingBulletXml,
    numberingNodeChangeXml,
    stylesXml
} from "./test-helpers/testUtils.test.js";
import {
    TrackChangeBlockChangeAttributeName,
    TrackDeleteMarkName,
    TrackInsertMarkName,
    TrackMarksMarkName
} from "../../../../extensions/track-changes/constants.js";
import {parseXmlToJson} from "../docxHelper.js";
import {defaultNodeListHandler} from "./docxImporter.js";

describe('TrackChangesImporter', () => {
    it("parses only track change nodes", () => {
        const names = Object.keys(SuperConverter.allowedElements).filter((name) => name !== 'w:del' && name !== 'w:ins');
        const nodesOfNodes = names.map((name) => ([{name}]));
        for(const nodes of nodesOfNodes) {
            const result = handleTrackChangeNode(nodes, null, null, false);
            expect(result.length).toBe(0);
        }
    });

    it("parses track change del node and their attributes", () => {
        const nodes = [{
            name: 'w:del',
            attributes: {'w:id': '1', 'w:date': '2023-10-01', 'w:author': 'Author'},
            elements: [
                {name: 'w:t', attributes: {}, elements: [{text: 'This is a test text!'}]}
            ]}];
        const result = handleTrackChangeNode(nodes, null, createNodeListHandlerMock(), false);
        expect(result.length).toBe(1);
        expect(result[0].marks[0].type).toBe(TrackDeleteMarkName);
        expect(result[0].marks[0].attrs).toEqual({wid: '1', date: '2023-10-01', author: 'Author'});
    });

    it("parses track change ins node and their attributes", () => {
        const nodes = [{
            name: 'w:ins',
            attributes: {'w:id': '1', 'w:date': '2023-10-01', 'w:author': 'Author'},
            elements: [
                {name: 'w:t', attributes: {}, elements: [{text: 'This is a test text!'}]}
            ]}];
        const result = handleTrackChangeNode(nodes, null, createNodeListHandlerMock(), false);
        expect(result.length).toBe(1);
        expect(result[0].marks[0].type).toBe(TrackInsertMarkName);
        expect(result[0].marks[0].attrs).toEqual({wid: '1', date: '2023-10-01', author: 'Author'});
    });
});


describe("trackChanges live xml test", () => {
    const inserXml = `<w:ins w:id="0" w:author="torcsi@harbourcollaborators.com" w:date="2024-09-02T15:56:00Z">
        <w:r>
            <w:rPr>
                <w:lang w:val="en-US"/>
            </w:rPr>
            <w:t xml:space="preserve">short </w:t>
        </w:r>
    </w:ins>`
    const deleteXml = `<w:del w:id="1" w:author="torcsi@harbourcollaborators.com" w:date="2024-09-02T15:56:00Z">
        <w:r w:rsidDel="00661ED0">
            <w:rPr>
                <w:lang w:val="en-US"/>
            </w:rPr>
            <w:delText xml:space="preserve">long </w:delText>
        </w:r>
    </w:del>`
    const markChangeXml = `<w:p>
        <w:r w:rsidRPr="00A37CF0">
            <w:rPr>
              <w:b/>
              <w:bCs/>
              <w:lang w:val="en-US"/>
              <w:rPrChange w:id="2" w:author="torcsi@harbourcollaborators.com" w:date="2024-09-04T09:29:00Z">
                <w:rPr>
                  <w:lang w:val="en-US"/>
                </w:rPr>
              </w:rPrChange>
            </w:rPr>
            <w:t>that</w:t>
        </w:r>
    </w:p>`

    it("parses insert xml", () => {
        const nodes = parseXmlToJson(inserXml).elements
        const result = handleTrackChangeNode(nodes, null, defaultNodeListHandler(), false);
        expect(result.length).toBe(1);
        const insertionMark = result[0].marks.find(mark => mark.type === TrackInsertMarkName);
        expect(insertionMark).toBeDefined();
        expect(insertionMark.attrs).toEqual({
            wid: '0',
            date: '2024-09-02T15:56:00Z',
            author: 'torcsi@harbourcollaborators.com',
        });
        expect(result[0].text).toBe('short ');
    });
    it("parses delete xml", () => {
        const nodes = parseXmlToJson(deleteXml).elements
        const result = handleTrackChangeNode(nodes, null, defaultNodeListHandler(), false);
        expect(result.length).toBe(1);
        const deletionMark = result[0].marks.find(mark => mark.type === TrackDeleteMarkName);
        expect(deletionMark).toBeDefined();
        expect(deletionMark.attrs).toEqual({
            wid: '1',
            date: '2024-09-02T15:56:00Z',
            author: 'torcsi@harbourcollaborators.com',
        });
        expect(result[0].text).toBe('long ');
    });
    it("parses mark change xml", () => {
        const nodes = parseXmlToJson(markChangeXml).elements
        const handler = defaultNodeListHandler()
        const result = handler.handler(nodes, null, false);
        expect(result.length).toBe(1);
        expect(result[0].type).toBe('paragraph');
        expect(result[0].content.length).toBe(1);
        const changeMark = result[0].content[0].marks.find(mark => mark.type === TrackMarksMarkName);
        expect(changeMark).toBeDefined();
        expect(changeMark.attrs).toEqual({
            wid: '2',
            date: '2024-09-04T09:29:00Z',
            author: 'torcsi@harbourcollaborators.com',
            before: [
                {
                    type: 'textStyle',
                    attrs: {}
                }
            ],
            after: [
                {
                    type: 'bold',
                },
                {
                    type: 'textStyle',
                    attrs: {}
                },
            ]
        });
    });
    it("heading to title conversion", () => {
        const xml = `<w:p w14:paraId="0F692378" w14:textId="2C001F23" w:rsidR="00327792" w:rsidRDefault="00327792"
                         w:rsidP="00327792">
            <w:pPr>
                <w:pStyle w:val="Heading1"/>
                <w:rPr>
                    <w:lang w:val="en-US"/>
                </w:rPr>
                <w:pPrChange w:id="0" w:author="torcsi@harbourcollaborators.com" w:date="2024-09-09T16:29:00Z">
                    <w:pPr>
                        <w:pStyle w:val="Title"/>
                    </w:pPr>
                </w:pPrChange>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:lang w:val="en-US"/>
                </w:rPr>
                <w:t>This was a title1</w:t>
            </w:r>
        </w:p>`
        const nodes = parseXmlToJson(xml).elements
        const styles = parseXmlToJson(stylesXml)
        const docx = {
            'word/styles.xml': styles
        }
        const handler = defaultNodeListHandler()
        const result = handler.handler(nodes, docx, false);
        expect(result.length).toBe(1);
        console.log(result)
    });
    it("list to paragraph conversion", () => {
        const xml = `<w:p w14:paraId="7DB8C83A" w14:textId="2172A646" w:rsidR="00327792" w:rsidRPr="00327792" w:rsidRDefault="00327792"
                w:rsidP="00327792">
              <w:pPr>
                <w:rPr>
                  <w:lang w:val="en-US"/>
                </w:rPr>
                <w:pPrChange w:id="2" w:author="torcsi@harbourcollaborators.com" w:date="2024-09-09T16:29:00Z">
                  <w:pPr>
                    <w:pStyle w:val="ListParagraph"/>
                    <w:numPr>
                      <w:numId w:val="1"/>
                    </w:numPr>
                    <w:ind w:hanging="360"/>
                  </w:pPr>
                </w:pPrChange>
              </w:pPr>
              <w:r w:rsidRPr="00327792">
                <w:rPr>
                  <w:lang w:val="en-US"/>
                </w:rPr>
                <w:t>This was an ordered list</w:t>
              </w:r>
            </w:p>`
        const nodes = parseXmlToJson(xml).elements
        const styles = parseXmlToJson(stylesXml)
        const numbering = parseXmlToJson(numberingNodeChangeXml)
        const docx = {
            'word/styles.xml': styles,
            'word/numbering.xml': numbering
        }
        const handler = defaultNodeListHandler()
        const result = handler.handler(nodes, docx, false);
        expect(result.length).toBe(1);
        expect(result[0].type).toBe('paragraph');
        const track = result[0].attrs.track
        expect(track).toBeDefined();
        expect(track.length).toBe(1);
        expect(track[0].type).toBe(TrackDeleteMarkName);
        expect(track[0].wid).toBe('2');
        expect(track[0].author).toBe('torcsi@harbourcollaborators.com');
        expect(track[0].date).toBe('2024-09-09T16:29:00Z');
        expect(track[0].before).toBeDefined();
        expect(track[0].before.wrappers).toBeDefined();
        expect(track[0].before.wrappers.length).toBe(2);
        expect(track[0].before.wrappers[0].type).toBe('orderedList');
        expect(track[0].before.wrappers[1].type).toBe('listItem');
    });
    it("unordered list changed to ordered list", () => {
        const xml = `<w:p w14:paraId="5871FBDB" w14:textId="37C2FF06" w:rsidR="00327792" w:rsidRPr="00327792" w:rsidRDefault="00327792"
                 w:rsidP="00327792">
              <w:pPr>
                <w:pStyle w:val="ListParagraph"/>
                <w:numPr>
                  <w:ilvl w:val="0"/>
                  <w:numId w:val="3"/>
                </w:numPr>
                <w:rPr>
                  <w:lang w:val="en-US"/>
                </w:rPr>
                <w:pPrChange w:id="3" w:author="torcsi@harbourcollaborators.com" w:date="2024-09-09T16:29:00Z">
                  <w:pPr>
                    <w:pStyle w:val="ListParagraph"/>
                    <w:numPr>
                      <w:numId w:val="2"/>
                    </w:numPr>
                    <w:ind w:hanging="360"/>
                  </w:pPr>
                </w:pPrChange>
              </w:pPr>
              <w:r>
                <w:rPr>
                  <w:lang w:val="en-US"/>
                </w:rPr>
                <w:t>This was an unordered list</w:t>
              </w:r>
            </w:p>`
        const nodes = parseXmlToJson(xml).elements
        const styles = parseXmlToJson(stylesXml)
        const numbering = parseXmlToJson(numberingNodeChangeXml)
        const docx = {
            'word/styles.xml': styles,
            'word/numbering.xml': numbering
        }
        const handler = defaultNodeListHandler()
        const result = handler.handler(nodes, docx, false);
        expect(result.length).toBe(1);
        expect(result[0].type).toBe('orderedList');
        const track = result[0].attrs.track
        expect(track).toBeDefined();
        expect(track.length).toBe(1);
        expect(track[0].type).toBe(TrackChangeBlockChangeAttributeName);
        expect(track[0].wid).toBe('3');
        expect(track[0].author).toBe('torcsi@harbourcollaborators.com');
        expect(track[0].date).toBe('2024-09-09T16:29:00Z');
        expect(track[0].before).toBeDefined();
        expect(track[0].before.type).toBeDefined();
        expect(track[0].before.type).toBe('bulletList');
    });
});