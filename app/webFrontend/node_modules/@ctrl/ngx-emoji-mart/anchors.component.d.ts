import { EventEmitter } from '@angular/core';
import { EmojiCategory } from '@ctrl/ngx-emoji-mart/ngx-emoji';
export declare class AnchorsComponent {
    categories: EmojiCategory[];
    color?: string;
    selected?: string;
    i18n: any;
    anchorClick: EventEmitter<{
        category: EmojiCategory;
        index: number;
    }>;
    svgs: any;
    trackByFn(idx: number, cat: EmojiCategory): string;
    handleClick($event: Event, index: number): void;
}
