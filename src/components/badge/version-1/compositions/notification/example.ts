import { Component } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntOverlayBadge } from '../../base/badge';

@Component({
  selector: 'badge-notification-example',
  templateUrl: './example.html',
  imports: [IntOverlayBadge, IntButton],
})
export class BadgeNotificationExample {}
