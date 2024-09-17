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
            authorEmail: {
                default: null,
                renderHTML: attributes => {
                    return {
                        'authorEmail': attributes.authorEmail,
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
        return ['span', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes, {deleted: true}), 0];
    },
});
