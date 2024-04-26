/**
 * A class that captures the receipt of window messages targeted for the defined "channel".
 *
 * This is a partner to the SendChannel. When paired, they form a relatively secure and
 * stable communication "channel".
 *
 * Compared to the SendChannel, the ReceiveChannel is more complex. It must handle
 * registration of listeners and invocation of listeners upon message receipt.
 *
 * Beyond this, it also offers
 * - a one-time event listener, useful for situations in which
 * one is modeling a state machine in which a state serves as a gate, triggered by
 * receipt of a single message
 * - registration of listeners while handling a listener, useful for situtations in
 *   which one message event signals a new state, in which a specific set of listeners
 *   need to be available, but were not before.
 *
 * The pair of Send/Receive channels is designed to be useful in all window messages
 * scenarios, either same-origin or cross-origin.
 */

import { ChannelMessage, MessageEnvelope } from './SendChannel';

/**
 * A listener callback is simply a function which takes a single `payload`
 * argument, and returns nothing.
 *
 * The `payload` argument is arbitrary, JSON-compatible data. It is advisable that it be
 * an object, in order to be somewhat self documenting through properties.
 */
export type ListenerCallback = (
  payload: unknown,
  envelope: MessageEnvelope
) => void;

/**
 * A listener callback to handle the case of an error occuring during executing of the
 * listener callback.
 *
 * Supplying an error callback allows the listener to handle errors.
 */
export type ErrorCallback = (error: Error) => void;

/**
 * Defines the parameters for the ChannelListener class constructor.
 */
interface ChannelListenerParams {
  /** The message name */
  name: string;

  /** A function to be called when a message with the given name is received */
  callback: ListenerCallback;

  /** An optional function to be called when the callback above throws an exception. */
  onError: ErrorCallback;

  /** Remove the listener after receiving the first message. */
  once?: boolean;
}

class ChannelListener {
  /** The message name */
  name: string;

  /** A function to be called when a message with the given name is received */
  callback: ListenerCallback;

  /** An optional function to be called when the callback above throws an exception. */
  onError: ErrorCallback;

  /** Remove the listener after receiving the first message. */
  once?: boolean;

  constructor(params: ChannelListenerParams) {
    const { name, once, callback, onError } = params;
    this.name = name;
    this.once = once;
    this.callback = callback;
    this.onError = onError;
  }
}

export interface ReceiveChannelConstructorParameters {
  /** The window upon which to receive messages */
  window: Window;

  /** The origin for which we wish to receive messages. */
  expectedOrigin: string;

  /** The identifier to use for this "channel"; only messages whose envelope
   * contains this id will be recognized. */
  channel: string;

  /** Spy on sent messages; useful for debugging */
  spy?: (message: ChannelMessage) => void;
}

/**
 * An implementation of a "receive channel", or constrained window message listener.
 *
 * This "channel" will only process messages which have the general shape of a
 * `ChannelMessage`, and whose channel matches the channel of this receiver.
 *
 */

export default class ReceiveChannel {
  /** The window upon which to receive messages */
  window: Window;

  /** The origin for which we wish to receive messages. */
  expectedOrigin: string;

  /** The identifier to use for this "channel"; only messages whose envelope
   * contains this id will be recognized. */
  channel: string;

  /** Spy on sent messages; useful for debugging */
  spy?: (message: ChannelMessage) => void;

  /** A map from message name to an array of listeners */
  listeners: Map<string, Array<ChannelListener>>;

  /** Set to the current function assigned as the listener for "message" events to the
   * given window. */
  currentListener: null | ((event: MessageEvent<unknown>) => void);

  monitorRunning: boolean;

  messageQueue: Array<ChannelMessage>;

  constructor({
    window,
    expectedOrigin,
    channel,
    spy,
  }: ReceiveChannelConstructorParameters) {
    this.window = window;
    this.expectedOrigin = expectedOrigin;
    this.channel = channel;
    this.spy = spy;
    this.listeners = new Map();
    this.currentListener = null;
    this.monitorRunning = false;
    this.messageQueue = [];
  }

  setChannelId(channel: string) {
    this.channel = channel;
  }

  /**
   * Receives all messages sent via postMessage to the associated window.
   *
   * This method's primary task is to filter out any messages not intended for this
   * channel, and then to process the message if it is one we should handle.
   *
   * @private
   *
   * @param messageEvent - a postMessage event
   */
  receiveMessage(messageEvent: MessageEvent<unknown>) {
    if (this.expectedOrigin !== messageEvent.origin) {
      return;
    }

    const message = messageEvent.data;

    // Here we have a series of filters to determine whether this message should be
    // handled by this post message bus.
    // In all cases we simply return.
    if (typeof message !== 'object' || message === null) {
      return;
    }

    if (!('name' in message) || typeof message.name !== 'string') {
      return;
    }

    if (!('envelope' in message)) {
      return;
    }

    if (typeof message.envelope !== 'object' || message.envelope === null) {
      return;
    }

    // Ignore messages intended for another channels.
    if (!('channel' in message.envelope)) {
      return;
    }

    if (message.envelope.channel !== this.channel) {
      return;
    }

    this.messageQueue.push(message as unknown as ChannelMessage);
    this.processMesageQueue();
  }

  processMesageQueue() {
    const messages = this.messageQueue;
    this.messageQueue = [];
    for (const message of messages) {
      this.processMessage(message);
    }
  }

  processMessage(message: ChannelMessage) {
    if (this.spy) {
      try {
        this.spy(message);
      } catch (ex) {
        const message = ex instanceof Error ? ex.message : 'Unknown error';
        // eslint-disable-next-line no-console
        console.error('Error running spy', message, ex);
      }
    }

    const listeners = this.listeners.get(message.name);

    if (!listeners) {
      // We simply ignore messages for which there are no registered handlers, but we do
      // issue a warning.
      // eslint-disable-next-line no-console
      console.warn('No listeners for message', message.name);
      return;
    }

    const newListeners: Array<ChannelListener> = [];
    for (const listener of listeners) {
      try {
        listener.callback(message.payload, message.envelope);
      } catch (ex) {
        try {
          listener.onError(
            ex instanceof Error ? ex : new Error('Unknown error')
          );
        } catch (ex) {
          // eslint-disable-next-line no-console
          console.error('Error in error handler', ex);
        }
      } finally {
        if (!listener.once) {
          newListeners.push(listener);
        }
      }
    }
    this.listeners.set(message.name, newListeners);
  }

  /**
   * Registers a listener object to be available thenceforth from now.
   *
   * Meant to be used internally, as it uses the more complex listener object, rather
   * than explicity parameters, as in `on`.
   *
   * @private
   *
   * @param listener A listener object to be registered
   */
  listen(listener: ChannelListener) {
    let listeners = this.listeners.get(listener.name);
    if (!listeners) {
      listeners = [];
      this.listeners.set(listener.name, listeners);
    }
    listeners.push(listener);
    this.processMesageQueue();
  }

  /**
   * Registers a handler for the given message name.
   *
   * This is the preferred API for listening for a given message.
   *
   * @public
   *
   * @param name The message name
   * @param callback The message listener callback function
   * @param onError An optional error callback function; called if the callback fails
   */
  on(name: string, callback: ListenerCallback, onError?: ErrorCallback) {
    this.listen(
      new ChannelListener({
        name,
        callback,
        onError: (error) => {
          if (onError) {
            onError(error);
          } else {
            // eslint-disable-next-line no-console
            console.error(`Error in listener callback`, error);
          }
        },
      })
    );
  }

  /**
   *
   * @public
   *
   * @param name The message name
   * @param timeout How long to wait for the message to be received
   * @param callback A function to call, accepting the message payload, when and if the
   * message indicated by `name` is received.
   * @param onError Optional callback which will be called if an error occurs calling
   * the callback
   *
   * @returns nothing
   */
  once(name: string, callback: ListenerCallback, onError?: ErrorCallback) {
    this.listen(
      new ChannelListener({
        name,
        once: true,
        callback,
        onError: (error) => {
          if (onError) {
            onError(error);
          } else {
            // eslint-disable-next-line no-console
            console.error('Error in listener callback', error);
          }
        },
      })
    );
  }

  /**
   * Starts the channel listening for window messages.
   *
   * @return nothing
   */
  start() {
    this.currentListener = (message: MessageEvent<unknown>) => {
      this.receiveMessage(message);
    };
    this.window.addEventListener('message', this.currentListener, false);
  }

  /**
   * Stops listening for window messages.
   *
   * @returns nothing
   */
  stop() {
    if (this.currentListener) {
      this.listeners.clear();
      this.window.removeEventListener('message', this.currentListener, false);
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        '"stop" method called without the channel having been started'
      );
    }
  }
}
