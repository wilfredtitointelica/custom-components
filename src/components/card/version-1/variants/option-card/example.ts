import { Component, signal } from '@angular/core';

import { IntCard } from '../../base/card';

interface OptionItem {
  readonly id: string;
  readonly icon: string;
  readonly title: string;
  readonly description: string;
  readonly disabled?: boolean;
}

const MOCK_OPTIONS: readonly OptionItem[] = [
  { id: 'visa', icon: 'pi-credit-card', title: 'Visa', description: 'Fees billed by Visa' },
  { id: 'mastercard', icon: 'pi-wallet', title: 'Mastercard', description: 'Fees billed by Mastercard' },
  { id: 'amex', icon: 'pi-building', title: 'American Express', description: 'Fees billed by Amex' },
  { id: 'other', icon: 'pi-ellipsis-h', title: 'Other brands', description: 'Not available yet', disabled: true },
];

@Component({
  selector: 'card-option-card-example',
  templateUrl: './example.html',
  imports: [IntCard],
})
export class CardOptionCardExample {
  protected readonly options = MOCK_OPTIONS;
  /** Id of the chosen option (single choice). */
  protected readonly selected = signal<string | null>('visa');

  protected select(option: OptionItem): void {
    if (!option.disabled) this.selected.set(option.id);
  }
}
