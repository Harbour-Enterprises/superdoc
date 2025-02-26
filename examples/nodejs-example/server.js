import './file-polyfill.js'; // Import the file polyfill since node.js doesn't have a File object
import express from 'express';
import { getEditor } from "./super-editor.js";
import fs from 'fs/promises';


const initServer = async () => {

  // Init express
  const app = express();
  app.use(express.json());

  /**
   * Health check endpoint
   */
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
    });
  });


  app.get('/', async (req, res) => {
    try {
      // Load the default document
      const documentData = await fs.readFile('./document.docx');
      // Initialize the editor
      const editor = await getEditor(documentData);

      res.send({message: 'SuperEditor initialized'});

    } catch (error) {
      console.error(error);
      res.status(422).send('Failed to initialize SuperEditor');
    }
  });



  /**
   * Initialize the server
  */
  app.listen(3000, '0.0.0.0', () => {
    console.debug(`Server running on port 3000`);
  });

  return app;
};

export const app = await initServer();
