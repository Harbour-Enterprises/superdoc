import {Extension} from '@core/Extension.js';
import {Plugin, PluginKey, EditorState, Transaction} from "prosemirror-state";
import {Decoration, DecorationSet} from "prosemirror-view";
import { liftTarget } from "prosemirror-transform";
import {Mark, Node} from "prosemirror-model";
import {
    TrackChangeBlockChangeAttributeName,
    TrackDeleteMarkName,
    TrackInsertMarkName,
    TrackMarksMarkName
} from "./constants.js";


const trackChangesCallback = (action, original, modified, modifiers) => {
    const rearrangedModifiers = new Map();
    modifiers.forEach(modifier => {
        if(!rearrangedModifiers.has(modifier.author)) {
            rearrangedModifiers.set(modifier.author, []);
        }
        const dates = rearrangedModifiers.get(modifier.author)
        if(dates.indexOf(modifier.date) === -1) {
            dates.push(modifier.date);
        }
    });
    if(action === "accept") {
        console.log("We accepted a change, the original text was", original, "the modified text was", modified, rearrangedModifiers);
    } else {
        console.log("We reverted a change, the original text was", original, "the modified text was", modified, rearrangedModifiers);
    }
}

export const TrackChangesBasePluginKey = new PluginKey("TrackChangesBase");

export const TrackChangesBase = Extension.create({
    addCommands() {
        return {
            toggleTrackChanges: () => ({state, dispatch}) => {
                if (dispatch) {
                    const trackChangeState = TrackChangesBasePluginKey.getState(state);
                    if(trackChangeState === undefined) return false;
                    dispatch(state.tr.setMeta(TrackChangesBasePluginKey, {type: "TRACK_CHANGES_ENABLE", value: !trackChangeState.isTrackChangesActive}));
                }
                return true;
            },
            enableTrackChanges: () => ({state, dispatch}) => {
                if (dispatch) {
                    dispatch(state.tr.setMeta(TrackChangesBasePluginKey, {type: "TRACK_CHANGES_ENABLE", value: true}));
                }
                return true;
            },
            disableTrackChanges: () => ({state, dispatch}) => {
                if (dispatch) {
                    dispatch(state.tr.setMeta(TrackChangesBasePluginKey, {type: "TRACK_CHANGES_ENABLE", value: false}));
                }
                return true;
            },
            toggleTrackChangesShowOriginal: () => ({state, dispatch}) => {
                if (dispatch) {
                    const trackChangeState = TrackChangesBasePluginKey.getState(state);
                    if(trackChangeState === undefined) return false;
                    dispatch(state.tr.setMeta(TrackChangesBasePluginKey, {type: "SHOW_ONLY_ORIGINAL", value: !trackChangeState.onlyOriginalShown}));
                }
                return true;
            },
            enableTrackChangesShowOriginal: () => ({state, dispatch}) => {
                if (dispatch) {
                    dispatch(state.tr.setMeta(TrackChangesBasePluginKey, {type: "SHOW_ONLY_ORIGINAL", value: true}));
                }
                return true;
            },
            disableTrackChangesShowOriginal: () => ({state, dispatch}) => {
                if (dispatch) {
                    dispatch(state.tr.setMeta(TrackChangesBasePluginKey, {type: "SHOW_ONLY_ORIGINAL", value: false}));
                }
                return true;
            },
            toggleTrackChangesShowFinal: () => ({state, dispatch}) => {
                if (dispatch) {
                    const trackChangeState = TrackChangesBasePluginKey.getState(state);
                    if(trackChangeState === undefined) return false;
                    dispatch(state.tr.setMeta(TrackChangesBasePluginKey, {type: "SHOW_ONLY_MODIFIED", value: !trackChangeState.onlyModifiedShown}));
                }
                return true;
            },
            enableTrackChangesShowFinal: () => ({state, dispatch}) => {
                if (dispatch) {
                    dispatch(state.tr.setMeta(TrackChangesBasePluginKey, {type: "SHOW_ONLY_MODIFIED", value: true}));
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
            applyChangeBetweenConcretePositions: (from, to, action) => ({state, dispatch}) => {
                if (dispatch && (action === "accept" || action === "revert")) {
                    let acceptedTr;
                    let revertedTr;
                    if(action === "accept") {
                        acceptedTr = state.tr
                        revertedTr = EditorState.create({ doc: state.doc }).tr
                    } else if (action === "revert") {
                        acceptedTr = EditorState.create({ doc: state.doc }).tr
                        revertedTr = state.tr
                    }
                    const acceptedChanges = applyTrackChanges( "accept", state, acceptedTr, from, to);
                    const revertedChanges = applyTrackChanges("revert", state, revertedTr, from, to);

                    trackChangesCallback(
                        action,
                        revertedTr.doc.textBetween(from, revertedChanges.offset + to, " "),
                        acceptedTr.doc.textBetween(from, acceptedChanges.offset + to, " "),
                        acceptedChanges.modifiers
                    );

                    if(action === "accept") {
                        dispatch(acceptedTr);
                    } else if (action === "revert") {
                        dispatch(revertedTr);
                    }
                }
                return true;
            },
            applyChangesBetweenPositions: (from, to, action) => ({state, chain}) => {
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
                        if (mark.type.name === TrackDeleteMarkName || mark.type.name === TrackInsertMarkName || mark.type.name === TrackMarksMarkName) {
                            correctedFrom = Math.max(prevTextNode.offset, 0);
                        }
                    });
                }

                if (nextTextNode) {
                    nextTextNode.node.marks.forEach(mark => {
                        if (mark.type.name === TrackDeleteMarkName || mark.type.name === TrackInsertMarkName || mark.type.name === TrackMarksMarkName) {
                            correctedTo = Math.min(nextTextNode.offset + nextTextNode.node.nodeSize, state.doc.nodeSize);
                        }
                    });
                } else if (currentTextNode) {
                    currentTextNode.node.marks.forEach(mark => {
                        if (mark.type.name === TrackDeleteMarkName || mark.type.name === TrackInsertMarkName || mark.type.name === TrackMarksMarkName) {
                            correctedTo = Math.min(currentTextNode.offset + currentTextNode.node.nodeSize, state.doc.nodeSize);
                        }
                    });
                }

                if(from!== correctedFrom || to !== correctedTo) {
                    return chain().applyChangesBetweenPositions(correctedFrom, correctedTo, action);
                } else {
                    return chain().applyChangeBetweenConcretePositions(correctedFrom, correctedTo, action);
                }
            },
            acceptChangesOnCursorPositions: () => ({state, chain}) => {
                const {from, to} = state.selection;
                return chain().applyChangesBetweenPositions(from, to, "accept");
            },
            revertChangesOnCursorPositions: () => ({state, chain}) => {
                const {from, to} = state.selection;
                return chain().applyChangesBetweenPositions(from, to, "revert");
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
                            onlyOriginalShown: false,
                            onlyModifiedShown: false,
                            decorations: DecorationSet.empty,
                        };
                    },
                    apply(tr, oldState, prevEditorState, newEditorState) {
                        const meta = tr.getMeta(TrackChangesBasePluginKey);
                        if (!meta) {
                            return {
                                ...oldState,
                                decorations: recalcDecorations(newEditorState, oldState.onlyOriginalShown, oldState.onlyModifiedShown)
                            };
                        }

                        if(meta.type === "TRACK_CHANGES_ENABLE") {
                            return {
                                ...oldState,
                                isTrackChangesActive: meta.value === true,
                                decorations: recalcDecorations(newEditorState, oldState.onlyOriginalShown, oldState.onlyModifiedShown)
                            };
                        }

                        if(meta.type === "SHOW_ONLY_ORIGINAL") {
                            return {
                                ...oldState,
                                onlyOriginalShown: meta.value === true,
                                onlyModifiedShown: false,
                                decorations: recalcDecorations(newEditorState, meta.value === true, false)
                            };
                        }

                        if(meta.type === "SHOW_ONLY_MODIFIED") {
                            return {
                                ...oldState,
                                onlyOriginalShown: false,
                                onlyModifiedShown: meta.value === true,
                                decorations: recalcDecorations(newEditorState, false, meta.value === true)
                            };
                        }

                        return {
                            ...oldState,
                            decorations: recalcDecorations(newEditorState, oldState.onlyOriginalShown, oldState.onlyModifiedShown)
                        };
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

/**
 *
 * @param schema
 * @param {Transaction} tr
 * @param {Node} node
 * @param {number} pos
 * @returns void - modifies the tr inplace
 */
const removeParentNode = (schema, tr, node, pos) => {
    // Define the starting and ending positions for the paragraphs within the listItem
    const startPos = pos + 1; // Position where the first child (paragraph) starts
    const endPos = startPos + node.nodeSize - 2; // The position after the last child

    // Resolve positions for lifting
    const startResolved = tr.doc.resolve(startPos);
    const endResolved = tr.doc.resolve(endPos);

    // Create a block range for all paragraphs within the listItem
    const blockRange = startResolved.blockRange(endResolved);

    if(blockRange === null) {
        return;
    }

    // Find the lift target
    const target = liftTarget(blockRange);

    // If there is a valid lift target, apply the transformation
    if (target != null) {
        tr.lift(blockRange, target);
    }
}

/**
 *
 * @param {"accept" | "revert"} action
 * @param {EditorState} state
 * @param {Transaction} tr
 * @param {number} from
 * @param {number} to
 * @returns {{offset: number, modifiers: *[]}}
 */
export const applyTrackChanges = (action, state, tr, from, to) => {
    let offset = 0;
    const modifiers = [];
    state.doc.nodesBetween(from, to, (node, pos) => {
        node.marks.forEach(mark => {
            if (mark.type.name === TrackDeleteMarkName) {
                if (action === "accept") {
                    tr.deleteRange(pos + offset, pos + node.nodeSize + offset);
                    offset -= node.nodeSize;
                    modifiers.push({author: mark.attrs.author, date: mark.attrs.date});
                } else if (action === "revert") {
                    tr.removeMark(pos + offset, pos + node.nodeSize + offset, mark);
                    modifiers.push({author: mark.attrs.author, date: mark.attrs.date});
                }
            }
            if (mark.type.name === TrackInsertMarkName) {
                if (action === "accept") {
                    tr.removeMark(pos + offset, pos + node.nodeSize + offset, mark);
                    modifiers.push({author: mark.attrs.author, date: mark.attrs.date});
                } else if (action === "revert") {
                    tr.deleteRange(pos + offset, pos + node.nodeSize + offset);
                    offset -= node.nodeSize;
                    modifiers.push({author: mark.attrs.author, date: mark.attrs.date});
                }
            }
            if (mark.type.name === TrackMarksMarkName) {
                if (action === "accept") {
                    tr.removeMark(pos + offset, pos + node.nodeSize + offset, mark);
                    modifiers.push({author: mark.attrs.author, date: mark.attrs.date});
                } else if (action === "revert") {
                    const styleChangeMark = mark
                    tr.removeMark(pos + offset, pos + node.nodeSize + offset, styleChangeMark);
                    for(const mark of styleChangeMark.attrs.after) {
                        tr.removeMark(pos + offset, pos + node.nodeSize + offset, state.schema.marks[mark.type].create(mark.attrs));
                    }
                    for(const mark of styleChangeMark.attrs.before) {
                        tr.addMark(pos + offset, pos + node.nodeSize + offset, state.schema.marks[mark.type].create(mark.attrs));
                    }
                    modifiers.push({author: mark.attrs.author, date: mark.attrs.date});
                }
            }
        });
        if(node.attrs && node.attrs.track && Array.isArray(node.attrs.track) && node.attrs.track.length > 0) {
            let blockTrack = node.attrs.track.find(track => track.type === TrackChangeBlockChangeAttributeName)
            let blockDelete = node.attrs.track.find(track => track.type === TrackDeleteMarkName)
            let blockInsert = node.attrs.track.find(track => track.type === TrackInsertMarkName)
            if (blockTrack) {
                if (action === "accept") {
                    tr.setNodeMarkup(pos + offset, null, {
                        ...node.attrs,
                        track: node.attrs.track.filter(track => track.type !== TrackChangeBlockChangeAttributeName)
                    });
                } else if (action === "revert") {
                    const nodeType = state.schema.nodes[blockTrack.before.type];
                    tr.setNodeMarkup(pos + offset, nodeType, blockTrack.before.attrs);
                }
            }
            if (blockDelete) {
                if (action === "accept") {
                    tr.setNodeMarkup(pos + offset, null, {
                        ...node.attrs,
                        track: node.attrs.track.filter(track => track.type !== TrackDeleteMarkName)
                    });
                } else if (action === "revert") {
                    //TODO: we should create all of the marks again
                }
            }
            if (blockInsert) {
                if (action === "accept") {
                    tr.setNodeMarkup(pos + offset, null, {
                        ...node.attrs,
                        track: node.attrs.track.filter(track => track.type !== TrackInsertMarkName)
                    });
                } else if (action === "revert") {
                    removeParentNode(state.schema, tr, node, pos);
                }
            }
        }
    });
    return {modifiers, offset};
};

/**
 * Recalculates decorations for the current state
 * @param state
 * @param {boolean} onlyOriginalShown
 * @param {boolean} onlyModifiedShown
 * @returns {DecorationSet}
 */
const recalcDecorations = (state, onlyOriginalShown,onlyModifiedShown ) => {
    if(!state.doc || !state.doc.nodeSize || (onlyModifiedShown && onlyOriginalShown)) {
        return DecorationSet.empty;
    }

    const decorations = [];
    state.doc.nodesBetween(0, state.doc.nodeSize-2, (node, pos) => {
        node.marks.forEach(mark => {
            if(mark.type.name === TrackInsertMarkName) {
                if(onlyOriginalShown) {
                    const decoration = Decoration.inline(pos, pos + node.nodeSize, {
                        class: "insertionMark inline hidden",
                    });
                    decorations.push(decoration);
                } else if(onlyModifiedShown) {
                    const decoration = Decoration.inline(pos, pos + node.nodeSize, {
                        class: "insertionMark inline normal",
                    });
                    decorations.push(decoration);
                } else {
                    const decoration = Decoration.inline(pos, pos + node.nodeSize, {
                        class: "insertionMark inline highlighted",
                    });
                    decorations.push(decoration);
                }
            }
            if(mark.type.name === TrackDeleteMarkName) {
                if(onlyOriginalShown) {
                    const decoration = Decoration.inline(pos, pos + node.nodeSize, {
                        class: "deletionMark inline normal",
                    });
                    decorations.push(decoration);
                } else if(onlyModifiedShown) {
                    const decoration = Decoration.inline(pos, pos + node.nodeSize, {
                        class: "deletionMark inline hidden",
                    });
                    decorations.push(decoration);
                } else {
                    const decorationInline = Decoration.inline(pos, pos + node.nodeSize, {
                        class: "deletionMark inline hidden",
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
            }
            if(mark.type.name === TrackMarksMarkName) {
                if(onlyOriginalShown) {
                    // for this we should render the before array as marks
                    //TODO I don't have a solid idea for this yet
                    const decoration = Decoration.inline(pos, pos + node.nodeSize, {
                        class: "trackMarks inline before",
                    });
                    decorations.push(decoration);
                } else if(onlyModifiedShown) {
                    // for this we should render do nothing, we already have the applied marks on the text
                    const decoration = Decoration.inline(pos, pos + node.nodeSize, {
                        class: "trackMarks inline normal",
                    });
                    decorations.push(decoration);
                } else {
                    const decoration = Decoration.inline(pos, pos + node.nodeSize, {
                        class: "trackMarks inline highlighted",
                    });
                    decorations.push(decoration);
                }
            }
        });
        if(node.attrs.track && node.attrs.track.length > 0) {
            let blockTrack = node.attrs.track.find(track => track.type === TrackChangeBlockChangeAttributeName)
            let blockDelete = node.attrs.track.find(track => track.type === TrackDeleteMarkName)
            let blockInsert = node.attrs.track.find(track => track.type === TrackInsertMarkName)
            if (blockTrack || blockDelete || blockInsert) {
                if(onlyOriginalShown) {
                    const decoration = Decoration.node(pos, pos + node.nodeSize, {
                        class: "blockChange normal",
                    });
                    decorations.push(decoration);
                } else if(onlyModifiedShown) {
                    const decoration = Decoration.node(pos, pos + node.nodeSize, {
                        class: "blockChange hidden",
                    });
                    decorations.push(decoration);
                } else {
                    const decoration = Decoration.node(pos, pos + node.nodeSize, {
                        class: "blockChange highlighted",
                    });
                    decorations.push(decoration);
                }
            }
        }
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