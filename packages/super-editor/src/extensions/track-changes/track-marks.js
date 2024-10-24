import { Mark, Attribute } from '@core/index.js';
import {TrackMarksMarkName} from "./constants.js";

export const TrackMarks = Mark.create({
    name: TrackMarksMarkName,

    addOptions() {
        return {
            htmlAttributes: {},
        }
    },

    // before and after are arrays of objects with the following structure:
    // {
    //     type: string, //the name of the mark
    //     attrs: object, //the attributes of the mark
    // }
    addAttributes() {
        return {
            // word id like `<w:ins w:id="1"`
            wid: {
                default: "",
                parseHTML: element => element.getAttribute('wid'),
                renderHTML: attributes => {
                    return {
                        'wid': attributes.wid,
                    }
                },
            },
            author: {
                default: "imported",
                parseHTML: element => element.getAttribute('author'),
                renderHTML: attributes => {
                    return {
                        'author': attributes.author,
                    }
                },
            },
            date: {
                default: () => (new Date()).toISOString(),
                parseHTML: element => element.getAttribute('date'),
                renderHTML: attributes => {
                    return {
                        'date': attributes.date,
                    }
                },
            },
            before: {
                default: () => [],
                parseHTML: element => {
                    try {
                        return JSON.parse(element.getAttribute('before'))
                    } catch (e) {
                        console.warn("Paste parse error on TrackMarks before", e)
                    }
                    return [];
                },
                renderHTML: attributes => {
                    return {
                        'before': JSON.stringify(attributes.before),
                    }
                },
            },
            after: {
                default: () => [],
                parseHTML: element => {
                    try {
                        return JSON.parse(element.getAttribute('after'))
                    } catch (e) {
                        console.warn("Paste parse error on TrackMarks after", e)
                    }
                    return [];
                },
                renderHTML: attributes => {
                    return {
                        'after': JSON.stringify(attributes.after),
                    }
                },
            }
        }
    },

    parseDOM() {
        return false;
    },

    renderDOM({ htmlAttributes }) {
        return ['span', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes, {inserted: true}), 0];
    },
});
