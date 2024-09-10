import {TextSelection, Selection, Transaction, EditorState} from "prosemirror-state";
import {Mapping, ReplaceStep, AddMarkStep, RemoveMarkStep, ReplaceAroundStep} from "prosemirror-transform";
import {EditorView} from "prosemirror-view";
import {Slice, Fragment, Mark, Node} from "prosemirror-model";
import {
    TrackInsertMarkName,
    TrackDeleteMarkName,
    TrackMarksMarkName,
    TrackChangeBlockChangeAttributeName
} from "./constants.js";
import {TrackChangesBasePluginKey} from "./track-changes-base.js";
/**
 * Amend transaction to track changes
 * @param {Transaction} tr
 * @param {EditorView} view
 * @param {string} user
 * @returns {Transaction} a modified transaction
 */
export const amendTransaction = (tr, view, user) => {

    //we keep history changes as-is above everything else, also reserve simple meta changes without steps
    if (
        !tr.steps.length ||
        ["historyUndo", "historyRedo"].includes(tr.getMeta("inputType"))
    ) {
        return tr
    }

    const trackChangeState = TrackChangesBasePluginKey.getState(view.state);
    const isTrackChangesActive = trackChangeState?.isTrackChangesActive ?? false;

    if (!isTrackChangesActive) {
        //we don't want to track changes if the plugin is not active
        return removeTrackChangesFromTransaction(tr, view.state);
    } else {
        return trackTransaction(
            tr,
            view.state,
            user,
        );
    }
}

const whitelistedMetaKeys = ["inputType", "uiEvent"]

/**
 * Amend transaction to track changes
 * @param {Transaction} tr old transaction
 * @param {Transaction} newTr the transaction we construct instead of the old one
 * @param {Mapping | null | undefined} map
 * @param {EditorState} state
 * @returns {void} newTr is modified in place
 */
const keepTransactionNavigationParts = (tr, newTr, map, state) => {
    // we copy all the meta keys that are whitelisted
    whitelistedMetaKeys.forEach(key => {
        if (tr.getMeta(key)) {
            newTr.setMeta(key, tr.getMeta(key))
        }
    })

    if (tr.selectionSet && map) {
        if (tr.selection instanceof TextSelection && (
            tr.selection.from < state.selection.from || tr.getMeta("inputType") === "deleteContentBackward"
        )) {
            const caretPos = map.map(tr.selection.from, -1)
            newTr.setSelection(
                new TextSelection(
                    newTr.doc.resolve(
                        caretPos
                    )
                )
            )
        } else {
            newTr.setSelection(tr.selection.map(newTr.doc, map))
        }
    }
    if (tr.storedMarksSet) {
        newTr.setStoredMarks(tr.storedMarks)
    }
    if (tr.scrolledIntoView) {
        newTr.scrollIntoView()
    }
}

/**
 * Remove marks from slice
 * @param {Slice} slice
 * @param {Schema} schema
 * @param {string} markName
 * @returns {Slice} a slice without the named marks
 */
const removeMarksFromSlice = (slice, schema, markName) => {
    const targetMark = schema.marks[markName];
    const newContent = [];

    slice.content.forEach(node => {
        const newMarks = node.marks.filter(mark => mark.type !== targetMark);
        let newNode;
        if (node.isText) {
            newNode = schema.text(node.text, newMarks);
        } else {
            newNode = node.type.create(node.attrs, node.content, newMarks);
        }
        newContent.push(newNode);
    });

    return new Slice(Fragment.fromArray(newContent), slice.openStart, slice.openEnd);
};

/**
 * Remove track changes from transaction
 * @param {Transaction} tr
 * @param {EditorState} state
 * @returns {Transaction} a new transaction without track changes
 */
const removeTrackChangesFromTransaction = (tr, state) => {
    const newTr = state.tr;

    tr.steps.forEach((step) => {
        if (!step) {
            return
        }
        if (step instanceof ReplaceStep && step.slice.size) {
            const sliceWithoutDeleteMarks = removeMarksFromSlice(step.slice, state.schema, TrackDeleteMarkName);
            const sliceWithoutInsertMarks = removeMarksFromSlice(sliceWithoutDeleteMarks, state.schema, TrackInsertMarkName);
            const newStep = new ReplaceStep(
                step.from,
                step.to,
                sliceWithoutInsertMarks,
                step.structure
            )
            newTr.step(newStep)
        } else {
            newTr.step(step)
        }
    });
    keepTransactionNavigationParts(tr, newTr, null, state); //we don't want to map the selection here
    //we copy all meta just in case
    Object.keys(tr.meta).forEach(key => {
        newTr.setMeta(key, tr.getMeta(key))
    })
    return newTr;
}

/**
 * Mark insertion
 * @param {Transaction} tr
 * @param {number} from
 * @param {number} to
 * @param {string} user
 * @param {string} date
 * @returns {void} tr is modified in place
 */
const markInsertion = (tr, from, to, user, date) => {
    const insertionMark = tr.doc.type.schema.marks[TrackInsertMarkName].create({author: user, date})
    tr.doc.nodesBetween(
        from,
        to,
        (node, pos) => {
            if (node.isInline) {
                tr.removeMark(Math.max(from, pos), Math.min(pos + node.nodeSize, to), tr.doc.type.schema.marks[TrackDeleteMarkName])
                tr.removeMark(Math.max(from, pos), Math.min(pos + node.nodeSize, to), tr.doc.type.schema.marks[TrackInsertMarkName])
                tr.addMark(Math.max(from, pos), Math.min(pos + node.nodeSize, to), insertionMark)
                return false
            } else if (pos < from || ["bulletList", "orderedList"].includes(node.type.name)) {
                return true
            } else if (["tableRow", "tableCell"].includes(node.type.name)) {
                return false
            }
            if (node.attrs.track) {
                const track = []
                track.push({type: TrackInsertMarkName, author: user, date})
                tr.setNodeMarkup(pos, null, Object.assign({}, node.attrs, {track}), node.marks)
            }
            return true;
        }
    )
}

/**
 * Mark deletion
 * @param {Transaction} tr
 * @param {number} from
 * @param {number} to
 * @param {string} user
 * @param {string} date
 * @returns {Mapping} - tr is modified in place, but the mapping is returned
 */
const markDeletion = (tr, from, to, user, date) => {
    const deletionMark = tr.doc.type.schema.marks[TrackDeleteMarkName].create({author: user, date})
    let firstTableCellChild = false
    let listItem = false
    const deletionMap = new Mapping()
    // Add deletion mark to block nodes (figures, text blocks) and find already deleted inline nodes (and leave them alone)
    tr.doc.nodesBetween(
        from,
        to,
        (node, pos, _parent, _index) => {
            if (pos < from && node.type.name === "tableCell") {
                firstTableCellChild = true
                return true
            } else if (pos < from && node.isBlock || firstTableCellChild) {
                firstTableCellChild = false
                return true
            } else if (["tableRow", "tableCell"].includes(node.type.name)) {
                return false
            } else if (node.isInline && node.marks.find(mark => mark.type.name === TrackInsertMarkName && mark.attrs.user === user)) {
                const removeStep = new ReplaceStep(
                    deletionMap.map(Math.max(from, pos)),
                    deletionMap.map(Math.min(to, pos + node.nodeSize)),
                    Slice.empty
                )
                if (!tr.maybeStep(removeStep).failed) {
                    deletionMap.appendMap(removeStep.getMap())
                }
            } else if (node.isInline && !node.marks.find(mark => mark.type.name === TrackInsertMarkName)) {
                tr.addMark(
                    deletionMap.map(Math.max(from, pos)),
                    deletionMap.map(Math.min(to, pos + node.nodeSize)),
                    deletionMark
                )
            } else if (
                !node.attrs.track?.find(trackAttr => trackAttr.type === TrackDeleteMarkName) &&
                !["bulletList", "orderedList"].includes(node.type.name)
            ) {
                if (node.attrs.track?.find(
                    trackAttr => trackAttr.type === TrackInsertMarkName && trackAttr.user === user.id
                )) {
                    let removeStep
                    // user has created element. so (s)he is allowed to delete it again.
                    if (node.isTextblock && to < (pos + node.nodeSize)) {
                        // The node is a textblock. So we need to merge into the last possible
                        // position inside the last text block.
                        const selectionBefore = Selection.findFrom(tr.doc.resolve(pos), -1)
                        if (selectionBefore instanceof TextSelection) {
                            removeStep = new ReplaceStep(
                                deletionMap.map(selectionBefore.$anchor.pos),
                                deletionMap.map(to),
                                Slice.empty
                            )
                        }
                    } else {
                        removeStep = new ReplaceStep(
                            deletionMap.map(Math.max(from, pos)),
                            deletionMap.map(Math.min(to, pos + node.nodeSize)),
                            Slice.empty
                        )
                    }

                    if (!tr.maybeStep(removeStep).failed) {
                        deletionMap.appendMap(removeStep.getMap())
                    }
                    if (node.type.name === "listItem" && listItem) {
                        listItem = false
                    }
                } else if (node.attrs.track) {
                    if (node.type.name === "listItem") {
                        listItem = true
                    } else if (listItem) {
                        // The first child of the first list item (likely a par) will not be merged with the paragraph
                        // before it.
                        listItem = false
                        return
                    }
                    const track = node.attrs.track.slice()
                    track.push({type: TrackDeleteMarkName, author: user, date: date})
                    tr.setNodeMarkup(deletionMap.map(pos), null, Object.assign({}, node.attrs, {track}), node.marks)
                }
                if (node.type.name === "figure") {
                    return false
                }
            }
        }
    )

    return deletionMap;
}

/**
 *
 * @param {Transaction} tr
 * @param {number} pos
 * @param {Node} oldNode
 * @param {Node} newNode
 * @param {string} user
 * @param {string} date
 */
function markWrapping(
    tr,
    pos,
    oldNode,
    newNode,
    user,
    date
) {
    let track = [...(oldNode.attrs?.track ?? [])];
    let blockTrack = track.find(track => track.type === TrackChangeBlockChangeAttributeName)

    if (blockTrack) {
        track = track.filter(track => track !== blockTrack)
        if (blockTrack.before.type !== newNode.type.name || blockTrack.before.attrs.level !== newNode.attrs.level) {
            blockTrack = {type: TrackChangeBlockChangeAttributeName, author: user, date: date, before: blockTrack.before}
            track.push(blockTrack)
        }
    } else {
        blockTrack = {type: TrackChangeBlockChangeAttributeName, author: user, date: date, before: {type: oldNode.type.name, attrs: oldNode.attrs}}
        if (blockTrack.before.attrs.id) {
            delete blockTrack.before.attrs.id
        }
        if (blockTrack.before.attrs.track) {
            delete blockTrack.before.attrs.track
        }
        track.push(blockTrack)
    }

    if (tr.doc.nodeAt(pos)) {
        tr.setNodeMarkup(pos, null, {...newNode.attrs, track})
    }
}

/**
 * Handle replace step
 * @param {EditorState} state the original editor state
 * @param {Transaction} tr is the original transaction
 * @param {ReplaceStep} step the original state we start from
 * @param {number} stepIndex is the index of the original step in the original transaction
 * @param {Transaction} newTr is the new transaction we construct
 * @param {Mapping} map is the mapping of the newTr we construct
 * @param {string} user
 * @param {string} date
 * @returns {void} newTr and map is modified in place
 */
const handleReplaceStep = (state, tr, step, stepIndex, newTr, map, user, date) => {
    const newStep =
        step.slice.size ?
            new ReplaceStep(
                step.to, // We insert all the same steps, but with "from"/"to" both set to "to" in order not to delete content. Mapped as needed.
                step.to,
                step.slice,
                step.structure
            ) :
            false
    // We didn't apply the original step in its original place. We adjust the map accordingly.
    const invertStep = tr.steps[stepIndex].invert(tr.docs[stepIndex]).map(map)
    if(invertStep) {
        map.appendMap(invertStep.getMap())
    }
    if (newStep) {
        const trTemp = state.apply(newTr).tr
        if (!trTemp.maybeStep(newStep).failed) {
            const mappedNewStepTo = newStep.getMap().map(newStep.to)
            markInsertion(
                trTemp,
                newStep.from,
                mappedNewStepTo,
                user,
                date,
            )
            // We condense it down to a single replace step.
            const condensedStep = new ReplaceStep(newStep.from, newStep.to, trTemp.doc.slice(newStep.from, mappedNewStepTo))
            newTr.step(condensedStep)
            const mirrorIndex = map.maps.length - 1
            map.appendMap(condensedStep.getMap(), mirrorIndex)
            if (!newTr.selection.eq(trTemp.selection)) {
                console.log(trTemp.selection.toJSON())
                newTr.setSelection(Selection.fromJSON(newTr.doc, trTemp.selection.toJSON()))
            }
        }

    }
    if (step.from !== step.to) {
        map.appendMapping(
            markDeletion(newTr, step.from, step.to, user, date)
        )
    }
}
/**
 * Handle add/remove mark step
 * @param {EditorState} state
 * @param {AddMarkStep | RemoveMarkStep} step
 * @param {Transaction} newTr
 * @param {string} user
 * @param {string} date
 */
const handleMarkStep = (state, step, newTr, user, date) => {
    newTr.doc.nodesBetween(step.from, step.to, (node, pos) => {
        if (!node.isInline) {
            return true
        }
        if (node.marks.find(mark => mark.type.name === TrackDeleteMarkName)) {
            return false
        } else if (step instanceof AddMarkStep) {
            newTr.addMark(
                Math.max(step.from, pos),
                Math.min(step.to, pos + node.nodeSize),
                step.mark
            )
        } else if (step instanceof RemoveMarkStep) {
            newTr.removeMark(
                Math.max(step.from, pos),
                Math.min(step.to, pos + node.nodeSize),
                step.mark
            )
        }
        const formatChangeMark = node.marks.find(mark => mark.type.name === TrackMarksMarkName)
        let before = []
        let after = []
        if (formatChangeMark) {
            before = [...formatChangeMark.attrs.before];
            after = [...formatChangeMark.attrs.after];
            newTr.removeMark(
                Math.max(step.from, pos),
                Math.min(step.to, pos + node.nodeSize),
                formatChangeMark
            )
        } else {
            before = node.marks.map(mark => ({
                type: mark.type.name,
                attrs: {...mark.attrs}
            }))
            after = [...before]
        }
        if(step instanceof AddMarkStep) {
            const addedMark = {
                type: step.mark.type.name,
                attrs: {...step.mark.attrs}
            }
            after.push(addedMark)
        } else if (step instanceof RemoveMarkStep) {
            after = after.filter(mark => mark.type !== step.mark.type.name);
        }
        newTr.addMark(
            Math.max(step.from, pos),
            Math.min(step.to, pos + node.nodeSize),
            state.schema.marks[TrackMarksMarkName].create({
                author: user,
                date,
                before,
                after,
            })
        )
    });
}

/**
 * Handle node type changes
 * @param {EditorState} state the original editor state
 * @param {Transaction} tr is the original transaction
 * @param {ReplaceAroundStep} step the original state we start from
 * @param {number} stepIndex is the index of the original step in the original transaction
 * @param {Transaction} newTr is the new transaction we construct
 * @param {Mapping} map is the mapping of the newTr we construct
 * @param {string} user
 * @param {string} date
 * @returns {void} newTr and map is modified in place
 */
const handleNodeTypeChanges = (state, tr, step, stepIndex, newTr, map, user, date) => {
    if (step.from === step.gapFrom && step.to === step.gapTo) { // wrapped in something
        newTr.step(step)
        const from = step.getMap().map(step.from, -1)
        const to = step.getMap().map(step.gapFrom)
        markInsertion(newTr, from, to, user, date) // we only mark the wrapping node itself which is indded an insertion
    } else if (!step.slice.size || step.slice.content.content.length === 2) {// unwrapped from something
        const invertStep = tr.steps[stepIndex].invert(tr.docs[stepIndex]).map(map)
        map.appendMap(invertStep.getMap())
        map.appendMap(
            markDeletion(newTr, step.from, step.gapFrom, user, date)
        )
    } else if (step.slice.size === 2 && step.gapFrom - step.from === 1 && step.to - step.gapTo === 1) { // Replaced one wrapping with another
        const oldNode = newTr.doc.nodeAt(step.from)
        newTr.step(step)
        if (oldNode) {
            markWrapping(
                newTr,
                step.from,
                oldNode,
                step.slice.content.firstChild,
                user,
                date
            )
        }
    } else {
        newTr.step(step)
        const ranges = [
            {from: step.getMap().map(step.from, -1), to: step.getMap().map(step.gapFrom)},
            {from: step.getMap().map(step.gapTo, -1), to: step.getMap().map(step.to)}
        ]
        ranges.forEach(
            range => newTr.doc.nodesBetween(range.from, range.to, (node, pos) => {
                if (
                    pos < range.from
                ) {
                    return true
                }
                markInsertion(newTr, range.from, range.to, user, date)
            })
        )
    }
}

/**
 * Track transaction
 * @param {Transaction} tr
 * @param {EditorState} state
 * @param {string} user
 * @returns {Transaction} a new transaction with track changes
 */
export const trackTransaction = (tr, state, user) => {
    const now = Date.now()
    const fixedTimeTo10Minutes = Math.floor(now / 600000) * 600000
    const fixedTimeTo10MinutesString = new Date(fixedTimeTo10Minutes).toISOString()
    const newTr = state.tr;
    const map = new Mapping();

    tr.steps.forEach((originalStep, originalStepIndex) => {
        const step = originalStep.map(map);
        if (!step) {
            return
        }
        if (step instanceof ReplaceStep) {
            handleReplaceStep(state, tr, step, originalStepIndex, newTr, map, user, fixedTimeTo10MinutesString)
        } else if (step instanceof AddMarkStep) {
            handleMarkStep(state, step, newTr, user, fixedTimeTo10MinutesString)
        } else if (step instanceof RemoveMarkStep) {
            handleMarkStep(state, step, newTr, user, fixedTimeTo10MinutesString)
        } else if (step instanceof ReplaceAroundStep){
            handleNodeTypeChanges(state, tr, step, originalStepIndex, newTr, map, user, fixedTimeTo10MinutesString);
        } else {
            newTr.step(step)
        }
    })

    keepTransactionNavigationParts(tr, newTr, map, state);
    return newTr
}