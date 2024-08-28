import { Mark, Attribute } from '@core/index.js';
import {TrackInsertMarkName} from "./constants.js";

export const TrackInsert = Mark.create({
    name: TrackInsertMarkName,

    addOptions() {
        return {
            htmlAttributes: {},
        }
    },

    addAttributes() {
        return {
            // word id like `<w:ins w:id="1"`
            wid: {
                default: null,
                parseHTML: element => element.getAttribute('wid'),
                renderHTML: attributes => {
                    return {
                        'wid': attributes.wid,
                    }
                },
            },
            author: {
                default: null,
                parseHTML: element => element.getAttribute('author'),
                renderHTML: attributes => {
                    return {
                        'author': attributes.author,
                    }
                },
            },
            date: {
                default: null,
                parseHTML: element => element.getAttribute('date'),
                renderHTML: attributes => {
                    return {
                        'date': attributes.date,
                    }
                },
            }
        }
    },

    parseDOM() {
        return false;
    },

    renderDOM({ htmlAttributes }) {
        return ['span', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes, {class: `insertionMark`}), 0];
    },
});
