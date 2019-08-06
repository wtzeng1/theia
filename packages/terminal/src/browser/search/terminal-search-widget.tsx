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

import { injectable, inject, postConstruct } from 'inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import * as React from 'react';
import '../../../src/browser/style/terminal-search.css';
import { Terminal } from 'xterm';
import * as ReactDOM from 'react-dom';
import { findNext, findPrevious } from 'xterm/lib/addons/search/search';
import { ISearchOptions } from 'xterm/lib/addons/search/Interfaces';
import { Key } from '@theia/core/lib/browser';

export const TerminalSearchWidgetFactory = Symbol('TerminalSearchWidgetFactory');
export type TerminalSearchWidgetFactory = (terminal: Terminal, node: Element, terminalWdgId: string) => TerminalSearchWidget;

export enum TerminalSearchOption {
    CaseSensitiv = 'caseSensitive',
    WholeWord = 'wholeWord',
    RegExp = 'regex'
}

@injectable()
export class TerminalSearchWidget extends ReactWidget {

    private searchInput: HTMLInputElement | null;
    private searchBox: HTMLDivElement | null;
    private searchOptions: ISearchOptions = {};

    @inject(Terminal)
    protected terminal: Terminal;

    @inject(Element)
    protected element: Element;

    @postConstruct()
    protected init(): void {
        this.hide();
        this.element.appendChild(this.node);
        ReactDOM.render(<React.Fragment>{this.render()}</React.Fragment>, this.node);
    }

    isActivated(): boolean {
        return this.node.clientWidth > 0;
    }

    focus(): void {
        if (this.searchInput) {
            this.searchInput.focus();
        }
    }

    update(): void {
        ReactDOM.render(<React.Fragment>{this.render()}</React.Fragment>, this.node);
    }

    render(): React.ReactNode {
        this.node.classList.add('find-terminal-widget-parent');
        return <div className='find-terminal-widget'>
            <div className='search-elem-box' ref={searchBox => this.searchBox = searchBox} >
                <input
                    title='Find'
                    type='text'
                    placeholder='Find'
                    ref={ip => this.searchInput = ip}
                    onKeyUp={event => this.search(event)}
                    onFocus={() => this.onSearchInputFocus()}
                    onBlur={() => this.onSearchInputBlur()}
                />
                {this.renderSearchOption('search-elem match-case', TerminalSearchOption.CaseSensitiv, 'Match case')}
                {this.renderSearchOption('search-elem whole-word', TerminalSearchOption.WholeWord, 'Match whole word')}
                {this.renderSearchOption('search-elem use-regexp', TerminalSearchOption.RegExp, 'Use regular expression')}
            </div>
            <button title='Previous match' className='search-elem' onClick={() => this.findPrevious()}>&#171;</button>
            <button title='Next match' className='search-elem' onClick={() => this.findNext()}>&#187;</button>
            <button title='Close' className='search-elem close' onClick={() => this.hide()}></button>
       </div>;
    }

    onSearchInputFocus(): void {
        if (this.searchBox) {
            this.searchBox.classList.add('option-enabled');
        }
    }

    onSearchInputBlur(): void {
        if (this.searchBox) {
            this.searchBox.classList.remove('option-enabled');
        }
    }

    protected renderSearchOption(style: string, optionName: string, title: string): React.ReactNode {
        return <div title={title} tabIndex={0} className={style} onClick={event => this.onOptionClicked(event, optionName)}></div>;
    }

    private onOptionClicked(event: React.MouseEvent<HTMLSpanElement>, optionName: string): void {
        let enabled: boolean;
        switch (optionName) {
            case TerminalSearchOption.CaseSensitiv: {
                this.searchOptions.caseSensitive = enabled = !this.searchOptions.caseSensitive;
                break;
            }
            case TerminalSearchOption.WholeWord: {
                this.searchOptions.wholeWord = enabled = !this.searchOptions.wholeWord;
                break;
            }
            case TerminalSearchOption.RegExp: {
                this.searchOptions.regex = enabled = !this.searchOptions.regex;
                break;
            }
            default: throw new Error('Unknown search option!');
        }

        if (enabled) {
            event.currentTarget.classList.add('option-enabled');
        } else {
            event.currentTarget.classList.remove('option-enabled');
        }
        this.searchInput!.focus();
        this.search();
    }

    search(event?: React.KeyboardEvent): void {
        if (event && event.shiftKey && event.keyCode === Key.ENTER.keyCode) {
            this.findPrevious();
            return;
        }
        if (event && event.keyCode === Key.ENTER.keyCode) {
            this.findNext();
            return;
        }
        this.findNext(true);
    }

    protected findNext(incremental?: boolean): void {
        if (this.searchInput) {
            const text = this.searchInput.value;
            findNext(this.terminal, text, { ...this.searchOptions, incremental });
        }
    }

    protected findPrevious(): void {
        if (this.searchInput) {
            const text = this.searchInput.value;
            findPrevious(this.terminal, text, { ...this.searchOptions, incremental: false });
        }
    }

    hide(): void {
        super.hide();
        this.terminal.focus();
    }

    show(): void {
        super.show();
        if (this.searchInput) {
            this.searchInput.select();
        }
    }
}
