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

import { injectable, inject } from 'inversify';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common';
import { Command } from '@theia/core';
import { KeybindingContribution, ApplicationShell, KeybindingRegistry, KeyCode, Key } from '@theia/core/lib/browser';
import { TerminalSearchWidgetFactory } from './terminal-search-widget';
import { TerminalWidgetImpl } from '@theia/terminal/lib/browser/terminal-widget-impl';
import { TerminalSearchKeybindingContext } from './terminal-search-keybinding-context';
import { TerminalKeybindingContexts } from '@theia/terminal/lib/browser/terminal-keybinding-contexts';

export namespace TerminalSearchCommands {
    const TERMINAL_SEARCH_CATEGORY = 'TerminalSearch';
    export const TERMINAL_FIND_TEXT: Command = {
        id: 'terminal:find',
        category: TERMINAL_SEARCH_CATEGORY,
        label: 'Find'
    };
    export const TERMINAL_FIND_TEXT_CANCEL: Command = {
        id: 'terminal:find:cancel',
        category: TERMINAL_SEARCH_CATEGORY,
        label: 'Hide find widget'
    };
}

@injectable()
export class TerminalSearchFrontendContribution implements CommandContribution, KeybindingContribution {

    constructor(
        @inject(ApplicationShell) protected readonly shell: ApplicationShell,
    ) { }

    @inject(TerminalSearchWidgetFactory)
    protected terminalSearchWidgetFactory: TerminalSearchWidgetFactory;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(TerminalSearchCommands.TERMINAL_FIND_TEXT);
        registry.registerHandler(TerminalSearchCommands.TERMINAL_FIND_TEXT.id, {
            isEnabled: () => this.shell.activeWidget instanceof TerminalWidgetImpl,
            execute: () => {
                const termWidget = (this.shell.activeWidget as TerminalWidgetImpl);
                const searchTextWidget = this.terminalSearchWidgetFactory(termWidget.getTerminal(), termWidget.node, termWidget.id);
                searchTextWidget.show();
                searchTextWidget.focus();
                termWidget.onTerminalDidClose(() => {
                    searchTextWidget.dispose();
                });
            }
        });
        registry.registerCommand(TerminalSearchCommands.TERMINAL_FIND_TEXT_CANCEL);
        registry.registerHandler(TerminalSearchCommands.TERMINAL_FIND_TEXT_CANCEL.id, {
            isEnabled: () => this.shell.activeWidget instanceof TerminalWidgetImpl,
            execute: () => {
                const termWidget = (this.shell.activeWidget as TerminalWidgetImpl);
                const searchTextWidget = this.terminalSearchWidgetFactory(termWidget.getTerminal(), termWidget.node, termWidget.id);
                searchTextWidget.hide();
            }
        });
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        // unregister Ctrl + F pseudo command for terminal widget.
        keybindings.unregisterKeybinding({
                command: KeybindingRegistry.PASSTHROUGH_PSEUDO_COMMAND,
                keybinding: KeyCode.createKeyCode({ key: Key.KEY_F, ctrl: true }).toString(),
                context: TerminalKeybindingContexts.terminalActive
        });
        keybindings.registerKeybinding({
            command: TerminalSearchCommands.TERMINAL_FIND_TEXT.id,
            keybinding: 'ctrlcmd+f',
            context: TerminalKeybindingContexts.terminalActive
        });

        keybindings.registerKeybinding({
            command: TerminalSearchCommands.TERMINAL_FIND_TEXT_CANCEL.id,
            keybinding: 'esc',
            context: TerminalSearchKeybindingContext.disableSearch
        });
    }
}
