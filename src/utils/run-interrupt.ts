import process from "node:process";

export class RunInterruptedError extends Error {
  readonly exitCode: number;

  constructor(exitCode = 130) {
    super("Interrupted");
    this.name = "RunInterruptedError";
    this.exitCode = exitCode;
  }
}

export function isRunInterruptedError(e: unknown): e is RunInterruptedError {
  return e instanceof RunInterruptedError;
}

export function interruptErrorFromSignal(signal: AbortSignal): RunInterruptedError {
  const reason = signal.reason;
  if (isRunInterruptedError(reason)) {
    return reason;
  }
  return new RunInterruptedError();
}

export function throwIfAbortSignal(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw interruptErrorFromSignal(signal);
  }
}

export interface RunInterruptScope {
  readonly signal: AbortSignal;
  throwIfAborted(): void;
  dispose(): void;
}

function passthroughInterruptScope(signal: AbortSignal): RunInterruptScope {
  return {
    signal,
    throwIfAborted() {
      if (signal.aborted) {
        throw interruptErrorFromSignal(signal);
      }
    },
    dispose() {},
  };
}

/**
 * Install SIGINT/SIGTERM handlers for a CLI run. First signal aborts `signal` and prints
 * `message`; a second signal force-exits with the conventional exit code (130 / 143).
 */
export function createRunInterruptScope(
  message = "\n⚠️  Interrupted — stopping after in-flight work and printing partial summary…\n"
): RunInterruptScope {
  const ac = new AbortController();
  let disposed = false;
  let warned = false;

  const onSignal = (name: "SIGINT" | "SIGTERM"): void => {
    if (disposed) {
      return;
    }
    const exitCode = name === "SIGTERM" ? 143 : 130;
    if (!warned) {
      warned = true;
      process.stderr.write(message);
      ac.abort(new RunInterruptedError(exitCode));
      return;
    }
    process.exit(exitCode);
  };

  const onSigint = (): void => onSignal("SIGINT");
  const onSigterm = (): void => onSignal("SIGTERM");
  process.once("SIGINT", onSigint);
  process.once("SIGTERM", onSigterm);

  return {
    signal: ac.signal,
    throwIfAborted() {
      if (ac.signal.aborted) {
        throw interruptErrorFromSignal(ac.signal);
      }
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      process.off("SIGINT", onSigint);
      process.off("SIGTERM", onSigterm);
    },
  };
}

/** Attach an abort signal, installing handlers only when the caller did not pass one. */
export function bindRunInterruptScope<T extends { abortSignal?: AbortSignal }>(
  opts: T
): { opts: T & { abortSignal: AbortSignal }; scope: RunInterruptScope } {
  if (opts.abortSignal) {
    return {
      opts: opts as T & { abortSignal: AbortSignal },
      scope: passthroughInterruptScope(opts.abortSignal),
    };
  }
  const scope = createRunInterruptScope();
  return { opts: { ...opts, abortSignal: scope.signal }, scope };
}

/** Exit with the interrupt code without printing a generic CLI error. */
export function exitIfRunInterrupted(e: unknown): boolean {
  if (!isRunInterruptedError(e)) {
    return false;
  }
  process.exit(e.exitCode);
  return true;
}

/** Resolve the exit code after an interrupt (from an error or an aborted signal). */
export function runInterruptedExitCode(e: unknown, signal?: AbortSignal): number {
  if (isRunInterruptedError(e)) {
    return e.exitCode;
  }
  if (signal?.aborted) {
    return interruptErrorFromSignal(signal).exitCode;
  }
  return 130;
}
