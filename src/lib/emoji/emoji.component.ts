import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';

import { EmojiData } from './data/data.interfaces';
import { DEFAULT_BACKGROUNDFN, EmojiService } from './emoji.service';

export interface Emoji {
  /** Renders the native unicode emoji */
  isNative: boolean;
  forceSize: boolean;
  tooltip: boolean;
  skin: 1 | 2 | 3 | 4 | 5 | 6;
  sheetSize: 16 | 20 | 32 | 64;
  set:
    | 'apple'
    | 'google'
    | 'twitter'
    | 'emojione'
    | 'messenger'
    | 'facebook'
    | '';
  size: number;
  emoji: string | EmojiData;
  backgroundImageFn: (set: string, sheetSize: number) => string;
  fallback?: (data: any, props: any) => string;
  emojiOver: EventEmitter<EmojiEvent>;
  emojiLeave: EventEmitter<EmojiEvent>;
  emojiClick: EventEmitter<EmojiEvent>;
}

export interface EmojiEvent {
  emoji: EmojiData;
  $event: Event;
}

@Component({
  selector: 'ngx-emoji',
  template: `
  <span *ngIf="isVisible"
    (click)="handleClick($event)"
    (touchend)="handleClick($event, true)"
    (mouseenter)="handleOver($event)"
    (mouseleave)="handleLeave($event)"
    [title]="title"
    class="emoji-mart-emoji"
    [class.emoji-mart-emoji-native]="isNative"
    [class.emoji-mart-emoji-custom]="custom">
    <span [ngStyle]="style">
      <ng-template [ngIf]="isNative">{{ unified }}</ng-template>
      <ng-content></ng-content>
    </span>
  </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  preserveWhitespaces: false,
})
export class EmojiComponent implements OnChanges, Emoji {
  @Input() skin: Emoji['skin'] = 1;
  @Input() set: Emoji['set'] = 'apple';
  @Input() sheetSize: Emoji['sheetSize'] = 64;
  /** Renders the native unicode emoji */
  @Input() isNative: Emoji['isNative'] = false;
  @Input() forceSize: Emoji['forceSize'] = false;
  @Input() tooltip: Emoji['tooltip'] = false;
  @Input() size: Emoji['size'] = 24;
  @Input() emoji: Emoji['emoji'] = '';
  @Input() fallback?: Emoji['fallback'];
  @Input() hideObsolete = false;
  @Input() emitOnTouch = false;
  @Input() SHEET_COLUMNS = 52;
  @Output() emojiOver: Emoji['emojiOver'] = new EventEmitter();
  @Output() emojiLeave: Emoji['emojiLeave'] = new EventEmitter();
  @Output() emojiClick: Emoji['emojiClick'] = new EventEmitter();
  style: any;
  title = '';
  unified?: string | null;
  custom = false;
  isVisible = true;
  // TODO: replace 4.0.3 w/ dynamic get verison from emoji-datasource in package.json
  @Input() backgroundImageFn: Emoji['backgroundImageFn'] = DEFAULT_BACKGROUNDFN;

  constructor(private emojiService: EmojiService) {}

  ngOnChanges() {
    if (!this.emoji) {
      return (this.isVisible = false);
    }
    const data = this.getData();
    if (!data) {
      return (this.isVisible = false);
    }
    // const children = this.children;
    this.unified = data.native || null;
    if (data.custom) {
      this.custom = data.custom;
    }
    if (!data.unified && !data.custom) {
      return (this.isVisible = false);
    }
    if (this.tooltip) {
      this.title = data.shortNames[0];
    }
    if (data.obsoletedBy && this.hideObsolete) {
      return (this.isVisible = false);
    }

    if (this.isNative && data.unified && data.native) {
      // hide older emoji before the split into gendered emoji
      this.style = { fontSize: `${this.size}px` };

      if (this.forceSize) {
        this.style.display = 'inline-block';
        this.style.width = `${this.size}px`;
        this.style.height = `${this.size}px`;
      }
    } else if (data.custom) {
      this.style = {
        width: `${this.size}px`,
        height: `${this.size}px`,
        display: 'inline-block',
        backgroundImage: `url(${data.imageUrl})`,
        backgroundSize: 'contain',
      };
    } else {
      if (data.hidden.length && data.hidden.includes(this.set)) {
        if (this.fallback) {
          this.style = { fontSize: `${this.size}px` };
          this.unified = this.fallback(data, this);
        } else {
          return (this.isVisible = false);
        }
      } else {
        this.style = this.emojiService.emojiSpriteStyles(
          data.sheet,
          this.set,
          this.size,
          this.sheetSize,
          this.backgroundImageFn,
          this.SHEET_COLUMNS,
        );
      }
    }
    return (this.isVisible = true);
  }

  getData() {
    return this.emojiService.getData(this.emoji, this.skin, this.set);
  }

  getSanitizedData(): EmojiData {
    return this.emojiService.getSanitizedData(this.emoji, this.skin, this.set) as EmojiData;
  }

  handleClick($event: Event, touch = false) {
    const emoji = this.getSanitizedData();
    if (!touch || this.emitOnTouch) {
      this.emojiClick.emit({ emoji, $event });
    }
  }

  handleOver($event: Event) {
    const emoji = this.getSanitizedData();
    this.emojiOver.emit({ emoji, $event });
  }

  handleLeave($event: Event) {
    const emoji = this.getSanitizedData();
    this.emojiLeave.emit({ emoji, $event });
  }
}
