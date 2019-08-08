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
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import * as React from 'react';
import '../../../src/browser/style/terminal-search.css';
import { TerminalSearchBox } from '../base/terminal-search-box';
import { Terminal } from 'xterm';
import { findNext, findPrevious } from 'xterm/lib/addons/search/search';
import { ISearchOptions } from 'xterm/lib/addons/search/Interfaces';
import { Key } from '@theia/core/lib/browser';

export const TERMINAL_SEARCH_WIDGET_FACTORY_ID = 'terminal-search';
export const TerminalSearchWidgetFactory = Symbol('TerminalSearchWidgetFactory');
export type TerminalSearchWidgetFactory = (terminal: Terminal) => TerminalSearchWidget;

@injectable()
export class TerminalSearchWidget extends ReactWidget implements TerminalSearchBox {

    private searchInput: HTMLInputElement | null;
    private searchBox: HTMLDivElement | null;
    private searchOptions: ISearchOptions = {};

    @inject(Terminal)
    protected terminal: Terminal;

    constructor() {
        super();

        this.node.classList.add('theia-search-terminal-widget-parent');

        this.onInputChanged = this.onInputChanged.bind(this);
        this.onSearchInputFocus = this.onSearchInputFocus.bind(this);
        this.onSearchInputBlur = this.onSearchInputBlur.bind(this);

        this.onNextButtonClicked = this.onNextButtonClicked.bind(this);
        this.onPreviousButtonClicked = this.onPreviousButtonClicked.bind(this);

        this.hide = this.hide.bind(this);
        this.onCaseSensitiveOptionClicked = this.onCaseSensitiveOptionClicked.bind(this);
        this.onWroleWordOptionClicked = this.onWroleWordOptionClicked.bind(this);
        this.onRegexOptionClicked = this.onRegexOptionClicked.bind(this);
    }

    attach(parentElement: Element): void {
        parentElement.appendChild(this.node);
    }

    focus(): void {
        if (this.searchInput) {
            this.searchInput.focus();
        }
    }

    render(): React.ReactNode {
        return <div className='search-terminal-widget'>
            <div className='search-elem-box' ref={searchBox => this.searchBox = searchBox} >
                <input
                    title='Find'
                    type='text'
                    placeholder='Find'
                    ref={ip => this.searchInput = ip}
                    onKeyUp={this.onInputChanged}
                    onFocus={this.onSearchInputFocus}
                    onBlur={this.onSearchInputBlur}
                />
                <div title='Match case' tabIndex={0} className='search-elem match-case' onClick={this.onCaseSensitiveOptionClicked}></div>
                <div title='Match whole word' tabIndex={0} className='search-elem whole-word' onClick={this.onWroleWordOptionClicked}></div>
                <div title='Use regular expression' tabIndex={0} className='search-elem use-regexp' onClick={this.onRegexOptionClicked}></div>
            </div>
            <button title='Previous match' className='search-elem' onClick={this.onPreviousButtonClicked}>&#171;</button>
            <button title='Next match' className='search-elem' onClick={this.onNextButtonClicked}>&#187;</button>
            <button title='Close' className='search-elem close' onClick={this.hide}></button>
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

    private onCaseSensitiveOptionClicked(event: React.MouseEvent<HTMLSpanElement>): void {
        this.searchOptions.caseSensitive = !this.searchOptions.caseSensitive;
        this.updateSearchInputBox(this.searchOptions.caseSensitive, event.currentTarget);
    }

    private onWroleWordOptionClicked(event: React.MouseEvent<HTMLSpanElement>): void {
        this.searchOptions.wholeWord = !this.searchOptions.wholeWord;
        this.updateSearchInputBox(this.searchOptions.wholeWord, event.currentTarget);
    }

    private onRegexOptionClicked(event: React.MouseEvent<HTMLSpanElement>): void {
        this.searchOptions.regex = !this.searchOptions.regex;
        this.updateSearchInputBox(this.searchOptions.regex, event.currentTarget);
    }

    private updateSearchInputBox(enable: boolean, optionElement: HTMLSpanElement): void {
        if (enable) {
            optionElement.classList.add('option-enabled');
        } else {
            optionElement.classList.remove('option-enabled');
        }
        this.searchInput!.focus();
    }

    private onInputChanged(event: React.KeyboardEvent): void {
        // move to previous search result on `Shift + Enter`
        if (event && event.shiftKey && event.keyCode === Key.ENTER.keyCode) {
            this.search(false, 'previous');
            return;
        }
        // move to next search result on `Enter`
        if (event && event.keyCode === Key.ENTER.keyCode) {
            this.search(false, 'next');
            return;
        }

        this.search(true, 'next');
    }

    search(incremental: boolean, searchDirection: 'next' | 'previous'): void {
        if (this.searchInput) {
            this.searchOptions.incremental = incremental;
            const searchText = this.searchInput.value;

            if (searchDirection === 'next') {
                findNext(this.terminal, searchText, this.searchOptions);
            }

            if (searchDirection === 'previous') {
                findPrevious(this.terminal, searchText, this.searchOptions);
            }
        }
    }

    private onNextButtonClicked(): void {
        this.search(false, 'next');
    }

    private onPreviousButtonClicked(): void {
        this.search(false, 'previous');
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
