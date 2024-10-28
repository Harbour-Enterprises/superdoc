import { Mapping, ReplaceStep } from 'prosemirror-transform';
import { Slice } from 'prosemirror-model';
import { v4 as uuidv4 } from 'uuid';
import { TrackDeleteMarkName, TrackInsertMarkName } from '../constants.js';
import { findTrackedMarkBetween } from './findTrackedMarkBetween.js';

/**
 * Mark deletion.
 * @param {Transaction} options.tr Transaction.
 * @param {number} options.from From position.
 * @param {number} options.to To position.
 * @param {object} options.user User object ({ name, email }).
 * @param {string} options.date Date.
 * @returns {Mapping} Deletion map.
 */
export const markDeletion = ({ tr, from, to, user, date }) => {
  let trackedMark = findTrackedMarkBetween({
    tr,
    from,
    to,
    markName: TrackDeleteMarkName,
    attrs: { authorEmail: user.email },
  });

  let id;
  if (trackedMark) {
    id = trackedMark.mark.attrs.id;
  } else {
    id = uuidv4();
  }

  const deletionMark = tr.doc.type.schema.marks[TrackDeleteMarkName].create({
    id,
    author: user.name,
    authorEmail: user.email,
    date,
  });

  const deletionMap = new Mapping();

  // Add deletion mark to block nodes (figures, text blocks) and find already deleted inline nodes (and leave them alone).
  tr.doc.nodesBetween(from, to, (node, pos) => {
    if (node.type.name.includes('table')) {
      return;
    }

    if (
      node.isInline &&
      node.marks.find(
        (mark) => mark.type.name === TrackInsertMarkName && mark.attrs.authorEmail === user.email,
      )
    ) {
      const removeStep = new ReplaceStep(
        deletionMap.map(Math.max(from, pos)),
        deletionMap.map(Math.min(to, pos + node.nodeSize)),
        Slice.empty,
      );
      if (!tr.maybeStep(removeStep).failed) {
        deletionMap.appendMap(removeStep.getMap());
      }
    } else if (
      node.isInline &&
      !node.marks.find((mark) => mark.type.name === TrackDeleteMarkName)
    ) {
      tr.addMark(
        deletionMap.map(Math.max(from, pos)),
        deletionMap.map(Math.min(to, pos + node.nodeSize)),
        deletionMark,
      );
    } else if (
      node.attrs.track &&
      !node.attrs.track.find((trackAttr) => trackAttr.type === TrackDeleteMarkName) &&
      !['bulletList', 'orderedList'].includes(node.type.name)
    ) {
      // Skip for now.
    }
  });

  return deletionMap;
};
