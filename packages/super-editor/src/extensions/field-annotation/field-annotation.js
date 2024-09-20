import { Node, Attribute, helpers } from '@core/index.js';
import { FieldAnnotationView } from './FieldAnnotationView.js';
import { FieldAnnotationPlugin } from './FieldAnnotationPlugin.js';
import { findFieldAnnotationsByFieldId, getAllFieldAnnotations } from './fieldAnnotationHelpers/index.js';
import { toHex } from 'color2k';

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
      types: ['text', 'image', 'signature', 'checkbox', 'html'], // annotation types
      defaultType: 'text',
      borderColor: '#b015b3',
      visibilityOptions: ['visible', 'hidden'],
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

      rawHtml: {
        default: null,
        parseDOM: (elem) => elem.getAttribute('data-raw-html'),
        renderDOM: (attrs) => {
          if (!attrs.rawHtml) return {};
          return {
            'data-raw-html': attrs.rawHtml,
          };
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

      hidden: {
        default: false,
        parseDOM: (elem) => elem.hasAttribute('hidden') ? true : null,
        renderDOM: (attrs) => {
          if (!attrs.hidden) return {};
          return { hidden: '' };
        },
      },

      visibility: {
        default: 'visible',
        parseDOM: (el) => {
          let visibility = el.style.visibility || 'visible';
          let containsVisibility = this.options.visibilityOptions.includes(visibility);
          return containsVisibility ? visibility : 'visible';
        },
        renderDOM: (attrs) => {
          if (!attrs.visibility || attrs.visibility === 'visible') return {};
          return { style: `visibility: ${attrs.visibility}` };
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
    let { type, displayLabel, imageSrc, rawHtml } = node.attrs;

    let textRenderer = () => {
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
    };

    let imageRenderer = () => {
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
    };

    let renderers = {
      text: () => textRenderer(),
      image: () => imageRenderer(),
      signature: () => imageRenderer(),
      checkbox: () => textRenderer(),
      html: () => textRenderer(),
      default: () => textRenderer(),
    };

    let renderer = renderers[type] ?? type.default;
    
    return renderer();
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
       * })
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
       * })
       * @example
       * editor.commands.updateFieldAnnotations(['123', '456'], {
       *  displayLabel: 'Updated!',
       * })
       */
      updateFieldAnnotations: (fieldIdOrArray, attrs = {}) => ({
        dispatch,
        state,
        commands,
      }) => {
        let annotations = findFieldAnnotationsByFieldId(fieldIdOrArray, state);

        if (!annotations.length) return false;

        if (dispatch) {
          return commands.updateFieldAnnotationsAttributes(annotations, attrs);
        }

        return true;
      },
      
      /**
       * Update the attributes of annotations.
       * @param annotations The annotations array [{pos, node}].
       * @param attrs The attributes object.
       */
      updateFieldAnnotationsAttributes: (annotations, attrs = {}) => ({
        dispatch,
        tr,
      }) => {
        if (!dispatch) return true;

        annotations
          .forEach((annotation) => {
            let { pos, node } = annotation;
            let newPos = tr.mapping.map(pos);
            let currentNode = tr.doc.nodeAt(pos);

            if (node.eq(currentNode)) {
              tr.setNodeMarkup(newPos, undefined, {
                ...node.attrs,
                ...attrs,
              });
            }
          });

        return true;
      },

      /**
       * Delete annotations associated with a field.
       * @param fieldIdOrArray The field ID or array of field IDs.
       * @example 
       * editor.commands.deleteFieldAnnotations('123')
       * @example
       * editor.commands.deleteFieldAnnotations(['123', '456'])
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

      /**
       * Set `hidden` for annotations matching predicate.
       * Other annotations become unhidden.
       * @param predicate The predicate function.
       * @example 
       * editor.commands.setFieldAnnotationsHiddenByCondition((node) => {
       *   let ids = ['111', '222', '333'];
       *   return ids.includes(node.attrs.fieldId);
       * })
       */
      setFieldAnnotationsHiddenByCondition: (
        predicate = () => false,
      ) => ({
        dispatch,
        state,
        chain,
      }) => {
        let annotations = getAllFieldAnnotations(state);

        if (!annotations.length) return false;

        if (dispatch) {
          let otherAnnotations = [];
          let matchedAnnotations = annotations.filter((annotation) => {
            if (predicate(annotation.node)) return annotation;
            else otherAnnotations.push(annotation);
          });

          return chain()
            .updateFieldAnnotationsAttributes(matchedAnnotations, { hidden: true })
            .updateFieldAnnotationsAttributes(otherAnnotations, { hidden: false })
            .run();
        }

        return true;
      },

      /**
       * Unset `hidden` for all annotations.
       * @example 
       * editor.commands.unsetFieldAnnotationsHidden()
       */
      unsetFieldAnnotationsHidden: () => ({
        dispatch,
        state,
        commands,
      }) => {
        let annotations = getAllFieldAnnotations(state);

        if (!annotations.length) return false;

        if (dispatch) {
          return commands
            .updateFieldAnnotationsAttributes(annotations, { hidden: false })
        }

        return true;
      },

      /**
       * Set `visibility` for all annotations (without changing the layout).
       * @param visibility The visibility value (visible, hidden).
       * @example
       * editor.commands.setFieldAnnotationsVisibility('visible');
       * @example
       * editor.commands.setFieldAnnotationsVisibility('hidden');
       */
      setFieldAnnotationsVisibility: (visibility = 'visible') => ({
        dispatch,
        state,
        commands,
      }) => {
        let annotations = getAllFieldAnnotations(state);

        if (!annotations.length) return false;

        let containsVisibility = this.options.visibilityOptions.includes(visibility);
        
        if (!containsVisibility) return false;

        if (dispatch) {
          return commands.updateFieldAnnotationsAttributes(annotations, {
            visibility,
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
