import { chainableEditorState } from './helpers/chainableEditorState.js';

/**
 * CommandService is the main class to work with commands.
 */
export class CommandService {
  editor;

  rawCommands;
  
  constructor(props) {
    this.editor = props.editor;
    this.rawCommands = this.editor.extensionService.commands;
  }
  
  /**
   * Static method for creating a service.
   * @param args Arguments for the constructor.
   */
  static create(...args) {
    return new CommandService(...args);
  }

  /**
   * Get editor state.
   */
  get state() {
    return this.editor.state;
  }

  /**
   * Get all commands with wrapped command method.
   */
  get commands() {
    const { editor, state } = this;
    const { view } = editor;
    const { tr } = state;
    const props = this.createCommandProps(tr);

    const commandEntries = Object.entries(this.rawCommands);
    const transformed = commandEntries.map(([name, command]) => {
      const method = (...args) => {
        const fn = command(...args)(props);

        view.dispatch(tr);

        return fn;
      };

      return [name, method];
    });
    
    return Object.fromEntries(transformed);
  }

  /**
   * Creates default props for the command method.
   * @param {*} tr Transaction.
   * @param {*} shouldDispatch Check if should dispatch.
   * @returns Object with props.
   */
  createCommandProps(tr, shouldDispatch = true) {
    const { editor, state, rawCommands } = this;
    const { view } = editor;

    const props = {
      tr,
      editor,
      view,
      state: chainableEditorState(tr, state),
      dispatch: shouldDispatch ? () => null : null,
      get commands() {
        return Object.fromEntries(
          Object.entries(rawCommands).map(([name, command]) => {
            return [name, (...args) => command(...args)(props)];
          }),
        );
      },
    };

    return props;
  }
};
