import { Mark, Attribute } from '@core/index.js';
import {TrackInsertMarkName} from "./constants.js";

export const TrackInsert = Mark.create({
    name: TrackInsertMarkName,

    addOptions() {
        return {
            htmlAttributes: {},
        }
    },

    addGlobalAttributes() {
        return [{
            types: ["bulletList", "orderedList", "listItem", "paragraph", "heading", "blockQuote", "codeBlock", "table", "tableRow", "tableCell", "tableHeader"],
            attributes: {
                track: {
                    default: [],
                    parseHTML: element => {
                        try {
                            const res = JSON.parse(element.getAttribute('track'));
                            if(Array.isArray(res)) {
                                return res;
                            }
                        } catch (e) {
                            return [];
                        }
                        return [];
                    },
                    renderHTML: attributes => {
                        return {
                            'track': JSON.stringify(attributes.track),
                        }
                    },
                }
            }
        }]
    },

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
                default: (new Date()).toISOString(),
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
        return ['span', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes, {inserted: true}), 0];
    },
});
