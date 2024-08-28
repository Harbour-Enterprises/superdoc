import { Mark, Attribute } from '@core/index.js';
import {TrackDeleteMarkName} from "./constants.js";

export const TrackDelete = Mark.create({
    name: TrackDeleteMarkName,

    addOptions() {
        return {
            htmlAttributes: {},
        }
    },

    addAttributes() {
        return {
            // word id like `<w:del w:id="1"`
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
        return ['span', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes, {class: `deletionMark`}), 0];
    },
});
