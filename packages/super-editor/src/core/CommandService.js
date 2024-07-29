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
    const props = this.createProps(tr);

    const commandEntries = Object.entries(this.rawCommands);
    const transformed = commandEntries.map(([name, command]) => {
      const method = (...args) => {
        const fn = command(...args)(props);
        
        if (!tr.getMeta('preventDispatch')) {
          view.dispatch(tr);
        }
        
        return fn;
      };

      return [name, method];
    });
    
    return Object.fromEntries(transformed);
  }

  get chain() {
    return () => this.createChain();
  }

  get can() {
    return () => this.createChain();
  }

  /**
   * Creates "chain".
   * @param startTr Start transaction.
   * @param shouldDispatch Should dispatch or not.
   */
  createChain(startTr, shouldDispatch = true) {
    const { editor, state, rawCommands } = this;
    const { view } = editor;
    const callbacks = [];
    const hasStartTr = !!startTr;
    const tr = startTr || state.tr;

    const run = () => {
      if (
        !hasStartTr
        && shouldDispatch
        && !tr.getMeta('preventDispatch')
      ) {
        view.dispatch(tr);
      }
      return callbacks.every((cb) => cb === true);
    };

    const entries = Object.entries(rawCommands).map(([name, command]) => {
      const chainedCommand = (...args) => {
        const props = this.createProps(tr, shouldDispatch);
        const callback = command(...args)(props);

        callbacks.push(callback);
        
        return chain;
      };
      return [name, chainedCommand];
    });

    const chain = {
      ...Object.fromEntries(entries),
      run,
    };
    return chain;
  }

  /**
   * Creates "can".
   * @param startTr Start transaction.
   */
  createCan(startTr) {
    const { rawCommands, state } = this;
    const dispatch = false;
    const tr = startTr || state.tr;
    const props = this.createProps(tr, dispatch);
    const formattedCommands = Object.fromEntries(
      Object.entries(rawCommands).map(([name, command]) => {
        return [name, (...args) => command(...args)({ ...props, dispatch: undefined })];
      }),
    );

    return {
      ...formattedCommands,
      chain: () => this.createChain(tr, dispatch),
    };
  }

  /**
   * Creates default props for the command method.
   * @param {*} tr Transaction.
   * @param {*} shouldDispatch Check if should dispatch.
   * @returns Object with props.
   */
  createProps(tr, shouldDispatch = true) {
    const { editor, state, rawCommands } = this;
    const { view } = editor;

    const props = {
      tr,
      editor,
      view,
      state: chainableEditorState(tr, state),
      dispatch: shouldDispatch ? () => null : null,
      chain: () => this.createChain(tr, shouldDispatch),
      can: () => this.createCan(tr),
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
