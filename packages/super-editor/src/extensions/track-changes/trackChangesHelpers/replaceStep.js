import { ReplaceStep, Mapping } from 'prosemirror-transform';
import { Transaction, EditorState } from 'prosemirror-state';
import { Node } from 'prosemirror-model';
import { markInsertion } from './markInsertion.js';
import { markDeletion } from './markDeletion.js';
import { findMark } from './documentHelpers.js';
import { TrackDeleteMarkName } from '../constants.js';

/**
 * Replace step.
 * @param {EditorState} options.state Editor state.
 * @param {Transaction} options.tr Transaction.
 * @param {ReplaceStep} options.step Step.
 * @param {Transaction} options.newTr New transaction.
 * @param {Mapping} options.map Map.
 * @param {Node} options.doc Doc.
 * @param {object} options.user User object ({ name, email }).
 * @param {string} options.date Date.
 * @param {ReplaceStep} options.originalStep Original step.
 * @param {number} options.originalStepIndex Original step index.
 */
export const replaceStep = ({
  state,
  tr,
  step,
  newTr,
  map,
  doc,
  user,
  date,
  originalStep,
  originalStepIndex,
}) => {
  const deletionMarkSchema = state.schema.marks[TrackDeleteMarkName];
  const deletionMark = findMark(state, deletionMarkSchema, false);
  const positionTo = deletionMark ? deletionMark.to : step.to;

  const newStep = new ReplaceStep(
    positionTo, // We insert all the same steps, but with "from"/"to" both set to "to" in order not to delete content. Mapped as needed.
    positionTo,
    step.slice,
    step.structure,
  );

  // We didn't apply the original step in its original place. We adjust the map accordingly.
  const invertStep = originalStep.invert(tr.docs[originalStepIndex]).map(map);
  map.appendMap(invertStep.getMap());

  if (newStep) {
    const trTemp = state.apply(newTr).tr;

    if (trTemp.maybeStep(newStep).failed) {
      return;
    }

    const mappedNewStepTo = newStep.getMap().map(newStep.to);

    markInsertion({
      tr: trTemp,
      from: newStep.from,
      to: mappedNewStepTo,
      user,
      date,
    });

    // We condense it down to a single replace step.
    const condensedStep = new ReplaceStep(
      newStep.from,
      newStep.to,
      trTemp.doc.slice(newStep.from, mappedNewStepTo),
    );

    newTr.step(condensedStep);
    const mirrorIndex = map.maps.length - 1;
    map.appendMap(condensedStep.getMap(), mirrorIndex);

    if (!newTr.selection.eq(trTemp.selection)) {
      newTr.setSelection(trTemp.selection);
    }
  }

  if (step.from !== step.to) {
    map.appendMapping(
      markDeletion({
        tr: newTr,
        from: step.from,
        to: step.to,
        user,
        date,
      }),
    );
  }
};
