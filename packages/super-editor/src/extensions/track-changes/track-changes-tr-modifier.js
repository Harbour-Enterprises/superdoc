import {TextSelection, Selection} from "prosemirror-state";
import {Mapping, ReplaceStep} from "prosemirror-transform";
import {Slice, Fragment} from "prosemirror-model";
import {TrackInsertMarkName, TrackDeleteMarkName} from "./constants.js";
import {TrackChangesBasePluginKey} from "./track-changes-base.js";

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
            } /*else if (pos < from || ["bullet_list", "ordered_list"].includes(node.type.name)) {
                return true
            } else if (["table_row", "table_cell"].includes(node.type.name)) {
                return false
            }*/
        }
    )
}

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

const trackTransaction = (tr, state, user) => {
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
            const invertStep = originalStep.invert(tr.docs[originalStepIndex]).map(map)
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
                        fixedTimeTo10MinutesString,
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
                    markDeletion(newTr, step.from, step.to, user, fixedTimeTo10MinutesString)
                )
            }
        } else {
            newTr.step(step)
        }
    })

    keepTransactionNavigationParts(tr, newTr, map, state);
    return newTr
}