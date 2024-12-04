import { Plugin, PluginKey } from 'prosemirror-state';
import { Slice, Fragment } from 'prosemirror-model';
import { trackFieldAnnotationsDeletion } from './fieldAnnotationHelpers/trackFieldAnnotationsDeletion.js';

export const FieldAnnotationPlugin = (options = {}) => {
  let { 
    editor, 
    annotationClass, 
  } = options;

  return new Plugin({
    key: new PluginKey('fieldAnnotation'),

    state: {
      init() {
        return null;
      },

      apply(tr, prevState) {
        trackFieldAnnotationsDeletion(editor, tr);
        
        return prevState;
      },
    },
    
    props: {
      handleDrop(view, event, slice, moved) {
        if (moved) return false;

        let fieldAnnotation = event?.dataTransfer.getData('fieldAnnotation');

        if (fieldAnnotation) {
          if (options.handleDropOutside) {
            handleDropOutside({ 
              fieldAnnotation,
              editor, 
              view, 
              event, 
            });
          } else {
            let annotationAttrs;

            try {
              let fieldAnnotationObj = JSON.parse(fieldAnnotation);
              annotationAttrs = fieldAnnotationObj.attributes;
            } catch {
              return false;
            }

            const coordinates = view.posAtCoords({ 
              left: event.clientX, 
              top: event.clientY 
            });

            if (coordinates) {
              editor.commands.addFieldAnnotation(coordinates.pos, { 
                ...annotationAttrs
              });
            }
          }
          
          return true;
        }

        return false;
      },
      
      handlePaste(view, event, slice) {
        const content = slice.content.content.filter(item => item.type.name === 'fieldAnnotation')
        if (content.length) {
          editor.emit('fieldAnnotationPaste', {
            content,
            editor,
          });
        }
        return false;
      },

      transformPasted(slice) {
        const addMultipleAttributeForImageField = (node) => {
          if (node.attrs.fieldType === 'IMAGEINPUT') {
            return node.type.create(
                {
                  ...node.attrs,
                  multiple: true,
                },
                node.content
            );
          }
          return node.copy(node.content);
        }
        return mapSlice(slice, addMultipleAttributeForImageField);
      },

      handleDOMEvents: {
        dragstart: (view, event) => {
          if (!event.target) return false;

          let { target } = event;
          let isAnnotationField = target.classList.contains(annotationClass);

          if (isAnnotationField) {
            event.dataTransfer?.setDragImage(target, 0, 0);
          }

          return false;
        },

        // drop: (view, event) => {
        //   console.log({ view, event });
        // },
      },
    },
  });
};

function handleDropOutside({ 
  fieldAnnotation,
  editor, 
  view, 
  event, 
}) {
  let sourceField;
  try {
    let fieldAnnotationObj = JSON.parse(fieldAnnotation);
    sourceField = fieldAnnotationObj.sourceField;
  } catch {
    return;
  }

  let coordinates = view.posAtCoords({ 
    left: event.clientX, 
    top: event.clientY 
  });

  if (coordinates) {
    editor.emit('fieldAnnotationDropped', {
      sourceField,
      editor,
      coordinates,
      pos: coordinates.pos,
    });
  }
}

/**
 * Helpers to transform pasted node
 * Used to modify multiple attribute for image annotations
 * 
 * https://discuss.prosemirror.net/t/modify-specific-node-on-copy-and-paste-in-clipboard/4901
 */

function mapFragment(fragment, callback) {
  return Fragment.fromArray(fragment.content.map((node) => {
    if (node.content.childCount > 0) {
      return node.type.create(
        node.attrs,
        mapFragment(node.content, callback)
      );
    }

    return callback(node);
  })
);
}

function mapSlice(slice, callback) {
  const fragment = mapFragment(slice.content, callback);
  return new Slice(fragment, slice.openStart, slice.openEnd);
}
