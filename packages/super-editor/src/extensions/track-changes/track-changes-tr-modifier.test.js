import {EditorState, TextSelection} from "prosemirror-state";
import {Fragment, Slice} from "prosemirror-model";
import {findWrapping, liftTarget} from "prosemirror-transform";
import {Schema} from "../../core/index.js";
import {getStarterExtensions} from "../index.js";
import {trackTransaction} from "./track-changes-tr-modifier.js";
import {
    TrackChangeBlockChangeAttributeName,
    TrackDeleteMarkName,
    TrackInsertMarkName,
    TrackMarksMarkName
} from "./constants.js";
import {applyTrackChanges} from "./track-changes-base.js";
import {liftListItem} from "../../core/commands/index.js";

const createEmptyDocState = () => {
    const emptyDoc = {content: [], type: "doc"}
    const schema = Schema.createSchemaByExtensions(getStarterExtensions())
    const doc = schema.nodeFromJSON(emptyDoc);
    return EditorState.create({
        schema,
        doc,
    });
}

describe('Track Changes TR Modifier', () => {
    describe("handleReplaceStep", () => {
        it("marks insertions", () => {
            //init
            const state = createEmptyDocState();
            //mod
            const tr = state.tr;
            const node = state.schema.text("test");
            tr.insert(0, node);
            const state2 = state.apply(trackTransaction(tr, state, "TestUser1"));
            //check
            const doc2Json = state2.doc.toJSON();
            expect(doc2Json.content.length).toBe(1);
            expect(doc2Json.content[0].content.length).toBe(1);
            expect(doc2Json.content[0].content[0].text).toEqual("test");
            expect(doc2Json.content[0].content[0].marks.length).toBe(1);
            expect(doc2Json.content[0].content[0].marks[0].type).toBe(TrackInsertMarkName);
            expect(doc2Json.content[0].content[0].marks[0].attrs.author).toBe("TestUser1");
        });
        it("marks deletions", () => {
            //init
            const state = createEmptyDocState();
            //mod
            const tr = state.tr;
            const node = state.schema.text("test");
            tr.insert(0, node);
            const state2 = state.apply(tr);
            const tr2 = state2.tr;
            tr2.delete(1, 5);
            const state3 = state2.apply(trackTransaction(tr2, state2, "TestUser1"))
            //check
            const doc3Json = state3.doc.toJSON();
            expect(doc3Json.content.length).toBe(1);
            expect(doc3Json.content[0].content.length).toBe(1);
            expect(doc3Json.content[0].content[0].text).toEqual("test");
            expect(doc3Json.content[0].content[0].marks.length).toBe(1);
            expect(doc3Json.content[0].content[0].marks[0].type).toBe(TrackDeleteMarkName);
            expect(doc3Json.content[0].content[0].marks[0].attrs.author).toBe("TestUser1");
        });
        it("marks replace", () => {
            //init
            const state = createEmptyDocState();
            //mod
            const tr = state.tr;
            const node = state.schema.text("abcd");
            tr.insert(0, node);
            const state2 = state.apply(tr);
            const tr2 = state2.tr;
            tr2.replace(1, 5, new Slice(Fragment.from(state2.schema.text("dcba")), 0, 0));
            const state3 = state2.apply(trackTransaction(tr2, state2, "TestUser1"))
            //check
            const doc3Json = state3.doc.toJSON();
            expect(doc3Json.content.length).toBe(1);
            expect(doc3Json.content[0].content.length).toBe(2);
            expect(doc3Json.content[0].content[0].text).toEqual("abcd");
            expect(doc3Json.content[0].content[0].marks.length).toBe(1);
            expect(doc3Json.content[0].content[0].marks[0].type).toBe(TrackDeleteMarkName);
            expect(doc3Json.content[0].content[0].marks[0].attrs.author).toBe("TestUser1");

            expect(doc3Json.content[0].content[1].text).toEqual("dcba");
            expect(doc3Json.content[0].content[1].marks.length).toBe(1);
            expect(doc3Json.content[0].content[1].marks[0].type).toBe(TrackInsertMarkName);
            expect(doc3Json.content[0].content[1].marks[0].attrs.author).toBe("TestUser1");
        });
    });
    describe("handleMarks", () => {
        it("properly handles a mark add to a non marked node", () => {
            //init
            const state = createEmptyDocState();
            //mod
            const tr = state.tr;
            const node = state.schema.text("abcd");
            tr.insert(0, node);
            const state2 = state.apply(tr);
            const tr2 = state2.tr;
            tr2.addMark(1, 5, state2.schema.marks["bold"].create());
            const state3 = state2.apply(trackTransaction(tr2, state2, "TestUser1"))
            //check
            const doc3Json = state3.doc.toJSON();
            expect(doc3Json.content.length).toBe(1);
            expect(doc3Json.content[0].content.length).toBe(1);
            expect(doc3Json.content[0].content[0].text).toEqual("abcd");
            expect(doc3Json.content[0].content[0].marks.length).toBe(2);
            const boldMark = doc3Json.content[0].content[0].marks.find(mark => mark.type === "bold");
            expect(boldMark).toBeTruthy();
            const trackMarksMark = doc3Json.content[0].content[0].marks.find(mark => mark.type === TrackMarksMarkName);
            expect(trackMarksMark).toBeTruthy();
            expect(trackMarksMark.attrs.author).toBe("TestUser1");
            expect(trackMarksMark.attrs.before).toEqual([]);
            expect(trackMarksMark.attrs.after).toEqual([{
                attrs: {},
                type: "bold"
            }]);
        })
        it("properly handles before/after marks on a node at mark add", () => {
            //init
            const state = createEmptyDocState();
            //mod
            const tr = state.tr;
            const node = state.schema.text("abcd");
            tr.insert(0, node);
            tr.addMark(1, 5, state.schema.marks["bold"].create())
            tr.addMark(1, 5, state.schema.marks["textStyle"].create({fontSize: "14pt", color: "#FF004D", fontFamily: null,}))
            const state2 = state.apply(tr);
            const tr2 = state2.tr;
            tr2.addMark(1, 5, state2.schema.marks["italic"].create());
            const state3 = state2.apply(trackTransaction(tr2, state2, "TestUser1"))
            //check
            const doc3Json = state3.doc.toJSON();
            expect(doc3Json.content.length).toBe(1);
            expect(doc3Json.content[0].content.length).toBe(1);
            expect(doc3Json.content[0].content[0].text).toEqual("abcd");
            expect(doc3Json.content[0].content[0].marks.length).toBe(4);
            const boldMark = doc3Json.content[0].content[0].marks.find(mark => mark.type === "bold");
            expect(boldMark).toBeTruthy();
            const italicMark = doc3Json.content[0].content[0].marks.find(mark => mark.type === "italic");
            expect(italicMark).toBeTruthy();
            const textStyleMark = doc3Json.content[0].content[0].marks.find(mark => mark.type === "textStyle");
            expect(textStyleMark).toBeTruthy();
            const trackMarksMark = doc3Json.content[0].content[0].marks.find(mark => mark.type === TrackMarksMarkName);
            expect(trackMarksMark).toBeTruthy();
            expect(trackMarksMark.attrs.author).toBe("TestUser1");
            expect(trackMarksMark.attrs.before).toEqual([
                {
                attrs: {},
                type: "bold"
            }, {
                attrs: {
                    color: "#FF004D",
                    fontFamily: null,
                    fontSize: "14pt"
                },
                type: "textStyle"
            }]);
            expect(trackMarksMark.attrs.after).toEqual([
                {
                    attrs: {},
                    type: "bold"
                }, {
                    attrs: {
                        color: "#FF004D",
                        fontFamily: null,
                        fontSize: "14pt"
                    },
                    type: "textStyle"
                }, {
                    attrs: {},
                    type: "italic"
                }]);
        })
        it("properly handles before/after marks on a node at mark remove", () => {
            //init
            const state = createEmptyDocState();
            //mod
            const tr = state.tr;
            const node = state.schema.text("abcd");
            tr.insert(0, node);
            tr.addMark(1, 5, state.schema.marks["bold"].create())
            tr.addMark(1, 5, state.schema.marks["textStyle"].create({fontSize: "14pt", color: "#FF004D", fontFamily: null,}))
            const state2 = state.apply(tr);
            const tr2 = state2.tr;
            tr2.removeMark(1, 5, state2.schema.marks["bold"].create());
            const state3 = state2.apply(trackTransaction(tr2, state2, "TestUser1"))
            //check
            const doc3Json = state3.doc.toJSON();
            expect(doc3Json.content.length).toBe(1);
            expect(doc3Json.content[0].content.length).toBe(1);
            expect(doc3Json.content[0].content[0].text).toEqual("abcd");
            expect(doc3Json.content[0].content[0].marks.length).toBe(2);
            const boldMark = doc3Json.content[0].content[0].marks.find(mark => mark.type === "bold");
            expect(boldMark).toBeFalsy();
            const textStyleMark = doc3Json.content[0].content[0].marks.find(mark => mark.type === "textStyle");
            expect(textStyleMark).toBeTruthy();
            const trackMarksMark = doc3Json.content[0].content[0].marks.find(mark => mark.type === TrackMarksMarkName);
            expect(trackMarksMark).toBeTruthy();
            expect(trackMarksMark.attrs.author).toBe("TestUser1");
            expect(trackMarksMark.attrs.before).toEqual([
                {
                    attrs: {},
                    type: "bold"
                }, {
                    attrs: {
                        color: "#FF004D",
                        fontFamily: null,
                        fontSize: "14pt"
                    },
                    type: "textStyle"
                }]);
            expect(trackMarksMark.attrs.after).toEqual([
                {
                    attrs: {
                        color: "#FF004D",
                        fontFamily: null,
                        fontSize: "14pt"
                    },
                    type: "textStyle"
                }]);
        })
        it("properly handles before/after marks on a node at mark attribute change", () => {
            //init
            const state = createEmptyDocState();
            //mod
            const tr = state.tr;
            const node = state.schema.text("abcd");
            tr.insert(0, node);
            tr.addMark(1, 5, state.schema.marks["bold"].create())
            const textStyleMark = state.schema.marks["textStyle"].create({fontSize: "14pt", color: "#FF004D", fontFamily: null,})
            tr.addMark(1, 5, textStyleMark)
            const state2 = state.apply(tr);
            const tr2 = state2.tr;
            tr2.removeMark(1, 5, textStyleMark);
            tr2.addMark(1, 5, state.schema.marks["textStyle"].create({fontSize: "18pt", color: "#FFFF4D", fontFamily: null,}));
            const state3 = state2.apply(trackTransaction(tr2, state2, "TestUser1"))
            //check
            const doc3Json = state3.doc.toJSON();
            expect(doc3Json.content.length).toBe(1);
            expect(doc3Json.content[0].content.length).toBe(1);
            expect(doc3Json.content[0].content[0].text).toEqual("abcd");
            expect(doc3Json.content[0].content[0].marks.length).toBe(3);
            const boldMark = doc3Json.content[0].content[0].marks.find(mark => mark.type === "bold");
            expect(boldMark).toBeTruthy();
            const textStyleMark2 = doc3Json.content[0].content[0].marks.find(mark => mark.type === "textStyle");
            expect(textStyleMark2).toBeTruthy();
            const trackMarksMark = doc3Json.content[0].content[0].marks.find(mark => mark.type === TrackMarksMarkName);
            expect(trackMarksMark).toBeTruthy();
            expect(trackMarksMark.attrs.author).toBe("TestUser1");
            expect(trackMarksMark.attrs.before).toEqual([
                {
                    attrs: {},
                    type: "bold"
                }, {
                    attrs: {
                        color: "#FF004D",
                        fontFamily: null,
                        fontSize: "14pt"
                    },
                    type: "textStyle"
                }]);
            expect(trackMarksMark.attrs.after).toEqual([
                {
                    attrs: {},
                    type: "bold"
                },
                {
                    attrs: {
                        "color": "#FFFF4D",
                        fontFamily: null,
                        fontSize: "18pt"
                    },
                    type: "textStyle"
                }]);
        })
    });
    describe("handleNodeChanges", () => {
        describe("attribute change", () => {
            test("change a H1 to H2", () => {
                //init
                const state = createEmptyDocState();
                //mod
                const tr = state.tr;
                const node = state.schema.nodes["heading"].create({level: 1}, state.schema.text("test"));
                tr.insert(0, node);
                const state2 = state.apply(tr);
                const tr2 = state2.tr;
                tr2.setNodeMarkup(0, null, {level: 2});
                const state3 = state2.apply(trackTransaction(tr2, state2, "TestUser1"))
                //check
                const doc3Json = state3.doc.toJSON();
                expect(doc3Json.content.length).toBe(1);
                expect(doc3Json.content[0].type).toBe("heading");
                expect(doc3Json.content[0].attrs.level).toBe(2);
                expect(doc3Json.content[0].attrs.track.length).toBe(1);
                expect(doc3Json.content[0].attrs.track[0].type).toBe(TrackChangeBlockChangeAttributeName);
                expect(doc3Json.content[0].attrs.track[0].author).toBe("TestUser1");
                expect(doc3Json.content[0].attrs.track[0].before.type).toBe("heading");
                expect(doc3Json.content[0].attrs.track[0].before.attrs).toEqual({
                    lineHeight: null,
                    textAlign: undefined,
                    textIndent: null,
                    level: 1,
                });
            });
            test("change a H1 to H2 and accept", () => {
                //init
                const state = createEmptyDocState();
                //mod
                const tr = state.tr;
                const node = state.schema.nodes["heading"].create({level: 1}, state.schema.text("test"));
                tr.insert(0, node);
                const state2 = state.apply(tr);
                const tr2 = state2.tr;
                tr2.setNodeMarkup(0, null, {level: 2});
                const state3 = state2.apply(trackTransaction(tr2, state2, "TestUser1"))
                const tr3 = state3.tr;
                applyTrackChanges("accept", state3, tr3, 0, state3.doc.nodeSize - 2)
                const state4 = state3.apply(tr3);
                //check
                const doc4Json = state4.doc.toJSON();
                expect(doc4Json.content.length).toBe(1);
                expect(doc4Json.content[0].type).toBe("heading");
                expect(doc4Json.content[0].attrs.level).toBe(2);
                expect(doc4Json.content[0].attrs.track.length).toBe(0);
            });
            test("change a H1 to H2 and revert", () => {
                //init
                const state = createEmptyDocState();
                //mod
                const tr = state.tr;
                const node = state.schema.nodes["heading"].create({level: 1}, state.schema.text("test"));
                tr.insert(0, node);
                const state2 = state.apply(tr);
                const tr2 = state2.tr;
                tr2.setNodeMarkup(0, null, {level: 2});
                const state3 = state2.apply(trackTransaction(tr2, state2, "TestUser1"))
                const tr3 = state3.tr;
                applyTrackChanges("revert", state3, tr3, 0, state3.doc.nodeSize - 2)
                const state4 = state3.apply(tr3);
                //check
                const doc4Json = state4.doc.toJSON();
                expect(doc4Json.content.length).toBe(1);
                expect(doc4Json.content[0].type).toBe("heading");
                expect(doc4Json.content[0].attrs.level).toBe(1);
                expect(doc4Json.content[0].attrs.track.length).toBe(0);
            });
        });
        describe("node type change", () => {
            test("change an orderedList to unorderedList", () => {
                //init
                const state = createEmptyDocState();
                //mod
                const tr = state.tr;
                const node = state.schema.nodes["orderedList"].create(null, state.schema.nodes["listItem"].create(null, state.schema.text("test")));
                tr.insert(0, node);
                const state2 = state.apply(tr);
                const tr2 = state2.tr;
                tr2.setNodeMarkup(0, state2.schema.nodes["bulletList"], null);
                const state3 = state2.apply(trackTransaction(tr2, state2, "TestUser1"))
                //check
                const doc3Json = state3.doc.toJSON();
                expect(doc3Json.content.length).toBe(1);
                expect(doc3Json.content[0].type).toBe("bulletList");
                expect(doc3Json.content[0].content.length).toBe(1);
                expect(doc3Json.content[0].content[0].type).toBe("listItem");
                expect(doc3Json.content[0].content[0].content.length).toBe(1);
                expect(doc3Json.content[0].content[0].content[0].text).toBe("test");
                expect(doc3Json.content[0].attrs.track.length).toBe(1);
                expect(doc3Json.content[0].attrs.track[0].type).toBe(TrackChangeBlockChangeAttributeName);
                expect(doc3Json.content[0].attrs.track[0].author).toBe("TestUser1");
                expect(doc3Json.content[0].attrs.track[0].before.type).toBe("orderedList");
            });
            test("change an orderedList to unorderedList and accept", () => {
                //init
                const state = createEmptyDocState();
                //mod
                const tr = state.tr;
                const node = state.schema.nodes["orderedList"].create(null, state.schema.nodes["listItem"].create(null, state.schema.text("test")));
                tr.insert(0, node);
                const state2 = state.apply(tr);
                const tr2 = state2.tr;
                tr2.setNodeMarkup(0, state2.schema.nodes["bulletList"], null);
                const state3 = state2.apply(trackTransaction(tr2, state2, "TestUser1"))
                const tr3 = state3.tr;
                applyTrackChanges("accept", state3, tr3, 0, state3.doc.nodeSize - 2)
                const state4 = state3.apply(tr3);
                //check
                const doc4Json = state4.doc.toJSON();
                expect(doc4Json.content.length).toBe(1);
                expect(doc4Json.content[0].type).toBe("bulletList");
                expect(doc4Json.content[0].content.length).toBe(1);
                expect(doc4Json.content[0].content[0].type).toBe("listItem");
                expect(doc4Json.content[0].content[0].content.length).toBe(1);
                expect(doc4Json.content[0].content[0].content[0].text).toBe("test");
                expect(doc4Json.content[0].attrs.track.length).toBe(0);
            });
            test("change an orderedList to unorderedList and revert", () => {
                //init
                const state = createEmptyDocState();
                //mod
                const tr = state.tr;
                const node = state.schema.nodes["orderedList"].create(null, state.schema.nodes["listItem"].create(null, state.schema.text("test")));
                tr.insert(0, node);
                const state2 = state.apply(tr);
                const tr2 = state2.tr;
                tr2.setNodeMarkup(0, state2.schema.nodes["bulletList"], null);
                const state3 = state2.apply(trackTransaction(tr2, state2, "TestUser1"))
                const tr3 = state3.tr;
                applyTrackChanges("revert", state3, tr3, 0, state3.doc.nodeSize - 2)
                const state4 = state3.apply(tr3);
                //check
                const doc4Json = state4.doc.toJSON();
                expect(doc4Json.content.length).toBe(1);
                expect(doc4Json.content[0].type).toBe("orderedList");
                expect(doc4Json.content[0].content.length).toBe(1);
                expect(doc4Json.content[0].content[0].type).toBe("listItem");
                expect(doc4Json.content[0].content[0].content.length).toBe(1);
                expect(doc4Json.content[0].content[0].content[0].text).toBe("test");
                expect(doc4Json.content[0].attrs.track.length).toBe(0);
            });
        });
        describe("wrap a node", () => {
           test("wrap a paragraph to an unorderedList", () => {
                //init
                const state = createEmptyDocState();
                //mod
                const tr = state.tr;
                const node = state.schema.nodes["paragraph"].create(null, state.schema.text("test"));
                tr.insert(0, node);
                const state2 = state.apply(tr);
                const tr2 = state2.tr;
                const nodeRange = state2.doc.resolve(0).blockRange(state2.doc.resolve(state2.doc.nodeSize - 2));
                const wrapParam = findWrapping(nodeRange, state2.schema.nodes["bulletList"]);
                tr2.wrap(nodeRange, wrapParam);
                const state3 = state2.apply(trackTransaction(tr2, state2, "TestUser1"))
                //check
                const doc3Json = state3.doc.toJSON();
                expect(doc3Json.content.length).toBe(1);
                expect(doc3Json.content[0].type).toBe("bulletList");
                expect(doc3Json.content[0].content.length).toBe(1);
                expect(doc3Json.content[0].content[0].type).toBe("listItem");
                expect(doc3Json.content[0].content[0].content.length).toBe(1);
                expect(doc3Json.content[0].content[0].content[0].content.length).toBe(1);
                expect(doc3Json.content[0].content[0].content[0].content[0].text).toBe("test");
                expect(doc3Json.content[0].content[0].attrs.track.length).toBe(1);
                expect(doc3Json.content[0].content[0].attrs.track[0].type).toBe(TrackInsertMarkName);
                expect(doc3Json.content[0].content[0].attrs.track[0].author).toBe("TestUser1");
                expect(doc3Json.content[0].content[0].attrs.track[0].before).toBe(undefined);
           });
            test("wrap a paragraph to an unorderedList and accept", () => {
                //init
                const state = createEmptyDocState();
                //mod
                const tr = state.tr;
                const node = state.schema.nodes["paragraph"].create(null, state.schema.text("test"));
                tr.insert(0, node);
                const state2 = state.apply(tr);
                const tr2 = state2.tr;
                const nodeRange = state2.doc.resolve(0).blockRange(state2.doc.resolve(state2.doc.nodeSize - 2));
                const wrapParam = findWrapping(nodeRange, state2.schema.nodes["bulletList"]);
                tr2.wrap(nodeRange, wrapParam);
                const state3 = state2.apply(trackTransaction(tr2, state2, "TestUser1"))
                const tr3 = state3.tr;
                applyTrackChanges("accept", state3, tr3, 0, state3.doc.nodeSize - 2)
                const state4 = state3.apply(tr3);
                //check
                const doc4Json = state4.doc.toJSON();
                expect(doc4Json.content.length).toBe(1);
                expect(doc4Json.content[0].type).toBe("bulletList");
                expect(doc4Json.content[0].content.length).toBe(1);
                expect(doc4Json.content[0].content[0].type).toBe("listItem");
                expect(doc4Json.content[0].content[0].content.length).toBe(1);
                expect(doc4Json.content[0].content[0].content[0].content.length).toBe(1);
                expect(doc4Json.content[0].content[0].content[0].content[0].text).toBe("test");
                expect(doc4Json.content[0].content[0].attrs.track.length).toBe(0);
            });
            test("wrap a paragraph to an unorderedList and revert", () => {
                //init
                const state = createEmptyDocState();
                //mod
                const tr = state.tr;
                const node = state.schema.nodes["paragraph"].create(null, state.schema.text("test"));
                tr.insert(0, node);
                const state2 = state.apply(tr);
                const tr2 = state2.tr;
                const nodeRange = state2.doc.resolve(0).blockRange(state2.doc.resolve(state2.doc.nodeSize - 2));
                const wrapParam = findWrapping(nodeRange, state2.schema.nodes["bulletList"]);
                tr2.wrap(nodeRange, wrapParam);
                const state3 = state2.apply(trackTransaction(tr2, state2, "TestUser1"))
                const tr3 = state3.tr;
                applyTrackChanges("revert", state3, tr3, 0, state3.doc.nodeSize - 2)
                const state4 = state3.apply(tr3);
                //check
                const doc4Json = state4.doc.toJSON();
                expect(doc4Json.content.length).toBe(1);
                expect(doc4Json.content[0].type).toBe("paragraph");
                expect(doc4Json.content[0].content.length).toBe(1);
                expect(doc4Json.content[0].content[0].text).toBe("test");
                expect(doc4Json.content[0].attrs.track.length).toBe(0);
            });
        });
        describe("unwrap a node", () => {
            test("unwrap a paragraph from an unorderedList", () => {
                //init
                const state = createEmptyDocState();
                //mod
                const tr = state.tr;
                const node = state.schema.nodes["bulletList"].create(null, state.schema.nodes["listItem"].create(null, state.schema.nodes["paragraph"].create(null, state.schema.text("test"))));
                tr.insert(0, node);
                const state2 = state.apply(tr);
                const tr2 = state2.tr;
                const nodeRange = state2.doc.resolve(2).blockRange(state2.doc.resolve(state2.doc.nodeSize - 4));
                const target = liftTarget(nodeRange);
                tr2.lift(nodeRange, target);
                const state3 = state2.apply(trackTransaction(tr2, state2, "TestUser1"));
                //check
                const doc3Json = state3.doc.toJSON();
                expect(doc3Json.content.length).toBe(1);
                expect(doc3Json.content[0].type).toBe("paragraph");
                expect(doc3Json.content[0].content.length).toBe(1);
                expect(doc3Json.content[0].content[0].type).toBe("text");
                expect(doc3Json.content[0].attrs.track.length).toBe(1);
                expect(doc3Json.content[0].attrs.track[0].type).toBe(TrackDeleteMarkName);
                expect(doc3Json.content[0].attrs.track[0].author).toBe("TestUser1");
                expect(doc3Json.content[0].attrs.track[0].before.wrappers).toBeDefined();
                expect(doc3Json.content[0].attrs.track[0].before.wrappers).toEqual([
                    {
                        type: "bulletList",
                        attrs: {
                            attributes: null,
                            "list-style-type": "bullet",
                            track: [],

                        },
                    },
                    {
                        type: "listItem",
                        attrs: {
                            attributes: null,
                            listParagraphProperties: null,
                            listRunProperties: null,
                            lvlJc: null,
                            lvlText: null,
                            track: [],
                        },
                    },
                ]);
            });
            test("unwrap a paragraph from an unorderedList and accept", () => {
                //init
                const state = createEmptyDocState();
                //mod
                const tr = state.tr;
                const node = state.schema.nodes["bulletList"].create(null, state.schema.nodes["listItem"].create(null, state.schema.nodes["paragraph"].create(null, state.schema.text("test"))));
                tr.insert(0, node);
                const state2 = state.apply(tr);
                const tr2 = state2.tr;
                const nodeRange = state2.doc.resolve(2).blockRange(state2.doc.resolve(state2.doc.nodeSize - 4));
                const target = liftTarget(nodeRange);
                tr2.lift(nodeRange, target);
                const state3 = state2.apply(trackTransaction(tr2, state2, "TestUser1"));
                const tr3 = state3.tr;
                applyTrackChanges("accept", state3, tr3, 0, state3.doc.nodeSize - 2)
                const state4 = state3.apply(tr3);
                //check
                const doc4Json = state4.doc.toJSON();
                expect(doc4Json.content.length).toBe(1);
                expect(doc4Json.content[0].type).toBe("paragraph");
                expect(doc4Json.content[0].content.length).toBe(1);
                expect(doc4Json.content[0].content[0].text).toBe("test");
                expect(doc4Json.content[0].attrs.track.length).toBe(0);
            });
            test("unwrap a paragraph from an unorderedList and revert", () => {
                //init
                const state = createEmptyDocState();
                //mod
                const tr = state.tr;
                const node = state.schema.nodes["bulletList"].create(null, state.schema.nodes["listItem"].create(null, state.schema.nodes["paragraph"].create(null, state.schema.text("test"))));
                tr.insert(0, node);
                const state2 = state.apply(tr);
                const tr2 = state2.tr;
                const nodeRange = state2.doc.resolve(2).blockRange(state2.doc.resolve(state2.doc.nodeSize - 4));
                const target = liftTarget(nodeRange);
                tr2.lift(nodeRange, target);
                const state3 = state2.apply(trackTransaction(tr2, state2, "TestUser1"));
                const tr3 = state3.tr;
                applyTrackChanges("revert", state3, tr3, 0, state3.doc.nodeSize - 2)
                const state4 = state3.apply(tr3);
                //check
                const doc4Json = state4.doc.toJSON();
                expect(doc4Json.content.length).toBe(1);
                expect(doc4Json.content[0].type).toBe("bulletList");
                expect(doc4Json.content[0].content.length).toBe(1);
                expect(doc4Json.content[0].content[0].type).toBe("listItem");
                expect(doc4Json.content[0].content[0].content.length).toBe(1);
                expect(doc4Json.content[0].content[0].content[0].content[0].text).toBe("test");
                expect(doc4Json.content[0].attrs.track.length).toBe(0);
            });
        });
        describe("unwrap multiple nodes", () => {
           test("unwrap 4 paragraphs from an unorderedList", () => {
                //init
                const state = createEmptyDocState();
                //mod
                const tr = state.tr;
                const node = state.schema.nodes["bulletList"].create(null, [
                    state.schema.nodes["listItem"].create(null, state.schema.nodes["paragraph"].create(null, state.schema.text("test1"))),
                    state.schema.nodes["listItem"].create(null, state.schema.nodes["paragraph"].create(null, state.schema.text("test2"))),
                    state.schema.nodes["listItem"].create(null, state.schema.nodes["paragraph"].create(null, state.schema.text("test3"))),
                    state.schema.nodes["listItem"].create(null, state.schema.nodes["paragraph"].create(null, state.schema.text("test4"))),
                ]);
                tr.insert(0, node);
                tr.setSelection(TextSelection.create(tr.doc, 4, tr.doc.nodeSize - 6));
                const state2 = state.apply(tr);

                let state3;
                const dispatch = (tr)  => {
                    state3 = state2.apply(trackTransaction(tr, state2, "TestUser1"));
                }
                liftListItem("listItem")({state: state2, dispatch});

                //check
                const doc3Json = state3.doc.toJSON();
                expect(doc3Json.content.length).toBe(4);
                for(let i = 0; i < 4; i++) {
                    expect(doc3Json.content[i].type).toBe("paragraph");
                    expect(doc3Json.content[i].content.length).toBe(1);
                    expect(doc3Json.content[i].content[0].text).toBe(`test${i+1}`);
                    expect(doc3Json.content[i].attrs.track.length).toBe(1);
                    expect(doc3Json.content[i].attrs.track[0].type).toBe(TrackDeleteMarkName);
                    expect(doc3Json.content[i].attrs.track[0].author).toBe("TestUser1");
                    expect(doc3Json.content[i].attrs.track[0].before.wrappers).toBeDefined();
                    expect(doc3Json.content[i].attrs.track[0].before.wrappers).toEqual([
                        {
                            type: "bulletList",
                            attrs: {
                                attributes: null,
                                "list-style-type": "bullet",
                                track: [],

                            },
                        },
                        {
                            type: "listItem",
                            attrs: {
                                attributes: null,
                                listParagraphProperties: null,
                                listRunProperties: null,
                                lvlJc: null,
                                lvlText: null,
                                track: [],
                            },
                        },
                    ]);
                }
           });
            test("unwrap 3 paragraphs from an unorderedList and accept", () => {
                //init
                const state = createEmptyDocState();
                //mod
                const tr = state.tr;
                const node = state.schema.nodes["bulletList"].create(null, [
                    state.schema.nodes["listItem"].create(null, state.schema.nodes["paragraph"].create(null, state.schema.text("test1"))),
                    state.schema.nodes["listItem"].create(null, state.schema.nodes["paragraph"].create(null, state.schema.text("test2"))),
                    state.schema.nodes["listItem"].create(null, state.schema.nodes["paragraph"].create(null, state.schema.text("test3"))),
                ]);
                tr.insert(0, node);
                tr.setSelection(TextSelection.create(tr.doc, 4, tr.doc.nodeSize - 6));
                const state2 = state.apply(tr);

                let state3;
                const dispatch = (tr)  => {
                    state3 = state2.apply(trackTransaction(tr, state2, "TestUser1"));
                }
                liftListItem("listItem")({state: state2, dispatch});

                const tr3 = state3.tr;
                applyTrackChanges("accept", state3, tr3, 0, state3.doc.nodeSize - 2)
                const state4 = state3.apply(tr3);
                //check
                const doc4Json = state4.doc.toJSON();
                expect(doc4Json.content.length).toBe(3);
                for(let i = 0; i < 3; i++) {
                    expect(doc4Json.content[i].type).toBe("paragraph");
                    expect(doc4Json.content[i].content.length).toBe(1);
                    expect(doc4Json.content[i].content[0].text).toBe(`test${i+1}`);
                    expect(doc4Json.content[i].attrs.track.length).toBe(0);
                }
            });
            test("unwrap 3 paragraphs from an unorderedList and revert", () => {
                //init
                const state = createEmptyDocState();
                //mod
                const tr = state.tr;
                const node = state.schema.nodes["bulletList"].create(null, [
                    state.schema.nodes["listItem"].create(null, state.schema.nodes["paragraph"].create(null, state.schema.text("test1"))),
                    state.schema.nodes["listItem"].create(null, state.schema.nodes["paragraph"].create(null, state.schema.text("test2"))),
                    state.schema.nodes["listItem"].create(null, state.schema.nodes["paragraph"].create(null, state.schema.text("test3"))),
                ]);
                tr.insert(0, node);
                tr.setSelection(TextSelection.create(tr.doc, 4, tr.doc.nodeSize - 6));
                const state2 = state.apply(tr);

                let state3;
                const dispatch = (tr)  => {
                    state3 = state2.apply(trackTransaction(tr, state2, "TestUser1"));
                }
                liftListItem("listItem")({state: state2, dispatch});

                const tr3 = state3.tr;
                applyTrackChanges("revert", state3, tr3, 0, state3.doc.nodeSize - 2)
                const state4 = state3.apply(tr3);
                //check
                const doc4Json = state4.doc.toJSON();
                expect(doc4Json.content.length).toBe(1);
                expect(doc4Json.content[0].type).toBe("bulletList");
                expect(doc4Json.content[0].content.length).toBe(3);
                for(let i = 0; i < 3; i++) {
                    expect(doc4Json.content[0].content[i].type).toBe("listItem");
                    expect(doc4Json.content[0].content[i].content.length).toBe(1);
                    expect(doc4Json.content[0].content[i].content[0].type).toBe("paragraph");
                    expect(doc4Json.content[0].content[i].content[0].content.length).toBe(1);
                    expect(doc4Json.content[0].content[i].content[0].content[0].text).toBe(`test${i+1}`);
                    expect(doc4Json.content[0].content[i].attrs.track.length).toBe(0);
                }
            });
        });
    });
});
