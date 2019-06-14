/********************************************************************************
 * Copyright (C) 2019 Red Hat, Inc. and others.
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

import { TerminalSearchFrontendContribution } from './terminal-search-contribution';
import {
    CommandContribution
} from '@theia/core/lib/common';
import { ContainerModule, Container } from 'inversify';
import { TerminalSearchWidgetFactory, TerminalSearchWidget } from './terminal-search-widget';
import { Terminal } from 'xterm';
import { KeybindingContext, KeybindingContribution } from '@theia/core/lib/browser';
import { TerminalSearchDisableContext } from './terminal-search-keybinding-context';

export default new ContainerModule(bind => {
    bind(KeybindingContext).to(TerminalSearchDisableContext).inSingletonScope();

    bind(CommandContribution).to(TerminalSearchFrontendContribution);
    bind(KeybindingContribution).to(TerminalSearchFrontendContribution);

    bind(TerminalSearchWidgetFactory).toDynamicValue(ctx => (terminal: Terminal, node: Element, terminalWdgId: string) => {
        if (ctx.container.isBoundNamed(TerminalSearchWidget, terminalWdgId)) {
            return ctx.container.getNamed(TerminalSearchWidget, terminalWdgId);
        }

        const container = new Container({ defaultScope: 'Singleton' });
        container.bind(Terminal).toConstantValue(terminal);
        container.bind(Element).toConstantValue(node);
        container.bind(TerminalSearchWidget).toSelf().inSingletonScope();

        const widget = container.get(TerminalSearchWidget);
        ctx.container.bind(TerminalSearchWidget).toConstantValue(widget).whenTargetNamed(terminalWdgId);

        return widget;
    });
});
