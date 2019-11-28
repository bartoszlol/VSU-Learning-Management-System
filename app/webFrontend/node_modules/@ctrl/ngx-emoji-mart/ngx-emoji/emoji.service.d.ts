import { CompressedEmojiData, EmojiData } from './data/data.interfaces';
import { Emoji } from './emoji.component';
export declare class EmojiService {
    uncompressed: boolean;
    names: {
        [key: string]: EmojiData;
    };
    emojis: EmojiData[];
    constructor();
    uncompress(list: CompressedEmojiData[]): void;
    getData(emoji: EmojiData | string, skin?: Emoji['skin'], set?: Emoji['set']): EmojiData | null;
    unifiedToNative(unified: string): string;
    sanitize(emoji: EmojiData | null): EmojiData | null;
    getSanitizedData(emoji: string | EmojiData, skin?: Emoji['skin'], set?: Emoji['set']): EmojiData;
}
