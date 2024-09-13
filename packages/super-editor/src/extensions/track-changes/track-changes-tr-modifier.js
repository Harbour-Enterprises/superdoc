import {TextSelection, Selection, Transaction, EditorState} from "prosemirror-state";
import {Mapping, ReplaceStep, AddMarkStep, RemoveMarkStep} from "prosemirror-transform";
import {EditorView} from "prosemirror-view";
import {Slice, Fragment, Mark, Node} from "prosemirror-model";
import { v4 as uuidv4 } from 'uuid';
import {TrackInsertMarkName, TrackDeleteMarkName, TrackMarksMarkName} from "./constants.js";
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
 * Get the tracked change node
 * 
 * @param {from} number the start position
 * @param {to} number the end position
 * @param {tr} Transaction the transaction
 * @param {user} string the user
 * @returns {Node | null} the tracked change node or null
 */
const getMarkNode = (from, to, tr, user) => {
    const prevNode = tr.doc.nodeAt(from)
    const nextNode = tr.doc.nodeAt(to)
    const prevNodeInsertion = prevNode && prevNode.marks.find((mark) => {
        return mark.type.name === TrackInsertMarkName && mark.attrs.authorEmail === user.email
    });
    const nextNodeInsertion = nextNode && nextNode.marks.find((mark) => {
        return mark.type.name === TrackInsertMarkName && mark.attrs.authorEmail === user.email
    });

    return prevNodeInsertion || nextNodeInsertion;
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
const markInsertion = (tr, from, to, user, date, wid) => {
    // check if we are adding to an existing insertion mark
    let addingToExisting = false

    const markNode = getMarkNode(from, to, tr, user);
    if (markNode) {
        wid = markNode.attrs.wid;
        addingToExisting = true
    }

    const markAttrs = {authorEmail: user.email, author: user.name, date, wid};
    const insertionMark = tr.doc.type.schema.marks[TrackInsertMarkName].create(markAttrs)
    tr.doc.nodesBetween(
        from,
        to,
        (node, pos) => {
            if (node.isInline) {
                tr.removeMark(
                    Math.max(from, pos),
                    Math.min(pos + node.nodeSize, to),
                    tr.doc.type.schema.marks[TrackDeleteMarkName]
                );
                tr.removeMark(
                    Math.max(from, pos),
                    Math.min(pos + node.nodeSize, to),
                    tr.doc.type.schema.marks[TrackInsertMarkName]
                );
                tr.addMark(
                    Math.max(from, pos),
                    Math.min(pos + node.nodeSize, to),
                    insertionMark
                );
                return false
            } /*else if (pos < from || ["bullet_list", "ordered_list"].includes(node.type.name)) {
                return true
            } else if (["table_row", "table_cell"].includes(node.type.name)) {
                return false
            }*/
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
 * @returns {void} tr is modified in place
 */
const markDeletion = (tr, from, to, user, date, wid) => {
    let addingToExisting = false;
    const markNode = getMarkNode(from, to, tr, user);
    if (markNode) {
        wid = markNode.attrs.wid;
        addingToExisting = true
    }

    const deletionMark = tr.doc.type.schema.marks[TrackDeleteMarkName].create({authorEmail: user.email, author: user.name, date, wid})
    let firstTableCellChild = false
    let listItem = false
    const deletionMap = new Mapping()
    // Add deletion mark to block nodes (figures, text blocks) and find already deleted inline nodes (and leave them alone)
    tr.doc.nodesBetween(
        from,
        to,
        (node, pos, _parent, _index) => {
            if (pos < from && node.type.name === "table_cell") {
                firstTableCellChild = true
                return true
            } else if (pos < from && node.isBlock || firstTableCellChild) {
                firstTableCellChild = false
                return true
            } else if (["table_row", "table_cell"].includes(node.type.name)) {
                return false
            } else if (node.isInline && node.marks.find(mark => mark.type.name === "insertion" && mark.attrs.user === user && !mark.attrs.approved)) {
                const removeStep = new ReplaceStep(
                    deletionMap.map(Math.max(from, pos)),
                    deletionMap.map(Math.min(to, pos + node.nodeSize)),
                    Slice.empty
                )
                if (!tr.maybeStep(removeStep).failed) {
                    deletionMap.appendMap(removeStep.getMap())
                }
            } else if (node.isInline && !node.marks.find(mark => mark.type.name === "deletion")) {
                tr.addMark(
                    deletionMap.map(Math.max(from, pos)),
                    deletionMap.map(Math.min(to, pos + node.nodeSize)),
                    deletionMark
                )
            }
        }
    )

    return deletionMap;
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
    const invertStep = step.invert(tr.docs[stepIndex]).map(map)
    if(invertStep) {
        map.appendMap(invertStep.getMap())
    }

    const wid = uuidv4()
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
                wid,
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
            markDeletion(newTr, step.from, step.to, user, date, wid)
        )
    }
}
/**
 * Handle add mark step
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
        } else {
            newTr.step(step)
        }
    })

    keepTransactionNavigationParts(tr, newTr, map, state);
    return newTr
}