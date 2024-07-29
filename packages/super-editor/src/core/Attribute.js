import { getExtensionConfigField } from './helpers/getExtensionConfigField.js';

/**
 * Attribute class is used to work with attributes. 
 */
export class Attribute {

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
      keepOnSplit: true,
    };
    
    const globalAttributes = Attribute.#getGlobalAttributes(extensions, defaultAttribute);
    const nodeAndMarksAttributes = Attribute.#getNodeAndMarksAttributes(extensions, defaultAttribute);

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

  /**
   * Inserts extension attributes into parseRule attributes.
   * @param {*} parseRule PM ParseRule.
   * @param {*} extensionAttrs List of attributes to insert.
   */
  static insertExtensionAttrsToParseRule(parseRule, extensionAttrs) {
    if ('style' in parseRule) {
      return parseRule;
    }

    return {
      ...parseRule,

      getAttrs: (node) => {
        const oldAttrs = parseRule.getAttrs ? parseRule.getAttrs(node) : parseRule.attrs;
        if (oldAttrs === false) return false;

        const parseFromString = (value) => {
          if (typeof value !== 'string') return value;
          if (value.match(/^[+-]?(\d*\.)?\d+$/)) return Number(value);
          if (value === 'true') return true;
          if (value === 'false') return false;
          return value;
        };

        let newAttrs = {};
        for (const item of extensionAttrs) {
          const value = item.attribute.parseDOM
            ? item.attribute.parseDOM(node)
            : parseFromString(node.getAttribute(item.name));

          if (value === null || value === undefined) continue;

          newAttrs = {
            ...newAttrs,
            [item.name]: value,
          };
        }

        return { ...oldAttrs, ...newAttrs };
      },
    };
  }

  /**
   * Get attributes to render.
   * @param nodeOrMark Node or Mark.
   * @param extensionAttrs Extension attributes.
   */
  static getAttributesToRender(nodeOrMark, extensionAttrs) {
    const attributes = extensionAttrs
      .filter((item) => item.attribute.rendered)
      .map((item) => {
        if (!item.attribute.renderDOM) {
          const { name } = item;
          return {
            [name]: nodeOrMark.attrs[name],
          };
        }

        return item.attribute.renderDOM(nodeOrMark.attrs) || {};
      });

    let mergedAttrs = {};
    for (const attribute of attributes) {
      mergedAttrs = Attribute.mergeAttributes(mergedAttrs, attribute);
    }

    return mergedAttrs;
  }

  /**
   * Merges attributes.
   * @param objects Objects with attributes.
   * @returns Object with merged attributes.
   */
  static mergeAttributes(...objects) {
    const merged = objects
      .filter(item => !!item)
      .reduce((items, item) => {
        const mergedAttributes = { ...items };

        for (const [key, value] of Object.entries(item)) {
          const exists = mergedAttributes[key];
          
          if (!exists) {
            mergedAttributes[key] = value;
            continue;
          }

          if (key === 'class') {
            const valueClasses = value ? value.split(' ') : [];
            const existingClasses = mergedAttributes[key] ? mergedAttributes[key].split(' ') : [];
            const insertClasses = valueClasses.filter(
              (valueClass) => !existingClasses.includes(valueClass),
            );

            mergedAttributes[key] = [...existingClasses, ...insertClasses].join(' ');
          } else if (key === 'style') {
            mergedAttributes[key] = [mergedAttributes[key], value].join('; ');
          } else {
            mergedAttributes[key] = value;
          }
        }

        return mergedAttributes;
      }, {});
  
    return merged;  
  }
  
  /**
   * Get extension attributes that should be splitted by keepOnSplit flag.
   * @param extensionAttrs Array of attributes.
   * @param typeName The type of the extension.
   * @param attributes The extension attributes.
   * @returns The splitted attributes.
   */
  static getSplittedAttributes(extensionAttrs, typeName, attributes) {
    const attributesEntries = Object.entries(attributes);
    const filtered = attributesEntries.filter(([name]) => {
      const extensionAttr = extensionAttrs.find((item) => {
        return item.type === typeName && item.name === name;
      });
      if (!extensionAttr) return false;
      return extensionAttr.attribute.keepOnSplit;
    });
    return Object.fromEntries(filtered);
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
