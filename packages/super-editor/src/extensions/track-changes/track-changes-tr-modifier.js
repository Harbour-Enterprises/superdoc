import {TextSelection, Selection} from "prosemirror-state";
import {Mapping, ReplaceStep} from "prosemirror-transform";
import {Slice} from "prosemirror-model";
import {TrackInsertMarkName, TrackDeleteMarkName} from "./constants.js";

export const amendTransaction = (tr, view, user) => {
    if (
        !tr.steps.length ||
        // don't replace history TRs
        ["historyUndo", "historyRedo"].includes(tr.getMeta("inputType"))
    ) {
        return tr
    } else {
        return trackTransaction(
            tr,
            view.state,
            user,
        )
    }
}

const markInsertion = (tr, from, to, user) => {
    const insertionMark = tr.doc.type.schema.marks[TrackInsertMarkName].create({user: user, createdAt: Date.now()})
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

const markDeletion = (tr, from, to, user) => {
    const deletionMark = tr.doc.type.schema.marks[TrackDeleteMarkName].create({user: user, createdAt: Date.now()})
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
    const newTr = state.tr;
    const map = new Mapping();

    tr.steps.forEach((originalStep, originalStepIndex) => {
        const step = originalStep.map(map);
        const doc = newTr.doc;
        if (!step) {
            return
        }
        if (step instanceof ReplaceStep) {
            console.log("1")
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
                console.log("2")
                const trTemp = state.apply(newTr).tr
                console.log("2", trTemp.maybeStep(newStep).failed)
                if (!trTemp.maybeStep(newStep).failed) {
                    const mappedNewStepTo = newStep.getMap().map(newStep.to)
                    markInsertion(
                        trTemp,
                        newStep.from,
                        mappedNewStepTo,
                        user,
                    )
                    // We condense it down to a single replace step.
                    const condensedStep = new ReplaceStep(newStep.from, newStep.to, trTemp.doc.slice(newStep.from, mappedNewStepTo))
                    console.log(condensedStep);
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
                console.log("3")
                map.appendMapping(
                    markDeletion(newTr, step.from, step.to, user)
                )
            }
        } else {
            newTr.step(step)
        }
    })

    // We copy the input type meta data from the original transaction.
    if (tr.getMeta("inputType")) {
        newTr.setMeta("inputType", tr.getMeta("inputType"))
    }
    if (tr.getMeta("uiEvent")) {
        newTr.setMeta("uiEvent", tr.getMeta("uiEvent"))
    }

    if (tr.selectionSet) {
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

    return newTr
}