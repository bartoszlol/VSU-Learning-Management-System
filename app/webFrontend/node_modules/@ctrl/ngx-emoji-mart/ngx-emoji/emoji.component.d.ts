import { EventEmitter, OnChanges } from '@angular/core';
import { EmojiData } from './data/data.interfaces';
import { EmojiService } from './emoji.service';
export interface Emoji {
    native: boolean;
    forceSize: boolean;
    tooltip: boolean;
    skin: 1 | 2 | 3 | 4 | 5 | 6;
    sheetSize: 16 | 20 | 32 | 64;
    set: 'apple' | 'google' | 'twitter' | 'emojione' | 'messenger' | 'facebook' | '';
    size: number;
    emoji: string | EmojiData;
    backgroundImageFn: (set: string, sheetSize: Emoji['sheetSize']) => string;
    fallback?: (data: any) => string;
    emojiOver: EventEmitter<EmojiEvent>;
    emojiLeave: EventEmitter<EmojiEvent>;
    emojiClick: EventEmitter<EmojiEvent>;
}
export interface EmojiEvent {
    emoji: EmojiData;
    $event: Event;
}
export declare class EmojiComponent implements OnChanges, Emoji {
    private emojiService;
    skin: Emoji['skin'];
    set: Emoji['set'];
    sheetSize: Emoji['sheetSize'];
    native: Emoji['native'];
    forceSize: Emoji['forceSize'];
    tooltip: Emoji['tooltip'];
    size: Emoji['size'];
    emoji: Emoji['emoji'];
    fallback?: Emoji['fallback'];
    hideObsolete: boolean;
    emojiOver: Emoji['emojiOver'];
    emojiLeave: Emoji['emojiLeave'];
    emojiClick: Emoji['emojiClick'];
    style: any;
    title: string;
    unified?: string | null;
    custom: boolean;
    SHEET_COLUMNS: number;
    isVisible: boolean;
    backgroundImageFn: Emoji['backgroundImageFn'];
    constructor(emojiService: EmojiService);
    ngOnChanges(): boolean;
    getPosition(): string;
    getData(): EmojiData;
    getSanitizedData(): EmojiData;
    handleClick($event: Event): void;
    handleOver($event: Event): void;
    handleLeave($event: Event): void;
}
