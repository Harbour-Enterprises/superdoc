import { Extension } from '@core/Extension.js';
import { Slice } from 'prosemirror-model';
import { Mapping, ReplaceStep, AddMarkStep, RemoveMarkStep } from 'prosemirror-transform';
import { TrackDeleteMarkName, TrackInsertMarkName, TrackFormatMarkName } from './constants.js';
import { TrackChangesBasePlugin, TrackChangesBasePluginKey } from './plugins/index.js';
import { getTrackChanges } from './trackChangesHelpers/getTrackChanges.js';

export const TrackChanges = Extension.create({
  name: 'trackChanges',

  addCommands() {
    return {
      acceptTrackedChangeBetween:
        (from, to) =>
        ({ state, dispatch }) => {
          let { tr, doc } = state;

          // if (from === to) {
          //   to += 1;
          // }

          tr.setMeta('acceptReject', true);

          const map = new Mapping();

          doc.nodesBetween(from, to, (node, pos) => {
            if (node.marks && node.marks.find((mark) => mark.type.name === TrackDeleteMarkName)) {
              const deletionStep = new ReplaceStep(
                map.map(Math.max(pos, from)),
                map.map(Math.min(pos + node.nodeSize, to)),
                Slice.empty,
              );

              tr.step(deletionStep);
              map.appendMap(deletionStep.getMap());
            } else if (
              node.marks &&
              node.marks.find((mark) => mark.type.name === TrackInsertMarkName)
            ) {
              const insertionMark = node.marks.find(
                (mark) => mark.type.name === TrackInsertMarkName,
              );

              tr.step(
                new RemoveMarkStep(
                  map.map(Math.max(pos, from)),
                  map.map(Math.min(pos + node.nodeSize, to)),
                  insertionMark,
                ),
              );
            } else if (
              node.marks &&
              node.marks.find((mark) => mark.type.name === TrackFormatMarkName)
            ) {
              const formatChangeMark = node.marks.find(
                (mark) => mark.type.name === TrackFormatMarkName,
              );

              tr.step(
                new RemoveMarkStep(
                  map.map(Math.max(pos, from)),
                  map.map(Math.min(pos + node.nodeSize, to)),
                  formatChangeMark,
                ),
              );
            }
          });

          if (tr.steps.length) {
            dispatch(tr);
          }

          return true;
        },

      rejectTrackedChangeBetween:
        (from, to) =>
        ({ state, dispatch }) => {
          const { tr, doc } = state;

          tr.setMeta('acceptReject', true);

          const map = new Mapping();

          doc.nodesBetween(from, to, (node, pos) => {
            if (node.marks && node.marks.find((mark) => mark.type.name === TrackDeleteMarkName)) {
              const deletionMark = node.marks.find(
                (mark) => mark.type.name === TrackDeleteMarkName,
              );

              tr.step(
                new RemoveMarkStep(
                  map.map(Math.max(pos, from)),
                  map.map(Math.min(pos + node.nodeSize, to)),
                  deletionMark,
                ),
              );
            } else if (
              node.marks &&
              node.marks.find((mark) => mark.type.name === TrackInsertMarkName)
            ) {
              const deletionStep = new ReplaceStep(
                map.map(Math.max(pos, from)),
                map.map(Math.min(pos + node.nodeSize, to)),
                Slice.empty,
              );

              tr.step(deletionStep);
              map.appendMap(deletionStep.getMap());
            } else if (
              node.marks &&
              node.marks.find((mark) => mark.type.name === TrackFormatMarkName)
            ) {
              const formatChangeMark = node.marks.find(
                (mark) => mark.type.name === TrackFormatMarkName,
              );

              formatChangeMark.attrs.before.forEach((oldMark) => {
                tr.step(
                  new AddMarkStep(
                    map.map(Math.max(pos, from)),
                    map.map(Math.min(pos + node.nodeSize, to)),
                    state.schema.marks[oldMark.type].create(oldMark.attrs),
                  ),
                );
              });

              formatChangeMark.attrs.after.forEach((newMark) => {
                tr.step(
                  new RemoveMarkStep(
                    map.map(Math.max(pos, from)),
                    map.map(Math.min(pos + node.nodeSize, to)),
                    node.marks.find((mark) => mark.type.name === newMark.type),
                  ),
                );
              });

              tr.step(
                new RemoveMarkStep(
                  map.map(Math.max(pos, from)),
                  map.map(Math.min(pos + node.nodeSize, to)),
                  formatChangeMark,
                ),
              );
            }
          });

          if (tr.steps.length) {
            dispatch(tr);
          }

          return true;
        },

      acceptTrackedChange:
        ({ trackedChange }) =>
        ({ commands }) => {
          const { start: from, end: to } = trackedChange;
          return commands.acceptTrackedChangeBetween(from, to);
        },

      acceptTrackedChangeBySelection:
        () =>
        ({ state, commands }) => {
          const { from, to } = state.selection;
          return commands.acceptTrackedChangeBetween(from, to);
        },

      acceptTrackedChangeById:
        (id) =>
        ({ state, tr, commands }) => {
          const trackedChanges = getTrackChanges(state, id);

          return trackedChanges
            .map(({ from, to }) => {
              let mappedFrom = tr.mapping.map(from);
              let mappedTo = tr.mapping.map(to);
              return commands.acceptTrackedChangeBetween(mappedFrom, mappedTo);
            })
            .every((result) => result);
        },

      rejectTrackedChangeById:
        (id) =>
        ({ state, tr, commands }) => {
          const trackedChanges = getTrackChanges(state, id);

          return trackedChanges
            .map(({ from, to }) => {
              let mappedFrom = tr.mapping.map(from);
              let mappedTo = tr.mapping.map(to);
              return commands.rejectTrackedChangeBetween(mappedFrom, mappedTo);
            })
            .every((result) => result);
        },

      rejectTrackedChange:
        ({ trackedChange }) =>
        ({ commands }) => {
          const { start: from, end: to } = trackedChange;
          return commands.rejectTrackedChangeBetween(from, to);
        },

      rejectTrackedChangeOnSelection:
        () =>
        ({ state, commands }) => {
          const { from, to } = state.selection;
          return commands.rejectTrackedChangeBetween(from, to);
        },

      toggleTrackChanges:
        () =>
        ({ state }) => {
          const trackChangeState = TrackChangesBasePluginKey.getState(state);
          if (trackChangeState === undefined) return false;
          state.tr.setMeta(TrackChangesBasePluginKey, {
            type: 'TRACK_CHANGES_ENABLE',
            value: !trackChangeState.isTrackChangesActive,
          });
          return true;
        },

      enableTrackChanges:
        () =>
        ({ state }) => {
          state.tr.setMeta(TrackChangesBasePluginKey, {
            type: 'TRACK_CHANGES_ENABLE',
            value: true,
          });
          return true;
        },

      disableTrackChanges:
        () =>
        ({ state }) => {
          state.tr.setMeta(TrackChangesBasePluginKey, {
            type: 'TRACK_CHANGES_ENABLE',
            value: false,
          });
          return true;
        },

      toggleTrackChangesShowOriginal:
        () =>
        ({ state }) => {
          const trackChangeState = TrackChangesBasePluginKey.getState(state);
          if (trackChangeState === undefined) return false;
          state.tr.setMeta(TrackChangesBasePluginKey, {
            type: 'SHOW_ONLY_ORIGINAL',
            value: !trackChangeState.onlyOriginalShown,
          });
          return true;
        },

      enableTrackChangesShowOriginal:
        () =>
        ({ state }) => {
          state.tr.setMeta(TrackChangesBasePluginKey, {
            type: 'SHOW_ONLY_ORIGINAL',
            value: true,
          });
          return true;
        },

      disableTrackChangesShowOriginal:
        () =>
        ({ state }) => {
          state.tr.setMeta(TrackChangesBasePluginKey, {
            type: 'SHOW_ONLY_ORIGINAL',
            value: false,
          });
          return true;
        },

      toggleTrackChangesShowFinal:
        () =>
        ({ state, dispatch }) => {
          const trackChangeState = TrackChangesBasePluginKey.getState(state);
          if (trackChangeState === undefined) return false;
          state.tr.setMeta(TrackChangesBasePluginKey, {
            type: 'SHOW_ONLY_MODIFIED',
            value: !trackChangeState.onlyModifiedShown,
          });
          return true;
        },

      enableTrackChangesShowFinal:
        () =>
        ({ state }) => {
          state.tr.setMeta(TrackChangesBasePluginKey, {
            type: 'SHOW_ONLY_MODIFIED',
            value: true,
          });
          return true;
        },
    };
  },

  addPmPlugins() {
    return [TrackChangesBasePlugin()];
  },
});

// For reference.
// const trackChangesCallback = (action, acceptedChanges, revertedChanges, editor) => {
//   const id = acceptedChanges.modifiers[0]?.id || revertedChanges.modifiers[0]?.id;
//   if (action === 'accept') {
//     editor.emit('trackedChangesUpdate', { action, id });
//   } else {
//     editor.emit('trackedChangesUpdate', { action, id });
//   }
// };
