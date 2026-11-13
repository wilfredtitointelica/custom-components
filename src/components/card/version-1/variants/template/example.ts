import { Component } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntCard } from '../../base/card';

@Component({
  selector: 'card-template-example',
  templateUrl: './example.html',
  imports: [IntCard, IntButton],
})
export class CardTemplateExample {}
