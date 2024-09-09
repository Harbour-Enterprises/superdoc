import { Node, Attribute, helpers } from '@core/index.js';
import { FieldAnnotationView } from './FieldAnnotationView.js';
import { FieldAnnotationPlugin } from './FieldAnnotationPlugin.js';
import { findFieldAnnotationsByFieldId } from './fieldAnnotationHelpers/index.js';
import { toHex } from 'color2k';

const { findChildren } = helpers;

export const fieldAnnotationName = 'fieldAnnotation';
export const annotationClass = 'annotation';
export const annotationContentClass = 'annotation-content';

export const FieldAnnotation = Node.create({
  name: 'fieldAnnotation',

  group: 'inline',

  inline: true,

  atom: true,

  draggable: true,

  selectable: true,

  addOptions() {
    return {
      htmlAttributes: {
        class: annotationClass,
      },
      annotationClass,
      annotationContentClass,
      types: ['text', 'image', 'signature', 'checkbox'], // annotation types
      defaultType: 'text',
      borderColor: '#b015b3',
      handleDropOutside: true,
    }
  },

  addAttributes() {
    return {
      type: {
        default: this.options.defaultType,
        parseDOM: (elem) => elem.getAttribute('data-type'),
        renderDOM: (attrs) => {
          if (!attrs.type) return {};
          return {
            'data-type': attrs.type,
          };
        },
      },

      displayLabel: {
        default: 'Text field',
        parseDOM: (elem) => elem.getAttribute('data-display-label'),
        renderDOM: (attrs) => {
          if (!attrs.displayLabel) return {};
          return {
            'data-display-label': attrs.displayLabel,
          };
        },
      },

      imageSrc: {
        default: null,
        rendered: false,
        parseDOM: (elem) => {
          let img = elem.querySelector('img');
          return img?.getAttribute('src') || null;
        },
      },

      fieldId: {
        default: null,
        parseDOM: (elem) => elem.getAttribute('data-field-id'),
        renderDOM: (attrs) => {
          if (!attrs.fieldId) return {};
          return {
            'data-field-id': attrs.fieldId,
          };
        },
      },

      fieldType: {
        default: null,
        parseDOM: (elem) => elem.getAttribute('data-field-type'),
        renderDOM: (attrs) => {
          if (!attrs.fieldType) return {};
          return {
            'data-field-type': attrs.fieldType,
          };
        },
      },

      fieldColor: {
        default: '#980043',
        parseDOM: (elem) => elem.getAttribute('data-field-color') || elem.style.backgroundColor || null,
        renderDOM: (attrs) => {
          if (!attrs.fieldColor) return {};
          let hexColor = toHex(attrs.fieldColor);
          let isSixValueSyntax = hexColor.slice(1).length === 6;

          if (isSixValueSyntax) {
            hexColor = `${hexColor}33`;
          }

          return { 
            'data-field-color': hexColor,
            style: `background-color: ${hexColor}`,
          };
        },
      },
    };
  },

  parseDOM() {
    return [{ 
      tag: `span.${this.options.annotationClass}`,
      priority: 60,
    }];
  },

  renderDOM({ node, htmlAttributes }) {
    let { type, displayLabel, imageSrc } = node.attrs;

    if (type === 'image' || type === 'signature') {
      let contentRenderer = () => {      
        if (!imageSrc) return displayLabel;
        return [
          'img',
          {
            src: imageSrc,
            alt: displayLabel,
          },
        ];
      };

      return [
        'span',
        Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes),
        [
          'span',
          {
            class: `${this.options.annotationContentClass}`,
          },
          contentRenderer(),
        ],
      ];
    }

    // `text` type
    return [
      'span',
      Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes),
      [
        'span',
        {
          class: `${this.options.annotationContentClass}`,
        },
        displayLabel,
      ],
    ];
  },

  addCommands() {
    return {
      /**
       * Add field annotation.
       * @param pos The position in the doc.
       * @param attrs The attributes.
       * @example
       * editor.commands.addFieldAnnotation(0, {
       *  displayLabel: 'Enter your info',
       *  fieldId: `123`,
       *  fieldType: 'TEXTINPUT',
       *  fieldColor: '#980043',
       * });
       */
      addFieldAnnotation: (pos, attrs = {}) => ({ 
        editor,
        dispatch,
        state,
        tr,
      }) => {
        if (dispatch) {
          let { schema } = editor;

          let newPos = tr.mapping.map(pos);
          let $pos = state.doc.resolve(newPos);
          let currentMarks = $pos.marks();
          currentMarks = currentMarks.length ? [...currentMarks] : null;

          let node = schema.nodes[this.name].create({ ...attrs }, null, currentMarks);

          state.tr.insert(newPos, node);
        }
        
        return true;
      },

      /**
       * Update annotations associated with a field.
       * @param fieldIdOrArray The field ID or array of field IDs.
       * @param attrs The attributes.
       * @example
       * editor.commands.updateFieldAnnotations('123', {
       *  displayLabel: 'Updated!',
       * });
       * editor.commands.updateFieldAnnotations(['123', '456'], {
       *  displayLabel: 'Updated!',
       * });
       */
      updateFieldAnnotations: (fieldIdOrArray, attrs = {}) => ({
        dispatch,
        state,
        tr,
      }) => {
        let annotations = findFieldAnnotationsByFieldId(fieldIdOrArray, state);

        if (!annotations.length) return false;

        if (dispatch) {
          annotations
            .forEach((annotation) => {
              let { pos, node } = annotation;
              let newPos = tr.mapping.map(pos);

              let currentNode = tr.doc.nodeAt(newPos);
              if (node.eq(currentNode)) {
                tr.setNodeMarkup(newPos, undefined, {
                  ...node.attrs,
                  ...attrs,
                });
              }
            });
        }

        return true;
      },

      /**
       * Delete annotations associated with a field.
       * @param fieldIdOrArray The field ID or array of field IDs.
       * @example 
       * editor.commands.deleteFieldAnnotations('123');
       * editor.commands.deleteFieldAnnotations(['123', '456']);
       */
      deleteFieldAnnotations: (fieldIdOrArray) => ({
        dispatch,
        state,
        tr,
      }) => {
        let annotations = findFieldAnnotationsByFieldId(fieldIdOrArray, state);

        if (!annotations.length) return false;

        if (dispatch) {
          annotations
            .forEach((annotation) => {
              let { pos, node } = annotation;
              let newPosFrom = tr.mapping.map(pos);  // map the position between transaction steps
              let newPosTo = tr.mapping.map(pos + node.nodeSize);

              let currentNode = tr.doc.nodeAt(newPosFrom);
              if (node.eq(currentNode)) {
                tr.delete(newPosFrom, newPosTo);
              }
            });
        }
        
        return true;
      },
    };
  },

  addNodeView() {
    return (props) => {
      return new FieldAnnotationView({ 
        ...props,
        annotationClass: this.options.annotationClass,
        annotationContentClass: this.options.annotationContentClass,
        borderColor: this.options.borderColor, 
      });
    };
  },

  addPmPlugins() {
    return [
      FieldAnnotationPlugin({
        editor: this.editor,
        annotationClass: this.options.annotationClass,
        handleDropOutside: this.options.handleDropOutside,
      }),
    ];
  },
});

function findNode(node, predicate) {
  let found;
  node.descendants((node, pos) => {
    if (found) return false;
    if (predicate(node)) found = { node, pos };
  });
  return found;
};
