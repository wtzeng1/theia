/********************************************************************************
 * Copyright (C) 2018 TypeFox and others.
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

import { injectable, inject } from 'inversify';
import { KeybindingContext, ApplicationShell } from '@theia/core/lib/browser';
import { TerminalWidget } from './base/terminal-widget';
import { TerminalSearchWidgetFactory } from './search/terminal-search-widget';
import { TerminalWidgetImpl } from './terminal-widget-impl';

export namespace TerminalKeybindingContexts {
    export const terminalActive = 'terminalActive';
    export const terminalHideSearch = 'hideSearch';
}

@injectable()
export class TerminalActiveContext implements KeybindingContext {
    readonly id: string = TerminalKeybindingContexts.terminalActive;

    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;

    isEnabled(): boolean {
        return this.shell.activeWidget instanceof TerminalWidget;
    }
}

@injectable()
export class TerminalHideSearchContext implements KeybindingContext {
    readonly id: string = TerminalKeybindingContexts.terminalHideSearch;

    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;

    @inject(TerminalSearchWidgetFactory)
    protected terminalSearchWidgetFactory: TerminalSearchWidgetFactory;

    isEnabled(): boolean {
        if (!(this.shell.activeWidget instanceof TerminalWidget)) {
            return false;
        }
        const terminal = (this.shell.activeWidget as TerminalWidgetImpl);
        const searchWidget = this.terminalSearchWidgetFactory(terminal.getTerminal(), terminal.node, terminal.id);
        return searchWidget.isActivated();
    }
}
