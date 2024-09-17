import {EditorState} from "prosemirror-state";
import {Slice, Fragment} from "prosemirror-model";
import {Schema} from "../../core/index.js";
import {getStarterExtensions} from "../index.js";
import {trackTransaction} from "./track-changes-tr-modifier.js";
import {TrackDeleteMarkName, TrackInsertMarkName, TrackMarksMarkName} from "./constants.js";

const createEmptyDocState = () => {
    const emptyDoc = {content: [], type: "doc"}
    const schema = Schema.createSchemaByExtensions(getStarterExtensions())
    const doc = schema.nodeFromJSON(emptyDoc);
    return EditorState.create({
        schema,
        doc,
    })
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
            expect(trackMarksMark.attrs.before).toStrictEqual([]);
            expect(trackMarksMark.attrs.after).toStrictEqual([{
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
            expect(trackMarksMark.attrs.before).toStrictEqual([
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
            expect(trackMarksMark.attrs.after).toStrictEqual([
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
            expect(trackMarksMark.attrs.before).toStrictEqual([
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
            expect(trackMarksMark.attrs.after).toStrictEqual([
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
            expect(trackMarksMark.attrs.before).toStrictEqual([
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
            expect(trackMarksMark.attrs.after).toStrictEqual([
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
});
