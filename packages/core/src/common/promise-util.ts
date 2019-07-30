/********************************************************************************
 * Copyright (C) 2017 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

/**
 * Simple implementation of the deferred pattern.
 * An object that exposes a promise and functions to resolve and reject it.
 */
export class Deferred<T> {
    resolve: (value?: T) => void;
    reject: (err?: any) => void; // tslint:disable-line

    promise = new Promise<T>((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
    });
}

export class AsyncOperationQueue {

    // tslint:disable-next-line:no-any
    protected lastCall: Promise<any> = Promise.resolve();
    protected callCount: number = 0;
    protected maxSize?: number;

    constructor(options: AsyncOperationQueue.Options = {}) {
        if (typeof options.maxSize === 'number') {
            this.maxSize = options.maxSize;
        }
    }

    run<T>(operation: () => Promise<T>): AsyncOperationQueue.Handle<T> {
        if (this.maxSize && this.callCount >= this.maxSize) {
            throw new Error('Operation queue is full.');
        } else {
            this.callCount++;
        }
        let cancellationReason: Error;
        const promise = this.lastCall.then(async () => {
            try {
                if (cancellationReason) {
                    throw cancellationReason;
                }
                return await operation();
            } finally {
                this.callCount--;
            }
        });
        this.lastCall = promise.catch(console.error);
        return {
            promise,
            cancel(reason) {
                cancellationReason = reason || new Error('disposed');
            },
        };
    }

    atomic() {
        const self = this;
        // tslint:disable-next-line:no-any
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            if (typeof descriptor.value !== 'function') {
                throw new Error('AsyncOperationQueue.atomic() can only decorate functions');
            }
            const method = descriptor.value as Function;
            // tslint:disable-next-line:no-any
            descriptor.value = async function (this: any, ...args: any[]) {
                return self.run(() => method.apply(this, args)).promise;
            };
        };
    }

}
export namespace AsyncOperationQueue {
    export interface Options {
        maxSize?: number;
    }
    export interface Handle<T> {
        promise: Promise<T>;
        cancel(reason?: Error): void;
    }
}

/**
 * Decorator "debouncing" calls to the same method returning a promise.
 * Makes the function "atomic", as in it won't run twice concurrently.
 * Queue is per instance.
 */
export function atomic(options: AtomicOptions = {}) {
    // tslint:disable-next-line:no-any
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new Error('@atomic(options) can only decorate a function.');
        }
        const scope: AtomicScope = options.scope || DefaultAtomicScope;
        const method: Function = descriptor.value;
        // tslint:disable-next-line:no-any
        descriptor.value = async function (this: any, ...args: any[]) {
            const queue = getScopedAtomicQueue(scope, this, { maxSize: options.maxConcurrentCalls });
            return queue.run(() => method.apply(this, args)).promise;
        };
    };
}
const AtomicQueueMap = Symbol('AtomicQueueMap');
const DefaultAtomicScope = Symbol('DefaultAtomicScope');
type AtomicScope = string | number | Symbol;
interface AtomicOptions {
    maxConcurrentCalls?: number;
    scope?: AtomicScope;
}
// tslint:disable-next-line:no-any
function getScopedAtomicQueue(scope: AtomicScope, object: any, options: AsyncOperationQueue.Options): AsyncOperationQueue {
    const map: Map<AtomicScope, AsyncOperationQueue> = object[AtomicQueueMap] || (object[AtomicQueueMap] = new Map());
    let queue = map.get(scope);
    if (!queue) {
        map.set(scope, queue = new AsyncOperationQueue(options));
    }
    return queue;
}
