import {Extension} from "../../core/index.js";
import {Plugin, PluginKey} from "prosemirror-state";
import {Decoration, DecorationSet} from "prosemirror-view";
import {TrackDeleteMarkName, TrackInsertMarkName} from "./constants.js";


export const TrackChangesBasePluginKey = new PluginKey("TrackChangesBase");

export const TrackChangesBase = Extension.create({
    addCommands() {
        return {
            toggleTrackChanges: () => ({state, dispatch}) => {
                if (dispatch) {
                    const trackChangeState = TrackChangesBasePluginKey.getState(state);
                    if(trackChangeState === undefined) return false;
                    const isTrackChangesActive = trackChangeState.isTrackChangesActive;
                    if(isTrackChangesActive) {
                        dispatch(state.tr.setMeta(TrackChangesBasePluginKey, {type: "TRACK_CHANGES_DISABLE"}));
                    } else {
                        dispatch(state.tr.setMeta(TrackChangesBasePluginKey, {type: "TRACK_CHANGES_ENABLE"}));
                    }
                }
                return true;
            },
            enableTrackChanges: () => ({state, dispatch}) => {
                if (dispatch) {
                    dispatch(state.tr.setMeta(TrackChangesBasePluginKey, {type: "TRACK_CHANGES_ENABLE"}));
                }
                return true;
            },
            disableTrackChanges: () => ({state, dispatch}) => {
                if (dispatch) {
                    dispatch(state.tr.setMeta(TrackChangesBasePluginKey, {type: "TRACK_CHANGES_DISABLE"}));
                }
                return true;
            },
            insertTestNodes: () => ({state, dispatch}) => {
                if (dispatch) {
                    const tr = state.tr;
                    const node = state.schema.text("test");
                    tr.insert(0, node);

                    const node2 = state.schema.text("mytest2");
                    tr.insert(5, node2);
                    tr.addMark(5, 13, state.schema.marks.trackInsert.create({}));
                    tr.addMark(0, 5, state.schema.marks.trackDelete.create({}));
                    dispatch(tr);
                }
                return true;
            },
            acceptChangeBetweenConcretePositions: (from, to) => ({state, dispatch}) => {
                if (dispatch) {
                    const tr = state.tr;
                    let offset = 0;
                    state.doc.nodesBetween(from, to, (node, pos) => {
                        node.marks.forEach(mark => {
                            if(mark.type.name === TrackDeleteMarkName) {
                                //TODO we should signal the acceptance
                                tr.deleteRange(pos + offset, pos + node.nodeSize + offset);
                                offset -= node.nodeSize;
                            }
                            if(mark.type.name === TrackInsertMarkName) {
                                //TODO we should signal the acceptance
                                tr.removeMark(pos + offset, pos + node.nodeSize + offset, mark);
                            }
                        });
                    });
                    dispatch(tr);
                }
                return true;
            },
            revertChangeBetweenConcretePositions: (from, to) => ({state, dispatch}) => {
                if (dispatch) {
                    const tr = state.tr;
                    let offset = 0;
                    state.doc.nodesBetween(from, to, (node, pos) => {
                        node.marks.forEach(mark => {
                            if(mark.type.name === TrackDeleteMarkName) {
                                //TODO we should signal the revert
                                tr.removeMark(pos + offset, pos + node.nodeSize + offset, mark);
                            }
                            if(mark.type.name === TrackInsertMarkName) {
                                //TODO we should signal the revert
                                tr.deleteRange(pos + offset, pos + node.nodeSize + offset);
                                offset -= node.nodeSize;
                            }
                        });
                    });
                    dispatch(tr);
                }
                return true;
            },
            signalChangesBetweenPositions: (from, to, action) => ({state, chain}) => {
                let correctedFrom = from;
                let correctedTo = to;
                const textNodesFrom = findTextNodes(state, from);
                const textNodesTo = findTextNodes(state, to);
                if(!textNodesFrom || !textNodesTo) {
                    return chain();
                }
                const {prevTextNode} = textNodesFrom;
                const {nextTextNode, currentTextNode} = textNodesTo;

                if (prevTextNode) {
                    prevTextNode.node.marks.forEach(mark => {
                        if (mark.type.name === TrackDeleteMarkName || mark.type.name === TrackInsertMarkName) {
                            correctedFrom = Math.max(prevTextNode.offset, 0);
                        }
                    });
                }

                if (nextTextNode) {
                    nextTextNode.node.marks.forEach(mark => {
                        if (mark.type.name === TrackDeleteMarkName || mark.type.name === TrackInsertMarkName) {
                            correctedTo = Math.min(nextTextNode.offset + nextTextNode.node.nodeSize, state.doc.nodeSize);
                        }
                    });
                } else if (currentTextNode) {
                    currentTextNode.node.marks.forEach(mark => {
                        if (mark.type.name === TrackDeleteMarkName || mark.type.name === TrackInsertMarkName) {
                            correctedTo = Math.min(currentTextNode.offset + currentTextNode.node.nodeSize, state.doc.nodeSize);
                        }
                    });
                }

                if(from!== correctedFrom || to !== correctedTo) {
                    return chain().signalChangesBetweenPositions(correctedFrom, correctedTo, action);
                } else {
                    if(action === "accept") {
                        return chain().acceptChangeBetweenConcretePositions(correctedFrom, correctedTo);
                    } else if (action === "revert") {
                        return chain().revertChangeBetweenConcretePositions(correctedFrom, correctedTo);
                    } else {
                        return chain();
                    }
                }
            },
            acceptChangesOnCursorPositions: () => ({state, chain}) => {
                const {from, to} = state.selection;
                return chain().signalChangesBetweenPositions(from, to, "accept");
            },
            revertChangesOnCursorPositions: () => ({state, chain}) => {
                const {from, to} = state.selection;
                return chain().signalChangesBetweenPositions(from, to, "revert");
            }
        };
    },
    addPmPlugins() {
        return [new Plugin(
            {
                key: TrackChangesBasePluginKey,
                state: {
                    init() {
                        return {
                            isTrackChangesActive: false,
                            decorations: DecorationSet.empty,
                        };
                    },
                    apply(tr, oldState, prevEditorState, newEditorState) {
                        const decorations = recalcDecorations(newEditorState);
                        const newState = {...oldState, decorations};

                        const meta = tr.getMeta(TrackChangesBasePluginKey);
                        if (!meta) return newState;

                        if(meta.type === "TRACK_CHANGES_ENABLE") {
                            return {...newState, isTrackChangesActive: true};
                        }
                        if(meta.type === "TRACK_CHANGES_DISABLE") {
                            return {...newState, isTrackChangesActive: false};
                        }

                        return newState;
                    },
                },
                props: {
                    decorations(t) {
                        return this.getState(t)?.decorations;
                    },
                },
            }),
        ]
    }
});

const recalcDecorations = (state) => {
    if(!state.doc || !state.doc.nodeSize) return DecorationSet.empty;

    const decorations = [];
    state.doc.nodesBetween(0, state.doc.nodeSize-2, (node, pos) => {
        node.marks.forEach(mark => {
            if(mark.type.name === TrackInsertMarkName) {
                const decoration = Decoration.inline(pos, pos + node.nodeSize, {
                    class: "insertionMark",
                });
                decorations.push(decoration);
            }
            if(mark.type.name === TrackDeleteMarkName) {
                const decorationInline = Decoration.inline(pos, pos + node.nodeSize, {
                    class: "deletionMark inline",
                });
                const decorationWidget = Decoration.widget(pos, () => {
                    const span = document.createElement("span");
                    span.classList.add("deletionMark");
                    span.classList.add("widget");
                    span.innerHTML = node.textContent;
                    span.contentEditable = false;
                    return span;
                }, {ignoreSelection: true});
                decorations.push(decorationInline);
                decorations.push(decorationWidget);
            }
        });
    });

    return DecorationSet.create(state.doc, decorations);
}

const findTextNodes = (state, position ) => {
    const pos = state.doc.resolve(position)
    if(!pos) {
        return undefined;
    }
    const parentPos = pos.start(pos.depth);
    let currentTextNode;
    let prevTextNode;
    let nextTextNode
    pos.node().content.forEach((node, offset) => {
        const globalPos = offset + parentPos;
        if(globalPos <= position) {
            prevTextNode = currentTextNode;
            currentTextNode = {
                node,
                offset: globalPos
            }
        } else if (!nextTextNode) {
            nextTextNode = {
                node,
                offset: globalPos
            }
        }
    });

    return {prevTextNode, currentTextNode, nextTextNode};
}