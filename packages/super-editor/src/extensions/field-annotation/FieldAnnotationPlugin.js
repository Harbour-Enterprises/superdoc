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
