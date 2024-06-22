import { Schema as PmSchema } from 'prosemirror-model';
import { getExtensionConfigField } from './helpers/getExtensionConfigField.js';
import { cleanSchemaItem } from './helpers/cleanSchemaItem.js';
import { callOrGet } from './utilities/callOrGet.js';

// TODO:Artem - Add support for attributes.

/**
 * Schema class is used to create and work with schema. 
 */
export class Schema {

  /**
   * Creates PM schema by resolved extensions.
   * @param extensions List of extensions.
   * @param editor Editor instance.
   * @returns PM schema
   */
  static createSchemaByExtensions(extensions, editor) {    
    const { nodeExtensions, markExtensions } = {
      nodeExtensions: extensions.filter((e) => e.type === 'node'),
      markExtensions: extensions.filter((e) => e.type === 'mark'),
    };
    const topNode = nodeExtensions.find((e) => getExtensionConfigField(e, 'topNode'))?.name;

    const attributes = Schema.getAttributesFromExtensions(extensions);
    const nodes = Schema.#createNodesSchema(nodeExtensions, attributes, editor);
    const marks = Schema.#createMarksSchema(markExtensions, attributes, editor);
    const schema = { topNode, nodes, marks };

    return new PmSchema(schema);
  }

  /**
   * Creates nodes schema by Node extensions.
   * @param nodeExtensions Node extensions.
   * @param attributes List of all extension attributes.
   * @param editor Editor instance.
   * @returns Nodes schema.
   */
  static #createNodesSchema(nodeExtensions, attributes, editor) {
    const nodeEntries = nodeExtensions.map((extension) => {
      const extensionAttributes = attributes.filter((a) => a.type === extension.name);

      const context = createExtensionContext(extension, editor);
      const attrs = Object.fromEntries(extensionAttributes.map((attr) => {
        return [attr.name, { default: attr?.attribute?.default }];
      }));
      const schema = cleanSchemaItem({
        content: callOrGet(getExtensionConfigField(extension, 'content', context)),
        group: callOrGet(getExtensionConfigField(extension, 'group', context)),
        marks: callOrGet(getExtensionConfigField(extension, 'marks', context)),
        inline: callOrGet(getExtensionConfigField(extension, 'inline', context)),
        atom: callOrGet(getExtensionConfigField(extension, 'atom', context)),
        selectable: callOrGet(getExtensionConfigField(extension, 'selectable', context)),
        draggable: callOrGet(getExtensionConfigField(extension, 'draggable', context)),
        code: callOrGet(getExtensionConfigField(extension, 'code', context)),
        defining: callOrGet(getExtensionConfigField(extension, 'defining', context)),
        isolating: callOrGet(getExtensionConfigField(extension, 'isolating', context)),
        attrs,
      });

      const parseDOM = callOrGet(getExtensionConfigField(extension, 'parseDOM', context));
      if (parseDOM) {
        schema.parseDOM = parseDOM;
      }
      const renderDOM = getExtensionConfigField(extension, 'renderDOM', context);
      if (renderDOM) {
        schema.toDOM = (node) => renderDOM({ node });
      }

      return [extension.name, schema];
    });

    const nodes = Object.fromEntries(nodeEntries);
    return nodes;
  }

  /**
   * Creates marks schema by Marks extensions.
   * @param markExtensions Marks extensions.
   * @param attributes List of all extension attributes.
   * @param editor Editor instance.
   * @returns Marks schema.
   */
  static #createMarksSchema(markExtensions, attributes, editor) {
    const markEntries = markExtensions.map((extension) => {
      const extensionAttributes = attributes.filter((a) => a.type === extension.name);

      const context = createExtensionContext(extension, editor);
      const attrs = Object.fromEntries(extensionAttributes.map((attr) => {
        return [attr.name, { default: attr?.attribute?.default }];
      }));
      const schema = cleanSchemaItem({
        group: callOrGet(getExtensionConfigField(extension, 'group', context)),
        inclusive: callOrGet(getExtensionConfigField(extension, 'inclusive', context)),
        excludes: callOrGet(getExtensionConfigField(extension, 'excludes', context)),
        spanning: callOrGet(getExtensionConfigField(extension, 'spanning', context)),
        code: callOrGet(getExtensionConfigField(extension, 'code', context)),
        attrs,
      });

      const parseDOM = callOrGet(getExtensionConfigField(extension, 'parseDOM', context));
      if (parseDOM) {
        schema.parseDOM = parseDOM;
      }
      const renderDOM = getExtensionConfigField(extension, 'renderDOM', context);
      if (renderDOM) {
        schema.toDOM = (mark) => renderDOM({ mark });
      }

      return [extension.name, schema];
    });

    const marks = Object.fromEntries(markEntries);
    return marks;
  }

  /**
   * Get a list of all attributes defined in the extensions.
   * @param extensions List of all extensions.
   * @returns Extension attributes.
   */
  static getAttributesFromExtensions(extensions) {
    const extensionAttributes = [];
    const defaultAttribute = {
      default: null,
      rendered: true,
      renderDOM: null,
      parseDOM: null,
    };
    
    const globalAttributes = Schema.#getGlobalAttributes(extensions, defaultAttribute);
    const nodeAndMarksAttributes = Schema.#getNodeAndMarksAttributes(extensions, defaultAttribute);

    extensionAttributes.push(
      ...globalAttributes, 
      ...nodeAndMarksAttributes
    );

    return extensionAttributes;
  }

  /**
   * Get a list of global attributes defined in the extensions.
   * @param extensions List of all extensions.
   * @param defaultAttribute Default attribute.
   * @returns Global extension attributes.
   */
  static #getGlobalAttributes(extensions, defaultAttribute) {
    const extensionAttributes = [];

    for (const extension of extensions) {
      const context = createExtensionContext(extension);
      const addGlobalAttributes = getExtensionConfigField(
        extension, 
        'addGlobalAttributes', 
        context,
      );

      if (!addGlobalAttributes) continue;

      const globalAttributes = addGlobalAttributes();

      for (const globalAttr of globalAttributes) {
        for (const type of globalAttr.types) {
          const entries = Object.entries(globalAttr.attributes);
          for (const [name, attribute] of entries) {
            extensionAttributes.push({
              type, 
              name,
              attribute: {
                ...defaultAttribute,
                ...attribute,
              },
            });
          }
        }
      }
    }

    return extensionAttributes;
  }

  /**
   * Get a list of attributes defined in the Node and Mark extensions.
   * @param {*} extensions List of all extensions.
   * @param {*} defaultAttribute Default attribute.
   * @returns Node and Mark extension attributes.
   */
  static #getNodeAndMarksAttributes(extensions, defaultAttribute) {
    const extensionAttributes = [];
    const nodeAndMarkExtensions = extensions.filter((e) => {
      return e.type === 'node' || e.type === 'mark';
    });
    
    for (const extension of nodeAndMarkExtensions) {
      const context = createExtensionContext(extension);
      const addAttributes = getExtensionConfigField(
        extension, 
        'addAttributes', 
        context,
      );

      if (!addAttributes) continue;

      const attributes = addAttributes();
      for (const [name, attribute] of Object.entries(attributes)) {
        const merged = {
          ...defaultAttribute,
          ...attribute,
        };

        if (typeof merged.default === 'function') {
          merged.default = merged.default();
        }

        extensionAttributes.push({
          type: extension.name,
          name,
          attribute: merged,
        });
      }
    }

    return extensionAttributes;
  }
}

function createExtensionContext(extension, editor) {
  const context = {
    name: extension.name,
    options: extension.options,
    storage: extension.storage,
  };
  if (editor) context.editor = editor;
  return context;
}
