/********************************************************************************
 * Copyright (C) 2019 Ericsson and others.
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

import { expect } from 'chai';
import { Deferred, atomic } from './promise-util';

class Test {

    protected static scopeA = 'a';
    protected static scopeB = 'b';

    @atomic({ scope: Test.scopeA })
    async methodA<T>(lock: Promise<void>, value: T) {
        await lock.catch(e => undefined);
        return value;
    }

    @atomic({ scope: Test.scopeB })
    async methodB<T>(lock: Promise<void>, value: T) {
        await lock.catch(e => undefined);
        return value;
    }

    @atomic({ scope: Test.scopeA })
    async methodC<T>(lock: Promise<void>, value: T) {
        await lock.catch(e => undefined);
        return value;
    }

}

describe('promise-utils @atomic()', () => {

    it('call order should be respected', async () => {
        const test = new Test();
        let buffer = '';

        const lockA = new Deferred<void>();
        const lockB = new Deferred<void>();
        const lockC = new Deferred<void>();

        const testResult = (expected: string) => (result: string) => {
            expect(result).to.equal(expected);
            buffer += result;
            return result;
        };
        // Call order is important: `a`, `b` and then `c`.
        const promiseA = test.methodA(lockA.promise, 'a').then(testResult('a'));
        const promiseB = test.methodA(lockB.promise, 'b').then(testResult('b'));
        // Note: methodC is in the same scope as methodA
        const promiseC = test.methodC(lockC.promise, 'c').then(testResult('c'));

        // Resolve locks out of order.
        lockC.resolve();
        await lockC.promise;
        lockB.resolve();
        await lockB.promise;

        // At this point, promiseA should still be locked.
        expect(buffer).to.equal('');

        // Resolve first queued to unlock the others.
        lockA.resolve();
        await Promise.all([promiseA, promiseB, promiseC]);
        expect(buffer).to.equal('abc');
    });

    it('queue should be per instance; timeout = fail.', async () => {

        const testA = new Test();
        const testB = new Test();

        const lockA = new Deferred<void>();
        const lockB = new Deferred<void>();

        testA.methodA(lockA.promise, 'a');
        const promiseB = testB.methodA(lockB.promise, 'b');

        lockB.resolve();
        expect(await promiseB).to.equal('b');
    });

    it ('scoped operations should not interfere; timeout = fail', async () => {
        const test = new Test();

        const lockA = new Deferred<void>();
        const lockB = new Deferred<void>();

        test.methodA(lockA.promise, 'a');
        const promiseB = test.methodB(lockB.promise, 'b');

        lockB.resolve();
        await lockB.promise;

        lockB.resolve();
        expect(await promiseB).to.equal('b');
    });

});
