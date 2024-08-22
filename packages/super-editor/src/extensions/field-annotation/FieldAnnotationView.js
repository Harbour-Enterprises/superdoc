import { Attribute } from '@core/index.js';

export class FieldAnnotationView {
  editor;

  node;

  decorations;

  getPos;

  htmlAttributes;

  dom;

  annotationClass;

  annotationContentClass;

  borderColor;

  constructor(options) {
    this.editor = options.editor;
    this.node = options.node;
    this.decorations = options.decorations;
    this.getPos = options.getPos;

    this.htmlAttributes = options.htmlAttributes;
    this.annotationClass = options.annotationClass;
    this.annotationContentClass = options.annotationContentClass;
    this.borderColor = options.borderColor;

    this.handleAnnotationClick = this.handleAnnotationClick.bind(this);
    
    this.buildView();
    this.attachEventListeners();
  }

  buildView() {
    let { type } = this.node.attrs;

    let handlers = {
      text: (...args) => this.buildTextView(...args),
      image: (...args) => this.buildImageView(...args),
      signature: (...args) => this.buildSignatureView(...args),
      default: (...args) => this.buildTextView(...args),
    };

    let buildHandler = handlers[type] ?? handlers.default;

    buildHandler();
  }

  buildTextView() {
    let { displayLabel } = this.node.attrs;

    let { annotation } = this.#createAnnotation({
      displayLabel
    });
    
    this.dom = annotation;
  }

  buildImageView() {
    let { displayLabel, imageSrc } = this.node.attrs;

    let { annotation, content } = this.#createAnnotation();

    if (imageSrc) {
      let img = document.createElement('img');
      img.src = imageSrc;
      img.alt = displayLabel;
      img.style.pointerEvents = 'none';
      img.style.verticalAlign = 'middle';

      content.append(img);
      
      annotation.style.display = 'inline-block';
      content.style.display = 'inline-block';
    } else {
      content.innerHTML = displayLabel;
    }

    this.dom = annotation;
  }

  buildSignatureView() {
    let { displayLabel, imageSrc } = this.node.attrs;

    displayLabel = displayLabel || 'Signature';

    let { annotation, content } = this.#createAnnotation();

    if (imageSrc) {
      let img = document.createElement('img');
      img.src = imageSrc;
      img.alt = displayLabel;
      img.style.pointerEvents = 'none';
      img.style.verticalAlign = 'middle';
      img.style.maxHeight = '30px';
      
      content.append(img);

      annotation.style.display = 'inline-block';
      content.style.display = 'inline-block';
    } else {
      content.innerHTML = displayLabel;
    }

    this.dom = annotation;
  }

  #createAnnotation({
    displayLabel,
  } = {}) {
    let annotation = document.createElement('span');
    annotation.classList.add(this.annotationClass);

    let content = document.createElement('span');
    content.classList.add(this.annotationContentClass);
    content.style.pointerEvents = 'none';
    content.contentEditable = 'false';

    if (displayLabel) {
      content.innerHTML = displayLabel;
    }
    
    annotation.append(content);

    let annotationStyle = [
      `border: 1px solid ${this.borderColor}`,
      `padding: 1px 2px`,
    ].join('; ');

    let mergedAttrs = Attribute.mergeAttributes(this.htmlAttributes, {
      style: annotationStyle,
    });

    for (let [key, value] of Object.entries(mergedAttrs)) {
      annotation.setAttribute(key, value);
    }

    return {
      annotation,
      content,
    };
  }

  attachEventListeners() {
    this.dom.addEventListener('click', this.handleAnnotationClick);
  }

  removeEventListeners() {
    this.dom.removeEventListener('click', this.handleAnnotationClick);
  }

  handleAnnotationClick(event) {
    this.editor.emit('fieldAnnotationClicked', {
      editor: this.editor,
      node: this.node,
      nodePos: this.getPos(),
      event,
      currentTarget: event.currentTarget,
    });
  }

  stopEvent(event) {
    return false;
  }

  /*
  // https://github.com/ueberdosis/tiptap/blob/main/packages/extension-table/src/TableView.ts
  // https://github.com/ueberdosis/tiptap/blob/main/packages/core/src/NodeView.ts
  ignoreMutation(mutation) {
    console.log({
      type: mutation.type,
      target: mutation.target,
    });
  } */

  // update(node) {}

  destroy() {
    this.removeEventListeners();
  }

  updateAttributes(attributes) {
    this.editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(this.getPos(), undefined, {
        ...this.node.attrs,
        ...attributes,
      });
      return true;
    });
  }
}
