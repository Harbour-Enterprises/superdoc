import './style.css';
import fw4 from './assets/sample.pdf?url'
import pdfUrl from './assets/lucygoose.pdf?url'
import docxUrl from './assets/sample.docx?url'
import docxWithComments from './assets/lists_and_comments.docx?url'
// import docxWithComments from './assets/overlapped-comments.docx?url'

import { fields, annotations, conversations } from './assets/test-data';
import Superdoc from './index.js';


/* For local dev */
const initializeApp = async () => {
  const config = {
    selector: '#app',
    user: {
      name: 'Nick Bernal',
      email: 'nick@harbourshare.com',
    },
    documents: [
      // {
      //   id: '456',
      //   type: 'pdf',
      //   data: pdfUrl,
      //   fields,
      //   annotations,
      //   conversations,
      // },
      {
        type: 'docx',
        data: docxWithComments,
        id: '123',
      },
      // {
      //   id: '789',
      //   type: 'pdf',
      //   data: fw4,
      // }
    ],
    modules: {
      'comments': {
        // readOnly: true,
        // allowResolve: false,
      },
      'hrbr-fields': {},
    }
  }
  new Superdoc(config);
}

if (import.meta.env.DEV) {
  initializeApp();
}
